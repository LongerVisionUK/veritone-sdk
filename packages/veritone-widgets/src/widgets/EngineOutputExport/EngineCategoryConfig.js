import React, { Component } from 'react';
import { forEach, get, includes, find, kebabCase } from 'lodash';
import { string, bool, shape, func, arrayOf, number } from 'prop-types';
import { connect } from 'react-redux';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import IconButton from '@material-ui/core/IconButton';
import Collapse from '@material-ui/core/Collapse';
import Button from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContentText from '@material-ui/core/DialogContentText';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ClosedCaptionIcon from '@material-ui/icons/ClosedCaption';

import EngineConfigItem from './EngineConfigItem';
import SubtitleConfigForm from './SubtitleConfigForm';
import styles from './styles.scss';

import * as engineOutputExportModule from '../../redux/modules/engineOutputExport';

@connect(
  (state, { categoryId }) => ({
    category: engineOutputExportModule.getCategoryById(state, categoryId),
    initialSubtitleConfig: engineOutputExportModule.getSubtitleConfig(
      state,
      categoryId
    )
  }),
  {
    applySubtitleConfigs: engineOutputExportModule.applySubtitleConfigs
  },
  null,
  { withRef: true }
)
export default class EngineCategoryConfig extends Component {
  static propTypes = {
    category: shape({
      id: string.isRequired,
      iconClass: string.isRequired,
      name: string.isRequired
    }).isRequired,
    engineCategoryConfigs: arrayOf(
      shape({
        engineId: string,
        categoryId: string,
        formats: arrayOf(
          shape({
            extension: string.isRequired,
            options: shape({
              maxCharacterPerLine: number,
              newLineOnPunctuation: bool,
              linesPerScreen: number
            })
          })
        )
      })
    ).isRequired,
    applySubtitleConfigs: func,
    expanded: bool,
    onExpandConfigs: func,
    initialSubtitleConfig: shape({
      maxCharacterPerLine: number,
      newLineOnPunctuation: bool,
      linesPerScreen: number
    })
  };

  state = {
    dialogOpen: false
  };

  openCustomizeSubtitles = () => {
    this.setState({
      dialogOpen: true
    });
  };

  handleCloseDialog = () => {
    this.setState({
      dialogOpen: false
    });
  };

  handleFormSubmit = values => {
    this.props.applySubtitleConfigs(this.props.category.id, values);
    this.setState({
      dialogOpen: false
    });
  };

  render() {
    const {
      category,
      engineCategoryConfigs,
      onExpandConfigs,
      expanded,
      initialSubtitleConfig
    } = this.props;

    let hasSubtitleFormatsSelected = false;
    forEach(engineCategoryConfigs, config => {
      if (get(config, 'formats.length')) {
        forEach(config.formats, format => {
          const exportFormat = find(category.exportFormats, {
            format: format.extension
          });
          if (exportFormat && includes(exportFormat.types, 'subtitle')) {
            hasSubtitleFormatsSelected = true;
          }
        });
      }
    });

    const defaultSubtitleConfig = {
      linesPerScreen: 2,
      maxCharacterPerLine: 32,
      newLineOnPunctuation: false
    };

    return (
      <div data-veritone-component="engine-category-config">
        <ListItem
          data-veritone-element={`${kebabCase(category.name)}-engine-category`}
        >
          <ListItemIcon>
            <Icon className={category.iconClass} />
          </ListItemIcon>
          <ListItemText
            id="engineCategoryName"
            primary={`${category.name} (${engineCategoryConfigs.length})`}
          />
          <ListItemIcon classes={{ root: styles.expandIcon }}>
            <IconButton
              aria-label="Expand Category"
              // eslint-disable-next-line
              onClick={() => onExpandConfigs(category.id)}
              data-veritone-element="engine-category-config-more-less-button"
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </ListItemIcon>
        </ListItem>
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <List disablePadding>
            {engineCategoryConfigs.map(config => {
              return (
                <EngineConfigItem
                  key={`engine-config-item-${config.engineId ||
                    config.categoryId}`}
                  engineId={config.engineId}
                  categoryId={category.id}
                  formats={config.formats}
                />
              );
            })}
            {hasSubtitleFormatsSelected && (
              <ListItem className={styles.engineListItem}>
                <div className={styles.customizeOutputBox}>
                  <ClosedCaptionIcon className={styles.closedCaptionIcon} />
                  <span className={styles.customizeSubtitleText}>
                    Subtitle formats have been selected, adjust the format and
                    display settings here
                  </span>
                  <Button
                    color="primary"
                    className={styles.customizeButton}
                    onClick={this.openCustomizeSubtitles}
                    data-veritone-element="customize-subtitle-formats-button"
                  >
                    Customize
                  </Button>
                </div>
              </ListItem>
            )}
          </List>
        </Collapse>
        <Dialog
          open={this.state.dialogOpen}
          onClose={this.handleCloseDialog}
          aria-labelledby="customize-dialog-title"
          data-veritone-element="customize-subtitle-formats-dialog"
        >
          <DialogTitle id="customize-dialog-title">
            Subtitle Format Settings
          </DialogTitle>
          <DialogContent>
            <DialogContentText className={styles.subtitleConfigInfo}>
              Adjust the format and display settings for your subtitle export
              for maximum readability.
            </DialogContentText>
            <SubtitleConfigForm
              onCancel={this.handleCloseDialog}
              initialValues={initialSubtitleConfig || defaultSubtitleConfig}
              onSubmit={this.handleFormSubmit}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }
}
