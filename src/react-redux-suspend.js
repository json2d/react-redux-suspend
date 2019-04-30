import React from "react";
import { connect } from "react-redux";
import { select, take, takeEvery } from "redux-saga/effects";
import createSagaMiddleware from "redux-saga";

// heres our HOC, so we can be fancy pants and decorate our React components
export const suspend = (
  mapStateToInvalidation, 
  mapStateToResolution, 
  watchAction
  ) => UnwrappedComponent => {
  
  let WrappedComponent = props => {
    if (props.isInvalid) {
      // fire off resolution if defined
      if (mapStateToResolution) {
        props.dispatch(props.resolution);
      }

      throw new Promise(resolve => {
        // fire off our suspend action to be handled by our saga
        // note that we're also adding this Promise's the resolve fn in the payload
        // this is the magic callback that tells the React.Suspense component to go away
        props.dispatch(
          actionCreators.suspend({ mapStateToInvalidation, watchAction, unsuspend: resolve })
        );
      });
    }

    // extract props that will live on in the
    const { isInvalid, ...otherProps } = props;

    return <UnwrappedComponent {...otherProps} />;
  };

  const mapStateToProps = (state, props) => ({
    isInvalid: mapStateToInvalidation(state, props),
    resolution: mapStateToResolution(state, props)
  });
  

  // yes it uses 'connect' under the hood
  WrappedComponent = connect(mapStateToProps)(WrappedComponent);

  return WrappedComponent;
};

export const actionTypes = {
  suspend: "react-redux-suspend/SUSPEND"
};

export const actionCreators = {
  suspend: payload => ({ type: actionTypes.suspend, payload })
};

// here's the saga creator that creates the saga that watches for validation and ends suspense

function* suspendSaga(action) {
  const { payload } = action;
  const { watchAction, mapStateToInvalidation, unsuspend } = payload;

  let isInvalid;
  // keep checking for invalidation
  while (true) {
    // wait for action to get dispatched to check invalidation again
    // if watchAction is undefined, waits for any action type
    yield watchAction ? take(watchAction) : take();

    // check invalidation again
    isInvalid = yield select(mapStateToInvalidation);

    // stop checking if valid
    if (!isInvalid) {
      break;
    }
  }

  // resolve thrown Promise to end Suspense
  unsuspend();
}

function* sagas() {
  yield takeEvery(actionTypes.suspend, suspendSaga);
}

// wrap middleware boilerplate
export function createSuspendMiddleware() {
  const middleware = createSagaMiddleware()
  middleware.init = function () { this.run(sagas) }
  return middleware
}