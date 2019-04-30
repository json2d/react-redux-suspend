# react-redux-suspend

😬 `React.Suspense` + `Redux` plugin

## Installation

```sh
yarn add react-redux-suspend
```

## Setup

Configure your store with just little bit of middleware boilerplate.

```javascript
import { createStore, applyMiddleware } from "redux";
import { createSuspendMiddleware } from "./react-redux-suspend";

const suspendMiddleware = createSuspendMiddleware();

const store = createStore(reducer, applyMiddleware(suspendMiddleware));

// must be called after store is created above
suspendMiddleware.init();
```

## Usage

Decorate your component with the `connect` as per usual, and then follow up with `suspend`.

```javascript
import React from "react";
import { connect } from "react-redux";
import { suspend } from "react-redux-suspend";

let Counter = props => (
  <p>
    Clicked: {value} times <button onClick={onIncrement}>+</button>
  </p>
);

Counter.propTypes = {
  value: PropTypes.number.isRequired,
  onIncrement: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
  value: state
});
const mapDispatchToProps = dispatch => ({
  onIncrement: () => dispatch({ type: "INCREMENT" })
});

Counter = connect(
  mapStateToProps,
  mapDispatchToProps
)(Counter);

/* now for the extra part */

const mapStateToInvalidation = state => state === null;
const mapStateToResolution = state => ({ type: "INIT_ASYNC" });
const watchAction = action => action.type === "INIT";

Counter = suspend(
  mapStateToInvalidation, 
  mapStateToResolution, 
  watchAction
)(Counter);
```

Now while `mapStateToInvalidation` evaluates to truthy, the nearest `Suspense` component will be triggered.

Of course you'll need to wrap your newly suspendable component in a `Suspense` component somewhere in your app.

```javascript
const App = props => 
  <Provider store={store}>
    <Suspense fallback={<div>loading...</div>}>
      <Counter/>
    </Suspense>
  </Provider>
```

## License

MIT
