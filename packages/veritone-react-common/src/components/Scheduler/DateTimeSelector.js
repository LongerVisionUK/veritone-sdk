import React from 'react';
import { string, bool } from 'prop-types';
import { Field } from 'redux-form';
import { FormGroup } from 'material-ui/Form';

import DateTimePicker from '../formComponents/DateTimePicker';
import LabeledInputGroup from './LabeledInputGroup';
import styles from './styles.scss';

const DateTimeSelector = ({ name, label, showIcon }) => (
  <LabeledInputGroup label={label} hasIconOffset={showIcon}>
    <FormGroup className={styles.inputsGroup}>
      <Field
        name={name}
        component={DateTimePicker}
        className={styles.leftInput}
        showTimezone
        showIcon={showIcon}
      />
    </FormGroup>
  </LabeledInputGroup>
);

DateTimeSelector.propTypes = {
  name: string,
  label: string,
  showIcon: bool
};

export default DateTimeSelector;