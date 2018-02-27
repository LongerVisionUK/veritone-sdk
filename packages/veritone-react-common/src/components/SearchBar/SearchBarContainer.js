import React from 'react';
import { arrayOf, func, object, string } from 'prop-types';
import { SearchBar } from '.';
import Menu, { MenuItem } from 'material-ui/Menu';
import Popover from 'material-ui/Popover';
import Paper from 'material-ui/Paper';
import EngineCategoryButton from './EngineCategoryButton';

import cx from 'classnames';
import styles from './styles.scss';

import { withTheme } from 'material-ui/styles'
import { guid } from './component';

import Card, { CardHeader, CardMedia, CardContent, CardActions } from 'material-ui/Card';
import Button from 'material-ui/Button';
import Collapse from 'material-ui/transitions/Collapse';
import Avatar from 'material-ui/Avatar';
import IconButton from 'material-ui/IconButton';
import Typography from 'material-ui/Typography';
import Icon from './Icon';

const supportedCategoriesClass = cx(styles['supportedCategories']);

class SearchBarContainer extends React.Component {
  static propTypes = {
    theme: object,
    auth: string,
    color: string,
    api: string,
    libraries: arrayOf(object),
    searchParameters: arrayOf(object),
    addOrModifySearchParameter: func,
    removeSearchParameter: func,
    enabledEngineCategories: arrayOf(object)
  };

  state = {
    openModal: { modalId: null },
    selectedPill: null,
    menuAnchorEl: null,
    highlightedPills: []
  };

