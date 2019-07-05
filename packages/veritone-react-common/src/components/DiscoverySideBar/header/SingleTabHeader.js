import React from 'react';
import { string } from 'prop-types';
import styles from './styles.scss';

const SingleTabHeader = ({ tab }) => {
  return <div className={styles.tabLabel}>{tab}</div>;
};

SingleTabHeader.propTypes = {
  tab: string.isRequired
};

export default SingleTabHeader;
