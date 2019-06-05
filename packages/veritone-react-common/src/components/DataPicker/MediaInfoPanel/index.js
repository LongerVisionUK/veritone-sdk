import React from 'react';
import { string, arrayOf, shape, bool, number, func, object } from 'prop-types';
import { get } from 'lodash';
import { format } from 'date-fns';
import { Transition } from 'react-transition-group';
import cx from 'classnames';
import Typography from '@material-ui/core/Typography';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Folder from '@material-ui/icons/Folder';
import InsertDriveFile from '@material-ui/icons/InsertDriveFile';
import MediaPlayerComponent from '../../MediaPlayer';

import styles from './styles.scss';

const MediaPlayer = React.forwardRef((props, ref) => (
  <MediaPlayerComponent {...props} forwardedRef={ref} />
));

const tdoShape = shape({
  name: string.isRequired,
  startDateTime: string,
  stopDateTime: string,
  thumbnailUrl: string,
  sourceImageUrl: string,
  primaryAsset: shape({
    id: string,
    contentType: string,
    signedUri: string
  }),
  streams: arrayOf(shape({
    uri: string,
    protocol: string
  })),
  createdDateTime: string.isRequired,
  modifiedDateTime: string.isRequired
});

const formatDateString = date => {
  return format(date, 'dddd, MMM D, YYYY [at] h:mm A');
};

const getDuration = (startTime, stopTime) => {
  if (startTime && stopTime) {
    const duration = (
      (new Date(stopTime)).getTime() - (new Date(startTime)).getTime()
    ) / 1000;
    return Math.floor(duration);
  }
};

const displayNumber = (number, digits = 2) => {
  if (number === 0) {
    return '0'.repeat(digits)
  }
  return number < Math.pow(10, digits - 1) ?
    `${'0'.repeat(Math.floor(Math.log10(number)) + 1)}${number}` : number
}

const formatAsDuration = (seconds) => {
  const hourNumber = Math.floor(seconds / 3600);

  const minuteNumber = Math.floor((seconds - hourNumber * 3600) / 60);

  const secondNumber = Math.floor(
    (seconds - hourNumber * 3600 - minuteNumber * 60) % 60);

  return (
    `${displayNumber(hourNumber)}:` +
    `${displayNumber(minuteNumber)}:` +
    `${displayNumber(secondNumber)}`
  );
}

const MediaInfo = ({ selectedItem, width, onPlayerRefReady, playerRef }) => {
  const itemType = selectedItem.type === 'folder' ?
    'folder' :
    get(selectedItem, 'primaryAsset.contentType', 'application').split('/')[0];
  const duration = getDuration(
    selectedItem.startDateTime,
    selectedItem.stopDateTime
  );
  return (
    <div className={styles['media-info-container']} style={{ width }}>
      {
        (() => {
          switch (itemType) {
            case 'folder':
              return <Folder className={styles['icon-info']} />
            case 'doc':
            case 'application':
              return <InsertDriveFile className={styles['icon-info']} />
            case 'video':
            case 'audio':
              return (
                <MediaPlayer
                  ref={playerRef}
                  onPlayerRefReady={onPlayerRefReady}
                  src={selectedItem.primaryAsset.signedUri}
                  streams={selectedItem.streams}
                  poster={selectedItem.thumbnailUrl}
                  readOnly
                  fluid
                  useOverlayControlBar
                  preload={'none'}
                  btnRestart={false}
                  btnReplay={false}
                  btnForward={false}
                  autoHide
                  autoHideTime={1000}
                />
              )
            case 'image':
              return <img
                src={get(selectedItem, 'primaryAsset.signedUri')}
                alt={selectedItem.name}
                className={styles['image-preview']}
              />
            default:
              return null;
          }
        })()
      }
      <Typography className={styles['tdo-name']}>
        {selectedItem.name}</Typography>
      <div className={styles['info-details']}>
        <Table className={styles['table-container']}>
          <TableBody>
            <TableRow className={styles['table-row']}>
              <TableCell
                className={cx(
                  styles['table-cell'],
                  styles['table-first-column']
                )}
              >
                Created
              </TableCell>
              <TableCell
                className={styles['table-cell']}
              >
                {formatDateString(selectedItem.createdDateTime)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                className={cx(
                  styles['table-cell'],
                  styles['table-first-column']
                )}
              >
                Modified
              </TableCell>
              <TableCell
                className={styles['table-cell']}
              >
                {formatDateString(selectedItem.modifiedDateTime)}
              </TableCell>
            </TableRow>
            {
              !!duration && (
                <TableRow className={styles['table-row']}>
                  <TableCell
                    className={cx(
                      styles['table-cell'],
                      styles['table-first-column']
                    )}
                  >
                    Duration
                  </TableCell>
                  <TableCell className={styles['table-cell']}>
                    {
                      formatAsDuration(duration)
                    }
                  </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
};

MediaInfo.propTypes = {
  selectedItem: tdoShape,
  width: number,
  onPlayerRefReady: func,
  playerRef: shape({
    current: object
  })
}

const transitionStyle = (width) => ({
  entering: {
    flexBasis: width + 40,
  },
  entered: {
    flexBasis: width + 40,
  },
})

const MediaInfoPanel = ({ open, selectedItems = [], width, ...props }) => {
  const selectedItem = selectedItems.length ? selectedItems[0] : null;
  const transitionStyleByWidth = transitionStyle(width);
  return (
    <Transition in={open && selectedItems.length > 0} timeout={500}>
      {
        state => (
          <div
            className={styles['media-panel-container']}
            style={
              transitionStyleByWidth[state]
            }
          >
            {
              selectedItems.length > 1 ? (
                <div>
                  You have selected {selectedItems.length} items
                </div>
              ) : selectedItem ? (
                <MediaInfo
                  selectedItem={selectedItem}
                  width={width}
                  {...props}
                />
              ) : null
            }
          </div>
        )
      }
    </Transition>
  )
}

MediaInfoPanel.propTypes = {
  open: bool,
  width: number,
  selectedItems: arrayOf(tdoShape),
  onPlayerRefReady: func,
  playerRef: shape({
    current: object
  })
}

MediaInfoPanel.defaultProps = {
  width: 450
}

export default MediaInfoPanel;
