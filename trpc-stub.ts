import {
	AnyProcedure,
	AnyRootTypes,
	AnyRouter,
	CombinedDataTransformer,
	RouterRecord,
	createFlatProxy,
	createRecursiveProxy,
	defaultTransformer,
	inferProcedureOutput,
} from '@trpc/server/unstable-core-do-not-import';
import { PartialDeep } from 'type-fest';

type CypressTRPCMock<$Value extends AnyProcedure> = {
	// These are commented out but you may find them useful
	// input: inferProcedureInput<$Value>;
	// output: inferTransformedProcedureOutput<TRoot, $Value>;
	// transformer: TRoot['transformer'];
	// errorShape: TRoot['errorShape'];

  // This is where you add any stubs you need to use, we've put in some default cypress stubs 
	returns: (value: inferProcedureOutput<$Value>) => Cypress.Chainable<null>;
	returnsPartial: (value: PartialDeep<inferProcedureOutput<$Value>>) => Cypress.Chainable<null>;
	intercept: (
		transformValue?: (value: inferProcedureOutput<$Value>) => any,
	) => Cypress.Chainable<null>;
	wait: (options?: Parameters<typeof cy.wait>[1]) => Cypress.Chainable<null>;
	path: string;
	// add any more cypress methods or other methods here
};

type TRPCMockStub = keyof CypressTRPCMock<any>;

type DecorateRouterRecord<TRoot extends AnyRootTypes, TRecord extends RouterRecord> = {
	[TKey in keyof TRecord]: TRecord[TKey] extends infer $Value
		? $Value extends RouterRecord
			? DecorateRouterRecord<TRoot, $Value>
			: $Value extends AnyProcedure
				? CypressTRPCMock<$Value>
				: never
		: never;
};

type TRPCStub<TRouter extends AnyRouter> = DecorateRouterRecord<
	TRouter['_def']['_config']['$types'],
	TRouter['_def']['record']
>;

interface StubOptions {
	transformer?: CombinedDataTransformer;
}

export function stubTRPC<T extends AnyRouter, Stub = TRPCStub<T>>(options?: StubOptions) {
	const transformer = options?.transformer ?? defaultTransformer;

	const proxy = createFlatProxy<Stub>((key) => {
		return createRecursiveProxy((opts) => {
			const pathCopy = [key, ...opts.path];
			const lastArg: TRPCMockStub = pathCopy.pop() as TRPCMockStub;
			const path = pathCopy.join('.');
			if (lastArg === 'path') {
				return path;
			}
			const typedOpts = opts.args as Parameters<CypressTRPCMock<any>[typeof lastArg]>;
			if (lastArg === 'returns' || lastArg === 'returnsPartial') {
				return cy
					.intercept(`/api/trpc/${path}*`, {
						statusCode: 200,
						body: {
							result: {
								data: { json: transformer.output.serialize(typedOpts[0]) },
							},
						},
					})
					.as(path);
			}
			if (lastArg === 'intercept') {
				return cy
					.intercept(`/api/trpc/${path}*`, (req) => {
						req.continue((res) => {
							if (typedOpts[0]) {
								const output =
									res?.body?.result?.data && transformer.output.deserialize(res.body.result.data);
								const transformedOutput = typedOpts[0](output);
								res.body.result.data = transformer.output.serialize(transformedOutput);
							}
						});
					})
					.as(path);
			}
			if (lastArg === 'wait') {
				const timeout = typedOpts[0]?.timeout;

				return cy.wait(`@${path}`, {
					timeout,
				});
			}
		});
	});
	return proxy;
}
