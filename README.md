# Cypress tRPC Mock Utility

This file provides utilities for mocking tRPC routes in a Cypress testing environment. It is designed to simplify mocking and testing of tRPC APIs by integrating seamlessly with Cypress. It is sort of a fork of [cy-trpc](https://github.com/varugasu/cy-trpc) but has support for tRPC v11.

## Overview

The utility includes:
- **Stubbing tRPC procedures**: Simulate API responses with `returns` and `returnsPartial`.
- **Intercepting requests**: Modify API responses dynamically with `intercept`.
- **Waiting for requests**: Wait for specific API calls with `wait`.

The main export is the `stubTRPC` function, which generates a proxy for stubbing and interacting with tRPC routes.

### Setup:

Copy [trpc-stub](https://github.com/dosu-ai/trpc-cypress/blob/main/trpc-stub.ts) into your repository

Add it to your Cypress globals
```ts
import { stubTRPC } from './trpc-stub';

const trpcStub = stubTRPC<AppRouter>();
cy.api = trpcStub;

declare global {
  namespace Cypress {
		interface Chainable {
			api: typeof trpcStub;
		}
	}
}
```

### Usage:
```ts
// Stub a procedure
trpcMock.myProcedure.returns({ key: 'value' });

// Intercept and transform a procedure's response
trpcMock.myProcedure.intercept((value) => ({
  ...value,
  extraKey: 'extraValue',
}));

// Wait for a procedure call
trpcMock.myProcedure.wait();
```

### API

#### `returns(value: OutputType)`

Stub a tRPC procedure to return a specific response.

```js
trpcMock.someProcedure.returns({ key: 'value' });
```

#### `returnsPartial(value: PartialDeep<OutputType>)`

Stub a tRPC procedure to return a partial response.

```js
trpcMock.someProcedure.returnsPartial({ key: 'partialValue' });
```

#### `intercept(transformValue?: (value: OutputType) => any)`

Intercept a tRPC procedure and dynamically transform the response.

```js
trpcMock.someProcedure.intercept((value) => ({ ...value, newKey: 'newValue' }));
```

#### `wait(options?: Parameters<typeof cy.wait>[1])`

Wait for the mocked tRPC procedure to be called.

```js
trpcMock.someProcedure.wait();
```

#### `path`

Access the full path of the tRPC procedure.

```js
console.log(trpcMock.someProcedure.path); // Outputs: 'someProcedure'
```

## Customization

The utility can be extended to include additional Cypress methods or custom logic. Simply modify the `CypressTRPCMock` type or `stubTRPC` implementation as needed.

## Notes

- The utility relies on Cypress's `cy.intercept` for mocking and request handling.
- Ensure your `tRPC` router and procedure types are properly defined for type safety.
- Default transformers are applied, but custom transformers can be provided via `StubOptions`.

### tRPC Cypress is developed by Dosu AI 

#### Dosu is an AI compaion for your codebase that handles question & answers, issue triage, documentation generation. Check it out over at [dosu.dev](https://dosu.dev/?ref=cy-trpc)!

<a href='https://dosu.dev/' style="background: white; display: inline-block; padding: 10px;">
  <img src="https://dosu.dev/maintaining-should-be-easier.jpg" alt="Maintaing should Be easier than writing code" />
</a>
