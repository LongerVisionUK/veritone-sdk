import React from 'react';

import {
  string,
  bool,
  arrayOf,
  number,
  any,
  objectOf
} from 'prop-types';

import {
  Checkbox,
} from 'components/formComponents';
import { MenuItem } from 'material-ui/Menu';
import Select from 'material-ui/Select';
import Icon from 'material-ui/Icon';
import IconButton from 'material-ui/IconButton';

import SDOTile from 'components/SDO/SDOTile';

import styles from './styles.scss';

export default class DataSetFullScreen extends React.Component {
  static propTypes = {
    numberOfFields: number,
    data: arrayOf(any),
    sdoSourceInfo: objectOf(any)
  };

  static defaultProps = {

  };

  state = {
    checkedAll: false,
    flexValue: 1 / (this.props.numberOfFields + 1),
    // attributeCount: this.props.data[0].attributes.length, // should be dynamic, set for testing
    
  };

  handleSelectChange = (event) => {
    this.setState({
      sourceSelection: event.target.value
    });
  };


  handleCheckboxChange = () => {
    this.setState({
      checkedAll: !this.state.checkedAll
    });
  };

  render() {
    const columnTitles = Object.keys(this.props.data[0]).map((title, index) => {
      return <span className={styles.sdoBasicColumn} style={{flex: this.state.flexValue}} key={index}>{title}</span>
    });
    const SDOTiles = this.props.data.map((SDO, index) => {
      return <SDOTile checkAll={this.state.checkedAll} numberOfFields={this.props.numberOfFields} columns={SDO} key={index} />
    });
    return (
      <div>
        <div className={styles.fullScreenTopBar}>
          <div className={styles.topBarTitle}>{this.props.sdoSourceInfo.dataSetName}</div>
          <div className={styles.iconGroup}>
            <IconButton className={styles.helpIcon} aria-label='help'>
              <Icon className={'icon-help2'}></Icon>
            </IconButton>
            <IconButton className={styles.menuIcon} aria-label='help'>
              <Icon className={'icon-more_vert'}></Icon>
            </IconButton>
            <span className={styles.separator}></span>
            <IconButton className={styles.exitIcon} aria-label='help'>
              <Icon className={'icon-close-exit'}></Icon>
            </IconButton>
          </div>
        </div>
        <div className={styles.tableCard}>
          <div className={styles.sourceTitle}>
            <div className={styles.sourceTitleGroup}>
              <img src={this.props.sdoSourceInfo.sourceImage} alt='' className={styles.imageStyle} />
              <div className={styles.sourceName}>
                {this.props.sdoSourceInfo.sourceName} (Source Name)
              </div>
            </div>
          </div>
          <div className={styles.sdoTableTitle}>
            <Checkbox
              input={{
                onChange: this.handleCheckboxChange,
                value: this.state.checkedAll
              }}
              className={styles.checkbox}
              style={{flex: this.state.flexValue}}
              label=''
            />
            {columnTitles}
            {/* <span className={styles.sdoBasicColumn} style={{flex: this.state.flexValue}}>created_at</span>
            <span className={styles.sdoBasicColumn} style={{flex: this.state.flexValue}}>name</span>
            <span className={styles.sdoBasicColumn} style={{flex: this.state.flexValue}}>time_zone</span>
            <span className={styles.sdoBasicColumn} style={{flex: this.state.flexValue}}>text</span>

            <span className={styles.sdoBasicColumn} style={{flex: this.state.flexValue}}>profile_image</span> */}
            {/* <Attributes attributes={this.state.attributeCount} flexValue={this.state.flexValue}/> */}

            
          </div>
          {SDOTiles}
        </div>
      </div>
    );
  };
};