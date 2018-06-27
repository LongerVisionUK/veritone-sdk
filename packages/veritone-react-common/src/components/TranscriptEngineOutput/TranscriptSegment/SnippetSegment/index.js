import React, { Component } from 'react';
import { arrayOf, shape, bool, number, string, func } from 'prop-types';
import classNames from 'classnames';

import SnippetFragment from '../../TranscriptFragment/SnippetFragment';
import { msToReadableString } from '../../../../helpers/time';

import styles from './styles.scss';

export default class SnippetSegment extends Component {
  static propTypes = {
    content: shape({
      startTimeMs: number,
      stopTimeMs: number,
      sentences: string,
      fragments: arrayOf(
        shape({
          startTimeMs: number,
          stopTimeMs: number,
          value: string
        })
      )
    }),
    className: string,
    timeClassName: string,
    contentClassName: string,
    sentenceMode: bool,
    editMode: bool,
    onClick: func,
    onChange: func,
    selectedEngineId: string,
    startMediaPlayHeadMs: number,
    stopMediaPlayHeadMs: number
  };

  static defaultProps = {
    editMode: false,
    sentenceMode: false,
    startMediaPlayHeadMs: 0,
    stopMediaPlayHeadMs: 1000
  };

  handleSnippetClick = (event, entryData) => {
    const { editMode, onClick } = this.props;

    if (!editMode && onClick) {
      onClick(event, entryData);
    }
  };

  handleSnippetChange = entryData => {
    const { editMode, onChange } = this.props;

    if (editMode && onChange) {
      onChange(entryData);
    }
  };

  renderTime(startTime) {
    const { content, timeClassName } = this.props;

    const formatedTime = msToReadableString(content.startTimeMs, true);
    return (
      <div className={classNames(styles.time, timeClassName)}>
        {formatedTime}
      </div>
    );
  }

  renderFragments() {
    const {
      content,
      editMode,
      contentClassName,
      selectedEngineId,
      startMediaPlayHeadMs,
      stopMediaPlayHeadMs
    } = this.props;

    const contentComponents = content.fragments.map((entry, index) => {
      const startTime = entry.startTimeMs;
      const stopTime = entry.stopTimeMs;

      return (
        <SnippetFragment
          key={
            'snippet::' + selectedEngineId + '-' + startTime + '-' + stopTime
          }
          value={entry.value}
          active={
            !(
              stopMediaPlayHeadMs < startTime || startMediaPlayHeadMs > stopTime
            )
          }
          startTimeMs={startTime}
          stopTimeMs={stopTime}
          editMode={editMode}
          onClick={this.handleSnippetClick}
          onChange={this.handleSnippetChange}
        />
      );
    });

    return (
      <div className={classNames(styles.content, contentClassName)}>
        {contentComponents}
      </div>
    );
  }

  renderSentence() {
    const {
      content,
      editMode,
      contentClassName,
      startMediaPlayHeadMs,
      stopMediaPlayHeadMs
    } = this.props;

    const startTime = content.startTimeMs;
    const stopTime = content.stopTimeMs;

    return (
      <div className={classNames(styles.content, contentClassName)}>
        <SnippetFragment
          key={'sentence-' + startTime + '-' + stopTime}
          value={content.sentences}
          startTimeMs={startTime}
          stopTimeMs={stopTime}
          active={
            !(
              stopMediaPlayHeadMs < startTime || startMediaPlayHeadMs > stopTime
            )
          }
          editMode={editMode}
          onClick={this.handleSnippetClick}
          onChange={this.handleSnippetChange}
        />
      </div>
    );
  }

  render() {
    const { className, sentenceMode } = this.props;

    return (
      <div className={classNames(styles.transcriptSegment, className)}>
        {this.renderTime()}
        {sentenceMode ? this.renderSentence() : this.renderFragments()}
      </div>
    );
  }
}
