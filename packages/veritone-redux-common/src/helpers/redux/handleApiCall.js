import { get, without } from 'lodash';
import { guid } from 'helpers/misc';
import { createReducer } from './';

// Creates a reducer and selectors that track the loading state for any api call.
// Designed to be used with callGraphQLApi.

// Use (in a module):

// const {
//   reducer: testReducer,
//   selectors: {
//     isFetching: testIsFetching,
//     fetchingFailed: testFetchingFailed,
//     fetchingFailureMessage: testFetchingFailureMessage
//   }
// } = handleApiCall({
//   types: [GET_TEST, GET_TEST_SUCCESS, GET_TEST_FAILURE]
// });

// export default reduceReducers(
//   testReducer,
//   createReducer(defaultState, {
//     // ...other main reducer stuff
//     [GET_TEST_SUCCESS](state, action) {
//       // handleApiCall doesn't store the resource for you; it only tracks loading
//       // states
//       return {
//         ...state,
//         test: action.payload
//       }
//     }
//   })
// )

// export { testIsFetching, testFetchingFailed, testFetchingFailureMessage }

// There are two options for handling multiple in-flight requests for the same
// resource:

// 1. If a `requestId` is passed to the callGraphQLApi call, that specific request
// (and any others that are given different requestIds) can be tracked individually
// by passing that requestId back to the selectors.

// 2. If no explicit `requestId` is given, only the "latest" call for a given
// resource is tracked. New calls will supersede old ones; old calls will
// still resolve normally, but isFetching() etc will refer to the latest call.

// see tests for examples

function makeApiCallReducer(key, [requestType, successType, failureType]) {
  const defaultState = {
    isFetchingRequestIds: [],
    fetchingFailedRequestIds: [],
    fetchingFailureMessagesByRequestId: {},
    activeRequestId: null
  };

  const apiCallReducer = createReducer(defaultState, {
    [requestType](
      state,
      {
        meta: {
          _internalRequestId
          // _shouldTrackRequestsIndividually = false
        } = {}
      }
    ) {
      return {
        isFetchingRequestIds: [
          ...state.isFetchingRequestIds,
          _internalRequestId
        ],
        fetchingFailedRequestIds: without(
          state.fetchingFailedRequestIds,
          _internalRequestId
        ),
        fetchingFailureMessagesByRequestId: {
          ...state.fetchingFailureMessagesByRequestId,
          [_internalRequestId]: ''
        },
        activeRequestId: _internalRequestId
      };
    },

    [successType](
      state,
      {
        meta: {
          _internalRequestId,
          _shouldTrackRequestsIndividually = false
        } = {}
      }
    ) {
      if (
        !_shouldTrackRequestsIndividually &&
        _internalRequestId !== state.activeRequestId
      ) {
        // ignore calls that have been superseded if not tracking individually
        return state;
      }

      return {
        isFetchingRequestIds: without(
          state.isFetchingRequestIds,
          _internalRequestId
        ),
        fetchingFailedRequestIds: without(
          state.fetchingFailedRequestIds,
          _internalRequestId
        ),
        fetchingFailureMessagesByRequestId: {
          ...state.fetchingFailureMessagesByRequestId,
          [_internalRequestId]: ''
        },
        // don't clear active request -- we need it to find the "last" request
        activeRequestId: state.activeRequestId
      };
    },

    [failureType](
      state,
      {
        payload,
        meta: {
          _internalRequestId,
          _shouldTrackRequestsIndividually = false
        } = {}
      }
    ) {
      if (
        !_shouldTrackRequestsIndividually &&
        _internalRequestId !== state.activeRequestId
      ) {
        // ignore calls that have been superseded if not tracking individually
        return state;
      }

      return {
        isFetchingRequestIds: without(
          state.isFetchingRequestIds,
          _internalRequestId
        ),
        fetchingFailedRequestIds: [
          ...state.fetchingFailedRequestIds,
          _internalRequestId
        ],
        fetchingFailureMessagesByRequestId: {
          ...state.fetchingFailureMessagesByRequestId,
          [_internalRequestId]: payload
        },
        // don't clear active request -- we need it to find the "last" request
        activeRequestId: state.activeRequestId
      };
    }
  });

  return (state = {}, action) => {
    let baseState = state.apiCallHandlers
      ? state
      : { apiCallHandlers: { [key]: defaultState } };

    return {
      ...state,
      apiCallHandlers: {
        ...baseState.apiCallHandlers,
        [key]: apiCallReducer(baseState.apiCallHandlers[key], action)
      }
    };
  };
}

const makeSelectors = key => ({
  isFetching: (localState, optionalRequestId) => {
    const isFetchingRequestIds = get(
      localState.apiCallHandlers,
      [key, 'isFetchingRequestIds'],
      []
    );

    const requestId =
      optionalRequestId || localState.apiCallHandlers[key].activeRequestId;
    return isFetchingRequestIds.includes(requestId);
  },

  fetchingFailed: (localState, optionalRequestId) => {
    const fetchingFailedRequestIds = get(
      localState.apiCallHandlers,
      [key, 'fetchingFailedRequestIds'],
      []
    );

    const requestId =
      optionalRequestId || localState.apiCallHandlers[key].activeRequestId;
    return fetchingFailedRequestIds.includes(requestId);
  },

  fetchingFailureMessage: (localState, optionalRequestId) => {
    const fetchingFailureMessagesByRequestId = get(
      localState.apiCallHandlers,
      [key, 'fetchingFailureMessagesByRequestId'],
      {}
    );

    const requestId =
      optionalRequestId || localState.apiCallHandlers[key].activeRequestId;
    return fetchingFailureMessagesByRequestId[requestId] || '';
  }
});

export default function handleApiCall({
  types: [requestType, successType, failureType]
}) {
  const key = guid();

  return {
    reducer: makeApiCallReducer(key, [requestType, successType, failureType]),
    selectors: makeSelectors(key),
    _key: key
  };
}
