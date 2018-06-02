import React, { Component } from 'react';
import { any, bool, string, func, oneOfType} from 'prop-types';

import { omit } from 'lodash';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';

import withMuiThemeProvider from 'helpers/withMuiThemeProvider';

const labelId = 'veritone-alert-dialog-title';
const descriptionId = 'veritone-alert-dialog-description';

@withMuiThemeProvider
export default class AlertDialog extends Component {
  static propTypes = {
    open: bool,
    title: string,
    content: string,
    fullScreen:bool,
    cancelButtonLabel: string,
    approveButtonLabel: string,
    onCancel: func,
    onApprove: func.isRequired,
    cancelValue: oneOfType([any]),
    approveValue: oneOfType([any])
  }

  static defaultProps = {
    open: false,
    title: '',
    content: '',
    fullScreen: false,
    cancelValue: 'cancel',
    approveValue: 'approve',
    cancelButtonLabel: 'Cancel',
    approveButtonLabel: 'Continue'
  }

  handleCancel = (event) => {
    this.props.onCancel(this.props.cancelValue);
  }

  handleApprove = (event) => {
    this.props.onApprove(this.props.approveValue);
  }

  render () {
    const { open, title, content, onCancel, cancelButtonLabel, approveButtonLabel } = this.props;
    const forwardingProps = {...this.props};
    omit(forwardingProps, 'onCancel');
    omit(forwardingProps, 'onApprove');
    omit(forwardingProps, 'cancelValue');
    omit(forwardingProps, 'approveValue');
    omit(forwardingProps, 'cancelButtonLabel');
    omit(forwardingProps, 'approveButtonLabel');
    return (
      <Dialog
        {...forwardingProps}
        open={open}
        onClose={this.handleCancel}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
      >
        {
          title &&
          (<DialogTitle id={labelId}>{title}</DialogTitle>)
        }
        {
          content && 
          (<DialogContent>
            <DialogContentText id={descriptionId}>
              {content}
            </DialogContentText>
          </DialogContent>)
        }
        <DialogActions>
          {
            onCancel && (
              <Button onClick={this.handleCancel} color='primary'>
                {cancelButtonLabel}
              </Button>
            )
          }
          <Button onClick={this.handleApprove} color='primary' autoFocus>
            {approveButtonLabel}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}