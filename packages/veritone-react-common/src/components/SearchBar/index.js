import React from 'react';
import cx from 'classnames';
import { string, bool, arrayOf, shape, func, object } from 'prop-types';

import Chip from 'material-ui/Chip';
import IconButton from 'material-ui/IconButton';
import CloseIcon from 'material-ui-icons/Close';
import KeyboardArrowRight from 'material-ui-icons/KeyboardArrowRight';
import KeyboardArrowLeft from 'material-ui-icons/KeyboardArrowLeft';

import Icon from './Icon';
import SearchPill from './SearchPill';

import styles from './styles.scss';
import Select from 'material-ui/Select';
import Typography from 'material-ui/Typography';

import { MenuItem } from 'material-ui/Menu';
import { withTheme } from 'material-ui/styles';

const containerClasses = cx(styles['searchBar']);

const searchInputContainerClass = cx(styles['searchInput']);

const supportedCategoriesClass = cx(styles['supportedCategories']);

const GhostInput = ({showGhost, onFocus}) => (
  <span onClick={onFocus} maxLength="0" className={ cx(styles['afterCursor'])} type="textbox" size="1">
    { showGhost ? <Typography color="textSecondary" variant="headline">Search Veritone</Typography> : null }
  </span>
)

const JoiningOperator = ( {operator, onClick} ) => {
  return (
    <Chip
      label={operator}
      onClick={onClick}
      classes={ { label: cx(styles['joinOperatorChip']) } }
      style={{background: 'transparent', color: '#2196F3', paddingLeft: 0, paddingRight: 0}}
    />
  );
}

const SearchParameters = withTheme()(({theme, searchParameters, level, togglePill, highlightedPills, selectedPill, enabledEngineCategories, openPill, removePill, addPill, lastJoin, libraries, openMenu}) => {
  let output = [];

  // need to do a pass over the search parameters to build a tree so we can render groups cleanly
  // creates a structure where {id: number}
  // id being the id of the pill at the start of the group
  // and number being the number of elements in the group
  const groups = {};
  let startOfGroup = null;
  let treeLevel = 0;
  for(let i = 0; i < searchParameters.length; i++) {
    if(searchParameters[i].value === '(') {
      if(treeLevel === 0) {
        startOfGroup = searchParameters[i].id;
      }
      treeLevel++;
    } else if (searchParameters[i].value === ')') {
      treeLevel--;
      if(treeLevel === 0) {
        groups[startOfGroup] = { endOfGroup: i, afterGroup: searchParameters[i+1] && searchParameters[i+1].conditionType } ;
        startOfGroup = null;
      }
    }
  }

  for (let i = 0; i < searchParameters.length; i++ ) {
    let searchParameter = searchParameters[i];
    if (searchParameter.conditionType === 'join') {
      const onClick = (e) => {
        openMenu(e.currentTarget, searchParameter);
      };
      output.push(
        <JoiningOperator
          key={searchParameter.id}
          operator={searchParameter.value}
          onClick={onClick}
        />
      )
    } else if (searchParameter.conditionType === 'group') {
      if(groups[searchParameter.id]) {
        let nestedGroupStyling = '';
        if(searchParameters[i-1] && searchParameters[i-1].conditionType !== 'group') {
          nestedGroupStyling +=  cx(styles['searchGroupNestedLeft']) + " ";
        }
        if(groups[searchParameter.id].afterGroup && groups[searchParameter.id].afterGroup !== 'group') {
          nestedGroupStyling +=  cx(styles['searchGroupNestedRight']);
        }
        const stylingClass = level === 0 ? cx(styles['searchGroup']) : nestedGroupStyling;

        output.push(
          <span style={{ alignItems: "center", display: "flex", flexWrap: "nowrap", borderColor: theme.palette.primary.main }} className={ stylingClass } key={`search_container_${searchParameter.id}`}>
          <SearchParameters
          key={`search_parameters_grouping_${searchParameter.id}_${level}`}
            searchParameters={ searchParameters.slice(i+1, groups[searchParameter.id].endOfGroup) }
            level={level+1}
            enabledEngineCategories={enabledEngineCategories}
            highlightedPills={ highlightedPills }
            selectedPill={ selectedPill }
            togglePill={ togglePill }
            addPill={ addPill }
            openPill={ openPill }
            removePill={ removePill }
            libraries={ libraries }
            openMenu={ openMenu }
          />
          </span>
        )
        i = groups[searchParameter.id].endOfGroup;
      }
    } else if (searchParameter.conditionType !== 'join') {
      const searchParameterEngine = enabledEngineCategories.find(engineCategory => engineCategory.id === searchParameter.conditionType);

      const { abbreviation, thumbnail } = searchParameterEngine ? searchParameterEngine.getLabel(searchParameter.value) : { abbreviation: undefined, thumbnail: undefined };
      const remove = () => removePill(searchParameter.id);

      const onClick= (e) => {
        if(e.shiftKey) {
          togglePill(searchParameter.id, searchParameters);
        } else {
          openMenu(e.currentTarget, searchParameter);
        }
      }
      output.push(
        <SearchPill
          key={searchParameter.id}
          engineIconClass={searchParameterEngine.iconClass}
          onClick={ onClick }
          highlighted={ highlightedPills.indexOf(searchParameter.id) !== -1 }
          selected={ selectedPill ? searchParameter.id === selectedPill.id : false }
          label={abbreviation}
          remove={remove}
        />
    );
    }
  }
  return output;
});

