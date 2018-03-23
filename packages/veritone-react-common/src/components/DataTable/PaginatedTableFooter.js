import React from 'react';
import cx from 'classnames';
import IconButton from 'material-ui/IconButton';
import FirstPageIcon from 'material-ui-icons/FirstPage';
import KeyboardArrowLeft from 'material-ui-icons/KeyboardArrowLeft';
import KeyboardArrowRight from 'material-ui-icons/KeyboardArrowRight';
import LastPageIcon from 'material-ui-icons/LastPage';
import { TableCell } from 'material-ui/Table';
import Select from 'material-ui/Select';
import { MenuItem } from 'material-ui/Menu';

import { func, number } from 'prop-types';
import RefreshButton from '/components/RefreshButton';
import styles from './styles/index.scss';

export default class PaginatedTableFooter extends React.Component {
  static propTypes = {
    page: number.isRequired,
    perPage: number.isRequired,
    onChangePage: func.isRequired,
    onChangePerPage: func.isRequired,
    onRefreshPageData: func,
    rowCount: number,
    colSpan: number
  };

  static defaultProps = {
    colSpan: 1
  };

  handleFirstPageButtonClick = event => {
    this.props.onChangePage(event, 0);
  };

  handleBackButtonClick = event => {
    this.props.onChangePage(event, this.props.page - 1);
  };

  handleNextButtonClick = event => {
    this.props.onChangePage(event, this.props.page + 1);
  };

  handleLastPageButtonClick = event => {
    this.props.onChangePage(
      event,
      Math.max(0, Math.ceil(this.props.rowCount / this.props.perPage) - 1),
    );
  };

  render() {
    const { rowCount, page, perPage } = this.props;
    const firstItem = page * perPage + 1;
    const lastItem = Math.min(
      page * perPage + perPage,
      rowCount
    );

    return (
      <TableCell
        colSpan={this.props.colSpan}        
        style={{
          textAlign: 'right'
        }}
      >
        <div className={styles['paginated-footer']}>
          <span className={styles['rows-per-page']}>Rows per page:</span>

          <Select
            value={this.props.perPage}
            onChange={this.props.onChangePerPage}
            className={styles['per-page']}
            style={{
              width: '4em',
              padding: '0 5px',
              margin: '0 5px'
            }}
            autoWidth
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={30}>30</MenuItem>
          </Select>

          <span className={styles['num-items']}>
            {firstItem}–{lastItem} of {rowCount}
          </span>

          {/* .pageLeft and .pageRight are unit test targets */}
          <IconButton
            onClick={this.handleFirstPageButtonClick}
            disabled={page === 0}
          >
            <FirstPageIcon />
          </IconButton>

          <IconButton
            className={cx(styles['page-left'], 'pageLeft')}
            onClick={this.handleBackButtonClick}
            disabled={page === 0}
          >
            <KeyboardArrowLeft />
          </IconButton>

          <IconButton
            className={cx(styles['page-right'], 'pageRight')}
            onClick={this.handleNextButtonClick}
            disabled={page >= Math.ceil(rowCount / perPage) - 1}
          >
            <KeyboardArrowRight />
          </IconButton>

          <IconButton
            onClick={this.handleLastPageButtonClick}
            disabled={page >= Math.ceil(rowCount / perPage) - 1}
          >
            <LastPageIcon />
          </IconButton>

          {this.props.onRefreshPageData &&
            <RefreshButton
              onRefresh={this.props.onRefreshPageData}
              className={cx(styles['refresh'], 'refresh')}
            />}
        
        </div>
      </TableCell>
    )
  }
}

PaginatedTableFooter.muiName = 'TableFooter';