  componentDidMount() {
    document.addEventListener('keydown', this.handleGroupingKeyPress);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleGroupingKeyPress);
  }

  handleGroupingKeyPress = (event) => {
    // let the user use esc to deselect all highlighted pills
    if(event.code === 'Escape' && this.state.highlightedPills.length > 0 && !this.state.selectedPill && !this.state.openModal.modalId) {
      event.preventDefault();
      this.setState( { highlightedPills: [] });
    } else if(event.code === 'KeyG' && event.shiftKey && this.state.highlightedPills.length > 1) {
      event.preventDefault();
      this.toggleGrouping();
    }
  }

  toggleGrouping = () => {
    if(this.state.highlightedPills.length <= 0) {
      return;
    }
    let first = this.props.searchParameters.findIndex( x => x.id === this.state.highlightedPills[0]);
    let last = this.props.searchParameters.findIndex( x => x.id === this.state.highlightedPills[this.state.highlightedPills.length - 1]);

    const before = this.props.searchParameters[first - 1];
    const after = this.props.searchParameters[last + 1];
    if( before && before.conditionType === 'group' && before.value === '('
    && after && after.conditionType === 'group' && after.value === ')') {
      // already an existing group
      this.props.removeSearchParameter( before.id );
      this.props.removeSearchParameter( after.id );
    } else {
      const paramsToAdd = [
        {
          parameter: {
            value: ')',
            conditionType: 'group'
          },
          index: last + 1
        },
        {
          parameter: {
            value: '(',
            conditionType: 'group'
          },
          index: first
        },
      ];
      const newSearchParameters = this.props.insertMultipleSearchParameters(paramsToAdd);
      let [ simplifiedParameters, extraneousGroups ] = this.simplifySearchParameters(newSearchParameters);
      extraneousGroups.map( x => this.props.removeSearchParameter(x.id) );
    }
    if(this.props.onSearch) {
      this.props.onSearch();
    }
  }

  addPill = modalId => {
    this.setState({
      openModal: { modalId: modalId },
      insertDirection: null
    }, () => {
      if(this.props.onSearch) {
        this.props.onSearch();
      }
    });
  };

  addJoiningOperator = (operator, index) => {
    this.props.addOrModifySearchParameter({
      value: operator || 'and',
      conditionType: 'join'
    }, index);
  };

  togglePill = (searchParameterId, searchParameters) => {
    if (this.state.highlightedPills.length > 0) {
      // if the pill is already highlighted, unhighlight it
      let alreadyHighlightedIndex = this.state.highlightedPills.indexOf(searchParameterId);
      if( alreadyHighlightedIndex !== -1 ) {
        if( alreadyHighlightedIndex === 0 || alreadyHighlightedIndex === (this.state.highlightedPills.length - 1) ) {
          let highlightedPills = this.state.highlightedPills.filter( x => x !== searchParameterId);
          this.setState( { highlightedPills: highlightedPills });
        }
        return;
      }

      // if there are pills already highlighted, we can only highlight their neighbors
      let pills = searchParameters.filter( x => x.conditionType !== 'join' && x.conditionType !== 'group');
      // x.conditionType !== 'group' (add this back if you want them to be able to group neighbors who are already in groups)
      let pillToHighlightIndex = pills.findIndex( x => x.id === searchParameterId);
      let firstHighlightedPillIndex = pills.findIndex( x => x.id === this.state.highlightedPills[0]);
      let lastHighlightedPillIndex = pills.findIndex( x => x.id === this.state.highlightedPills[this.state.highlightedPills.length - 1]);
      if (pillToHighlightIndex === firstHighlightedPillIndex - 1) {
        let highlightedPills = [...this.state.highlightedPills];
        highlightedPills.unshift(searchParameterId);
        this.setState( { highlightedPills: highlightedPills });
      }  else if (pillToHighlightIndex === lastHighlightedPillIndex + 1) {
        let highlightedPills = [...this.state.highlightedPills];
        highlightedPills.push(searchParameterId);
        this.setState( { highlightedPills: highlightedPills });
      } else {
        // BOOP! you tried to group a non adjacent pill
        console.warn('You tried to highlight a non-adjacent pill');
      }
    } else {
      // if there are no pills highlighted yet, we can highlight any of the pills
      let highlightedPills = [ searchParameterId ];
      this.setState( { highlightedPills: highlightedPills });
    }
  }

  simplifySearchParameters(searchParameters) {
    let reduced = searchParameters.reduce( (accu, searchParameter ) => {
      let simplified = accu[0];
      let removed = accu[1];

      // remove groups that only contain one element
      if (simplified[simplified.length - 2] && simplified[simplified.length - 2].value === '(' && simplified[simplified.length - 1] && simplified[simplified.length - 1].value !== '(' && simplified[simplified.length - 1].value !== ')' && searchParameter.value === ')') {
        removed.push(simplified[simplified.length - 2]);
        removed.push(searchParameter);
        simplified.splice(simplified.length - 2, 1);
      } else if (simplified[simplified.length - 1] && simplified[simplified.length - 1].value === '(' && searchParameter.value === ')') {
        // remove groups with no elements
        removed.push(simplified[simplified.length - 1]);
        removed.push(searchParameter);
        simplified.pop();
      } else {
        simplified.push(searchParameter);
      }
      return accu;
    }, [[], []]);

    let [ simplifiedParameters, extraneousGroups ] = reduced;
    while(simplifiedParameters.length > 2 && simplifiedParameters[0].value === '(' && simplifiedParameters[simplifiedParameters.length - 1].value === ')') {
      extraneousGroups.push(simplifiedParameters[0]);
      extraneousGroups.push(simplifiedParameters[simplifiedParameters.length - 1]);

      simplifiedParameters.pop();
      simplifiedParameters.shift();
    }

    return [ simplifiedParameters, extraneousGroups ];
  }

  removePill = (searchParameterId, searchParameters) => {
    const updatedSearchParameters = this.simpleRemovePill(searchParameterId, searchParameters);
    if (this.props.onSearch) {
      this.props.onSearch( updatedSearchParameters );
    }
    this.setState({highlightedPills: []});
    return updatedSearchParameters;
  };

  simpleRemovePill = (searchParameterId, searchParameters) => {
    let index = searchParameters.findIndex(x => x.id === searchParameterId);
    let previousParameter = searchParameters[index - 1];
    let newSearchParameters = null;
    // if the pill to be removed is the start of a group, we need to remove the next joining parameter and not the previous one
    if( ( previousParameter && previousParameter.value === '(' ) || ( index === 0 && this.numberOfPills(searchParameters) > 1 ) ) {
      this.props.removeSearchParameter( searchParameters[index+1].id );
      this.props.removeSearchParameter( searchParameterId );
      newSearchParameters = searchParameters.filter( x => x.id !== searchParameterId && x.id !== searchParameters[index+1].id);
    } else if ( this.numberOfPills(searchParameters) > 1) {
      // if the pill to be removed is in the middle of a group, remove the last joining parameter
      let lastJoiningParameter = searchParameters.slice(0, index).reverse().find( x => x.conditionType === 'join');
      this.props.removeSearchParameter(lastJoiningParameter.id);
      this.props.removeSearchParameter(searchParameterId);
      newSearchParameters = searchParameters.filter( x => x.id !== searchParameterId && x.id !== lastJoiningParameter.id);
    } else {
      // remove a single pill
      this.props.removeSearchParameter( searchParameterId );
      newSearchParameters = searchParameters.filter( x => x.id !== searchParameterId);
    }
    let [ simplifiedParameters, extraneousGroups ] = this.simplifySearchParameters(newSearchParameters);
    extraneousGroups.map( x => this.props.removeSearchParameter(x.id) );
    return simplifiedParameters;
  };

  getRemovePill = searchParameters => {
    return searchParameterId => {
      this.removePill(searchParameterId, searchParameters);
    };
  };

  getLastJoiningOperator = (searchParameters) => {
    for(let i = searchParameters.length - 1; i >= 0; i--) {
      if(searchParameters[i].conditionType === 'join') {
        return searchParameters[i].value;
      }
    }
    return null;
  }

  numberOfPills = (searchParameters) => searchParameters.reduce( (accu, searchParameter) => {
    if (searchParameter.conditionType !== 'join' && searchParameter.conditionType !== 'group' ) {
      return accu + 1;
    } else {
      return accu;
    }
  }, 0);

  addNewSearchParameter = (parameter, engineId) => {
    // if there's no selected pill, we're adding a new search parameter so add a joining operator if there are more than one pill
    if(this.numberOfPills(this.props.searchParameters) > 0) {
      const lastJoiningOperator = this.getLastJoiningOperator(this.props.searchParameters);
      this.addJoiningOperator(lastJoiningOperator);
    }

    this.props.addOrModifySearchParameter({
      value: parameter,
      conditionType: engineId
    });
  }

  replaceSearchParameter = (parameterValue, engineId, searchParameterId) => {
    this.props.addOrModifySearchParameter({
      value: parameterValue,
      conditionType: engineId,
      id: searchParameterId
    });
  }

  openPill = pillState => {
    this.setState({
      openModal: {
        modalId: pillState.conditionType,
        modalState: pillState.value
      },
      selectedPill: pillState.id
    });
  };

  handleMenuOpen = (target, searchParameter) => {
    let menuOptions;
    if(searchParameter.conditionType === 'join') {
      menuOptions = [
        {
          label: 'AND',
          onClick: () => {this.menuChangeOperator(searchParameter, 'and')}
        },
        {
          label: 'OR',
          onClick: () => {this.menuChangeOperator(searchParameter, 'or')}
        },
        {
          label: 'Insert Search Term to Left',
          onClick: () => {this.menuInsertDirection('left')}
        },
        {
          label: 'Insert Search Term to Right',
          onClick: () => {this.menuInsertDirection('right')}
        }
      ];
    } else {
      const showGroupOptions = this.state.highlightedPills.length > 1 && this.state.highlightedPills.includes(searchParameter.id);
      if(showGroupOptions) {
        menuOptions = [
          {
            label: 'Group Selection',
            onClick: this.menuGroupSelection
          },
          {
            label: 'Delete',
            onClick: this.menuRemoveHighlightedPills
          }
        ];
      } else {
        menuOptions = [
          {
            label: 'Edit',
            onClick: this.menuEditPill
          },
          {
            label: 'Delete',
            onClick: this.menuRemovePill
          },
          {
            label: 'Insert Search Term to Left',
            onClick: () => {this.menuInsertDirection('left')}
          },
          {
            label: 'Insert Search Term to Right',
            onClick: () => {this.menuInsertDirection('right')}
          }
        ];
      }
    }

    this.setState({
      menuAnchorEl: target,
      selectedPill: searchParameter.id,
      menuOptions
    });
  }

  handleMenuClose = () => {
    this.setState({
      menuAnchorEl: null,
      selectedPill: null
    });
  }

  menuChangeOperator = (searchParameter, newOperatorValue) => {
    const newParameter = {
      ...searchParameter,
      value: newOperatorValue
    };
    this.props.addOrModifySearchParameter(newParameter);
    this.setState({
      menuAnchorEl: null,
      selectedPill: null
    }, () => {
      if(this.props.onSearch) {
        this.props.onSearch();
      }
    });

  }

  menuInsertDirection = (insertDirection) => {
    this.setState({
      menuAnchorEl: null,
      openModal: { modalId: '67cd4dd0-2f75-445d-a6f0-2f297d6cd182' }, //TODO dont use hardcoded id
      insertDirection
    }, () => {
      if(this.props.onSearch) {
        this.props.onSearch();
      }
    });
  }

  menuRemovePill = () => {
    this.removePill(this.state.selectedPill, this.props.searchParameters);
    this.setState({
      menuAnchorEl: null,
      selectedPill: null
    });
  }

  menuRemoveHighlightedPills = () => {
    let simplifiedParameters = this.props.searchParameters;
    this.state.highlightedPills && this.state.highlightedPills.forEach((highlightedPill) => {
      simplifiedParameters = this.simpleRemovePill(highlightedPill, simplifiedParameters);
    });
    this.setState({
      menuAnchorEl: null,
      selectedPill: null
    }, () => {
      if(this.props.onSearch) {
        this.props.onSearch();
      }
    });
  }

  menuEditPill = () => {
    const selectedPill = this.props.searchParameters.find( x => x.id === this.state.selectedPill);
    this.openPill(selectedPill);
    this.setState({
      menuAnchorEl: null
    });
    if(this.props.onSearch) {
      this.props.onSearch();
    }
  }

  menuGroupSelection = () => {
    this.toggleGrouping();
    this.setState({
      menuAnchorEl: null,
      selectedPill: null
    })
  }

  cancelModal = () => {
    this.setState({
      openModal: { modalId: null },
      selectedPill: null,
      insertDirection: null
    });
  };

  addOrEditModal = () => {
    if(this.state.selectedPill) {
      //insert new pill next to selected pill
      if(this.state.insertDirection) {
          const selectedPillIndex = this.props.searchParameters.findIndex(x => x.id === this.state.selectedPill)
          const insertAt = this.state.insertDirection === 'left' ? selectedPillIndex : selectedPillIndex + 1;
          const newSearchParameterValue = this.openModal.returnValue();
          if(!newSearchParameterValue) {
            return;
          }
          const searchTermParam = {
            value: newSearchParameterValue,
            conditionType: this.state.openModal.modalId
          };
          const operatorParam = {
            value: 'and',
            conditionType: 'join'
          };
          const selectedParamConditionType = this.props.searchParameters[selectedPillIndex].conditionType;
          const newParams = ((selectedParamConditionType === 'join' && this.state.insertDirection === 'left') || (selectedParamConditionType !== 'join' && this.state.insertDirection === 'right'))
            ? [operatorParam, searchTermParam]
            : [searchTermParam, operatorParam];
          this.props.addOrModifySearchParameter(newParams, insertAt);
          this.setState({
            openModal: { modalId: null },
            selectedPill: null,
            insertDirection: null
          }, () => {
            if(this.props.onSearch) {
              this.props.onSearch();
            }
          });
      } else {
        const newSearchParameterValue = this.openModal.returnValue();
        if(!newSearchParameterValue) {
          return;
        }
        this.replaceSearchParameter(newSearchParameterValue, this.state.openModal.modalId, this.state.selectedPill);
        this.setState({
          openModal: { modalId: null },
          selectedPill: null,
          insertDirection: null
        }, () => {
          if(this.props.onSearch) {
            this.props.onSearch();
          }
        });
      }
    } else {
      const newSearchParameterValue = this.openModal.returnValue();
      if(!newSearchParameterValue) {
        return;
      }
      this.addNewSearchParameter(newSearchParameterValue, this.state.openModal.modalId);
      let lastModal = this.state.openModal.modalId;
      this.setState({
        openModal: { modalId: '' + lastModal }
      }, () => {
        if(this.props.onSearch) {
          this.props.onSearch();
        }
      });
    }
  }

  resetSearchParameters = () => {
    this.setState( {
      openModal: { modalId: null },
      selectedPill: null,
      menuAnchorEl: null,
      highlightedPills: []
    } );
    this.props.resetSearchParameters();
  }

  render() {
    const openModal = this.props.enabledEngineCategories.find(
      x => x.id === this.state.openModal.modalId
    );
    const Modal = openModal && openModal.modal ? openModal.modal : null;
    const libraryIds = this.props.libraries && this.props.libraries.map(library => library.id);
    const selectedPill = this.props.searchParameters.find( x => x.id === this.state.selectedPill);

    return (
      <div ref={(input) => { this.searchBar = input; }} style={{ width: '100%', overflowY: 'hidden' }}>
        <div>
          <SearchBar
            onSearch={this.props.onSearch}
            color={this.props.color}
            enabledEngineCategories={this.props.enabledEngineCategories}
            searchParameters={this.props.searchParameters}
            addJoiningOperator={this.props.addJoiningOperator}
            highlightedPills={this.state.highlightedPills}
            togglePill={ this.togglePill }
            libraries={ this.props.libraries }
            addPill={this.addPill}
            removePill={this.getRemovePill(this.props.searchParameters)}
            openPill={this.openPill}
            modifyPill={ this.props.addOrModifySearchParameter }
            openMenu={this.handleMenuOpen}
            resetSearchParameters={this.resetSearchParameters}
          />
          <Menu
            open={Boolean(this.state.menuAnchorEl)}
            onClose={this.handleMenuClose}
            anchorEl={this.state.menuAnchorEl}
            // anchorOrigin={ { vertical: 'bottom', horizontal: 'center' } }
            style={ {top: "1.25em" } }
            disableRestoreFocus
          >
            {
              this.state.menuOptions && this.state.menuOptions.map(menuOption => (
                <MenuItem onClick={menuOption.onClick}>
                  {menuOption.label}
                </MenuItem>
              ))
            }
          </Menu>
        { Modal ? (
        <Popover
          id="simple-menu"
          anchorEl={this.searchBar}
          anchorOrigin={ { vertical: "bottom" } }
          marginThreshold={0}
          elevation={2}
          open
          onClose={this.cancelModal}
        >
          <Card className={ cx(styles['engineCategoryModal']) } style={{ width: this.searchBar.clientWidth }} elevation={0}>
            <CardHeader
              avatar={
                <Icon iconClass={ openModal.iconClass } color={'grey '} size={'2em'} />
              }
              classes={ { action: cx(styles['modalAction']) } }
              action={
                <div className={supportedCategoriesClass}>
                {this.props.enabledEngineCategories &&
                  this.props.enabledEngineCategories.map(engineCategory => (
                    <EngineCategoryButton
                      key={engineCategory.id}
                      engineCategory={engineCategory}
                      color={this.props.color}
                      addPill={ this.state.openModal.modalId ? () => this.setState({ openModal: { modalId: engineCategory.id }}) : this.props.addPill }
                    />
                  ))}
                </div>
              }
              title={ openModal.title }
              subheader={ openModal.subtitle }
              style={ { marginTop: 0, marginRight: 0 } }
            />
            <CardContent style={{ margin: "0.5em", paddingTop: "0", paddingBottom: "0" }}>
              { Modal ? (
                <Modal
                  // the guid generation in the key is on purpose.
                  // basically, when a new modal of the exact same type is added, we use setState with the same modalId to
                  // force a rerender, which generates a new guid, thereby resetting the modal
                  // (this is preferrable to making every engine category modal implement a reset function)
                  // if we want to allow for rerenders while preserving the modal component, uncomment out guid() and
                  // explicity set openModal.key
                  key={this.state.openModal.key || guid() }
                  open
                  ref={ (input) => { this.openModal = input; } }
                  //setGetModalValue={ (input) => { this.openModal = input; console.log("Accessor function", input) } }
                  api={this.props.api}
                  auth={this.props.auth}
                  libraries={libraryIds}
                  modalState={this.state.openModal.modalState}
                  cancel={this.cancelModal}
                  applyFilter={this.addOrEditModal}
                />
              ) : null }
            </CardContent>
            <CardActions classes={ { root: cx(styles['modalFooterActions']) } } style={ { padding: "1em" }}>
              <Button onClick={ this.cancelModal } color="primary" className={ cx(styles['cancelButton']) }>
                Cancel
              </Button>
              <Button
                onClick={ this.addOrEditModal }
                color="primary"
                className="transcriptSubmit"
              >
                { this.state.selectedPill && !this.state.insertDirection ? ( (selectedPill.conditionType === openModal.id && this.state.openModal.modalState !== undefined) ? 'Save' : 'Replace') : 'Add' }
              </Button>
            </CardActions>
          </Card>
        </Popover>
        ) : null }
        </div>
      </div>
    );
  }
}

export default withTheme()(SearchBarContainer);

SearchBarContainer.defaultProps = {
  searchParameters: [],
  enabledEngineCategories: [],
  addOrModifySearchParameter: state =>
    console.log('Add or modify the search parameter', state),
  insertMultipleSearchParameters: state =>
    console.log('insert multiple search parameters', state),
  removeSearchParameter: id =>
    console.log('Remove the search parameter with the id', id)
};