/*
const SearchBar = ({
  color,
  searchParameters,
  enabledEngineCategories,
  addPill,
  openPill,
  removePill,
  highlightedPills,
  togglePill,
  onSearch,
  libraries,
  openMenu,
  resetSearchParameters
}) => {
*/

class SearchBar extends React.Component {

  addTranscript = () => {
    this.props.addPill('67cd4dd0-2f75-445d-a6f0-2f297d6cd182');
  }

  scrollLeft = () => {
    if(this.scrollContainer && this.scrollContainer.scrollLeft > 0) {
      this.scrollContainer.scrollLeft =  this.scrollContainer.scrollLeft - 20;
    }
  }

  scrollRight = () => {
    if(this.scrollContainer && this.scrollContainer.scrollLeft < (this.scrollContainer.scrollWidth - this.scrollContainer.offsetWidth)) {
      this.scrollContainer.scrollLeft =  this.scrollContainer.scrollLeft + 20;
    }
  }

  render() {
    const showScrollBar = this.scrollContainer ? this.scrollContainer.scrollWidth > this.scrollContainer.clientWidth : false;
    if (showScrollBar) {
    }
    return (
      <div className={containerClasses}>
        { showScrollBar ? (
          <IconButton onClick={ this.scrollLeft } classes={ { root: cx(styles['resetButton']) } }>
            <KeyboardArrowLeft/>
          </IconButton>
        ) : null }
        <div className={searchInputContainerClass} ref={ (input) => { this.scrollContainer = input; } }>
          { <SearchParameters
          key={'top_level_search_parameters'}
          searchParameters={ this.props.searchParameters }
          level={0}
          enabledEngineCategories={this.props.enabledEngineCategories}
          highlightedPills={ this.props.highlightedPills }
          togglePill={ this.props.togglePill }
          addPill={ this.props.addPill }
          openPill={ this.props.openPill }
          removePill={ this.props.removePill }
          libraries={ this.props.libraries }
          selectedPill={ this.props.selectedPill }
          color={ this.props.color}
          openMenu={ this.props.openMenu }
          /> }
          {<GhostInput key="input_cursor" onFocus={ this.addTranscript } showGhost={ !this.props.searchParameters || this.props.searchParameters.length === 0 } />}
        </div>
        { showScrollBar ? (
          <IconButton onClick={ this.scrollRight } classes={ { root: cx(styles['resetButton']) } }>
            <KeyboardArrowRight/>
          </IconButton>
        ) : null
        }
        {
          this.props.searchParameters.length > 0 ? (<IconButton onClick={ this.props.resetSearchParameters } classes={ { root: cx(styles['resetButton']) } }>
            <CloseIcon/>
          </IconButton>) : null
        }
      </div>
    )
  }
};
SearchBar.propTypes = {
  color: string.isRequired,
  libraries: arrayOf(object),
  searchParameters: arrayOf(shape(condition)),
  enabledEngineCategories: arrayOf(shape(supportedEngineCategoryType)),
  onSearch: func,
  addPill: func,
  openPill: func,
  removePill: func,
};

const supportedEngineCategoryType = {
  id: string.isRequired,
  name: string.isRequired,
  tooltip: string.isRequired,
  iconClass: string.isRequired,
  enablePill: bool,
  showPill: bool,
  addPilll: func
};

const condition = {
  id: string.isRequired,
  value: object.isRequired,
  conditionType: string.isRequired
};

SearchBar.defaultProps = {
  color: '#eeeeee',
  enabledEngineCategories: [],
  searchParameters: [],
  addPill: id => console.log('Open search pill modal', id)
};

export { SearchBar, supportedEngineCategoryType };
