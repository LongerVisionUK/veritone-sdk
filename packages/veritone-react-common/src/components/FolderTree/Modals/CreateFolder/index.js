/* eslint-disable react/jsx-no-bind */
import React from 'react';
import Button from '@material-ui/core/Button';
import cx from 'classnames';
import { get } from 'lodash';
import { shape, bool, func } from 'prop-types';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import styles from './styles.scss';

export default function CreateFolder({ open, parentFolder, handleClose, handleSubmit }) {

  const [folderName, setFolderName] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!open) {
      setFolderName('');
      setError('')
    }
  }, [open])

  const onChange = event => {
    const { value } = event.target;
    setFolderName(value);
    validate(value);
  };

  const onCreate = () => {
    validate(folderName);
    if (error === '') {
      handleSubmit(folderName);
    }
  };

  React.useEffect(() => {
    setFolderName('');
    setError('');
    return () => {
      setFolderName('');
      setError('');
    };
  }, []);

  const validate = (folderNameToValid) => {
    if (folderNameToValid.length === 0) {
      return setError('Folder name must not be empty');
    }
    setError('');
  };

  const getContent = () => {
    const parentFolderName = get(parentFolder, 'name', 'Root Folder');
    return `Create folder within "${parentFolderName}"`
  };

  return (
    <Dialog
      fullWidth
      maxWidth='sm'
      open={open}
      onClose={handleClose}
      aria-labelledby="create-folder"
    >
      <DialogTitle id="create-folder">Create Folder</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {getContent()}
        </DialogContentText>
        <div className={cx(styles['folder-name-field'])}>
          <TextField
            autoFocus
            margin="dense"
            id="folder-name"
            label="Folder Name"
            type="text"
            error={error.length !== 0}
            helperText={error}
            value={folderName}
            onChange={onChange}
            fullWidth
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Cancel
          </Button>
        <Button
          disabled={folderName === ''}
          onClick={onCreate}
          color="primary"
        >
          Create
          </Button >
      </DialogActions>
    </Dialog>
  );
}
CreateFolder.propTypes = {
  open: bool,
  parentFolder: shape(Object),
  handleClose: func,
  handleSubmit: func
}
