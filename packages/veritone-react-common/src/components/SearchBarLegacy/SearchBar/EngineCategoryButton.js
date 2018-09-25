import supportedEngineCategoryType from '.';
import { shape, func, string } from 'prop-types';
import React from 'react';

import Tooltip from '@material-ui/core/Tooltip';
import Icon from './Icon';

import styles from './styles.scss';


import cx from 'classnames';

const EngineCategoryButton = ({ engineCategory, addPill, backgroundColor, color }) => {
  const engineCategoryIconClasses = cx(styles['engineCategoryPill']);
  const tooltipClasses = cx(styles['searchPillTooltip']);

  const onAddPill = () => addPill(engineCategory.id);

  return (
    <Tooltip
      title={engineCategory.tooltip}
      placement="bottom"
      key={engineCategory.id}
      className={cx(tooltipClasses)}
    >
      <div className={cx(engineCategoryIconClasses)} onClick={onAddPill} style={ { backgroundColor: backgroundColor } }>
        <Icon iconClass={engineCategory.iconClass} color={color} />
      </div>
    </Tooltip>
  );
};
EngineCategoryButton.propTypes = {
  engineCategory: shape(supportedEngineCategoryType),
  addPill: func,
  color: string
};

export default EngineCategoryButton;