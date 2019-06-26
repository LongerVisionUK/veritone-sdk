import React, { Component } from 'react'
import { func, arrayOf, number } from 'prop-types';
import cx from 'classnames';
import Button from "@material-ui/core/Button";

import OverlayPositioningProvider from '../BoundingPolyOverlay/OverlayPositioningProvider';
import Overlay from '../BoundingPolyOverlay/Overlay';
import AreaInterest from '../AreaInterest';
import styles from './styles.scss';
export default class LocationSelect extends Component {

  static propTypes = {
    handleAddBoundingBox: func,
    handleDeleteBoundingBox: func,
    handleChangeBoundingBox: func,
    onUpdateStep: func,
    boundingBoxes: arrayOf(Object),
    step: number,
    onEditAoI: func,
    onRemoveAoI: func
  }

  state = {
    open: false,
    boundingBoxes: [],
    frame: 0,
    selected: "",
    step: 1,
    readOnly: true
  };

  onUpdateStep = (step) => () => {
    const { boundingBoxes } = this.props;
    if (step === 3 && !boundingBoxes.length) {
      return;
    }
    this.props.onUpdateStep(step);
  }

  render() {
    const {
      handleAddBoundingBox,
      handleDeleteBoundingBox,
      handleChangeBoundingBox,
      boundingBoxes,
      step = 1,
      onEditAoI,
      onRemoveAoI
    } = this.props;
    return (
      <div className={styles.container}>
        <div className={styles.screenLocation}>
          <OverlayPositioningProvider
            contentHeight={200}
            contentWidth={340}
            fixedWidth
          >
            <Overlay
              onAddBoundingBox={handleAddBoundingBox}
              onDeleteBoundingBox={handleDeleteBoundingBox}
              onChangeBoundingBox={handleChangeBoundingBox}
              initialBoundingBoxPolys={boundingBoxes}
              stylesByObjectType={{
                a: {
                  backgroundColor: 'rgba(72,147,226,0)'
                },
                b: {
                  backgroundColor: 'rgba(72,147,226,0)'
                },
                c: {
                  backgroundColor: 'rgba(72,147,226,0)'
                }
              }}
              stagedBoundingBoxStyles={{
                backgroundColor: 'rgba(72,147,226,0.7)',
                border: '1px solid #4893E2'
              }}
              handleChangeFrame={this.handleChangeFrame}
              key={this.state.frame}
              readOnly={step !== 2}
            />
            <div
              style={{
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundSize: 'contain',
                backgroundColor: '#D8D8D8',
                height: 200,
                width: 340
              }}
            />
          </OverlayPositioningProvider>
        </div>
        <div className={styles.locationalCheckbox}>
          {step === 1 &&
            <div className={cx(styles["step-item"])}>
              <div className={styles.introText}>
                Use your mouse to draw a bounding box on the area on the image you would like to return search results.
              </div>
              <Button onClick={this.onUpdateStep(2)} className={cx(styles["btn-action-area"])}>ADD AREA OF INTEREST</Button>
            </div>
          }
          {step === 2 &&
            <div className={cx(styles["step-item"])}>
              <div className={styles.introText}>
                Use your mouse to draw a bounding box on the area on the image you would like to return search results.
            </div>
              <Button onClick={this.onUpdateStep(3)} className={cx(styles["btn-action-area"])}>SAVE AREA OF INTEREST</Button>
            </div>}
          {step === 3 && <div className={cx(styles["aria-item"])}>
            <AreaInterest
              areaOfInterest={boundingBoxes[0]}
              onEditAoI={onEditAoI}
              onRemoveAoI={onRemoveAoI}
            />
          </div>}
        </div>
      </div>
    );
  }
}
