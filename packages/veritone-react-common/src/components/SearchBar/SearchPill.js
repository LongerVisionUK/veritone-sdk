import React from 'react';
import Chip from 'material-ui/Chip';

import cx from 'classnames';
import { string, func } from 'prop-types';
import styles from './styles.scss';

import Icon from './Icon';

const searchPillLabelClass = cx(styles['searchPillLabel']);


const searchPillClass = cx(styles['searchPill']);
const deleteIconClass = cx(styles['deleteIcon']);

const SearchPill = ({ engineIconClass, label, remove, open, toggle, highlighted }) => {
  var searchPillClasses = cx( { [`${styles['highlighted']}`] : highlighted } )
  return (
  <Chip
    avatar={<Icon iconClass={engineIconClass} color={'grey '} size={'1.5em'} />}
    label={label}
    className={ searchPillClasses }
    classes={{ root: searchPillClass ,label: searchPillLabelClass, deleteIcon: deleteIconClass }}
    onDelete={remove}
    onClick={toggle}
  />
  )
};
SearchPill.propTypes = {
  engineIconClass: string.isRequired,
  label: string.isRequired,
  remove: func,
  open: func
};

export default SearchPill;
