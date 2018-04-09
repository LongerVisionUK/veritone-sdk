import React from 'react';
import { storiesOf } from '@storybook/react';
import { Provider, connect } from 'react-redux';
import { reducer as formReducer } from 'redux-form';
import { combineReducers, createStore } from 'redux';
import { subDays } from 'date-fns';

import { createLogger } from 'redux-logger';
import { applyMiddleware, compose } from 'redux';

import Scheduler from './';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
  combineReducers({
    form: formReducer
  }),
  composeEnhancers(
    applyMiddleware(
      createLogger({
        collapsed: true
      })
    )
  )
);

@connect(state => ({
  form: state.form.scheduler
}))
class DisplayState extends React.Component {
  /* eslint-disable react/prop-types */
  render() {
    return <pre>{JSON.stringify(this.props.form.values, null, '\t')}</pre>;
  }
}

storiesOf('Scheduler', module).add('Base', () => (
  <Provider store={store}>
    <div>
      <Scheduler
        form="scheduler"
        initialValues={{
          scheduleType: 'continuous'
        }}
      />
      <DisplayState />
    </div>
  </Provider>
));
