import React from 'react';
import { reduxForm, Field } from 'redux-form';
import { func } from 'prop-types';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import TagsField from './TagsField';
import styles from './styles.scss';

const TagEditForm = reduxForm({
  form: 'tagEditForm',
  initialValues: {
    tags: []
  }
})(({ handleSubmit, onCancel, submitting, pristine, invalid }) => (
  <form
    onSubmit={handleSubmit}
    className={styles.tagEditForm}
    data-veritone-component="tag-edit-form"
  >
    <Grid container direction="column" style={{ height: '100%' }}>
      <Grid item xs>
        <Field
          name="tags"
          label="Tag Name(s)"
          placeholder="Enter one or more tags (comma-separated)"
          component={TagsField}
          data-veritone-element="tags-field"
        />
      </Grid>
      <Grid item className={styles.actionButtonsEditMode}>
        <Button
          className={styles.actionButtonEditMode}
          onClick={onCancel}
          disabled={submitting}
          data-veritone-element="cancel-button"
        >
          CANCEL
        </Button>
        <Button
          className={styles.actionButtonEditMode}
          type="submit"
          disabled={submitting || pristine || invalid}
          variant="contained"
          color="primary"
          data-veritone-element="save-button"
        >
          SAVE
        </Button>
      </Grid>
    </Grid>
  </form>
));

TagEditForm.propType = {
  handleSubmit: func
};

export default TagEditForm;