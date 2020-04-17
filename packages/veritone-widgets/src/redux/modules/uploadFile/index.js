import { clamp, mean, isNaN, get, isArray, isEmpty} from 'lodash';
import update from 'immutability-helper';
import { helpers } from 'veritone-redux-common';
const { createReducer } = helpers;
export const namespace = 'uploadFile';
// export const PICK_START = `${namespace}_PICK_START`;
// export const PICK_END = `${namespace}_PICK_END`;
// export const RETRY_REQUEST = `${namespace}_RETRY_REQUEST`;
// export const RETRY_DONE = `${namespace}_RETRY_DONE`;
// export const ABORT_REQUEST = `${namespace}_ABORT_REQUEST`;
// export const UPLOAD_REQUEST = `${namespace}_UPLOAD_REQUEST`;
// export const UPLOAD_PROGRESS = `${namespace}_UPLOAD_PROGRESS`;
// export const UPLOAD_COMPLETE = `${namespace}_UPLOAD_COMPLETE`;
// export const CLEAR_FILEPICKER_DATA = `${namespace}_CLEAR_FILEPICKER_DATA`;
// export const ON_SELECTION_CHANGE = `${namespace}_ON_SELECTION_CHANGE`;
// export const REMOVE_FILE_UPLOAD = `${namespace}_REMOVE_FILE_UPLOAD`;
// export const SHOW_EDIT_FILE_UPLOAD = `${namespace}_SHOW_EDIT_FILE_UPLOAD`;
// export const HIDE_EDIT_FILE_UPLOAD = `${namespace}_HIDE_EDIT_FILE_UPLOAD`;
// export const FETCH_ENGINE_CATEGORIES_REQUEST = `${namespace}_FETCH_ENGINE_CATEGORIES_REQUEST`;
// export const FETCH_ENGINE_CATEGORIES_SUCCESS = `${namespace}_FETCH_ENGINE_CATEGORIES_SUCCESS`;
// export const FETCH_ENGINE_CATEGORIES_FAILURE = `${namespace}_FETCH_ENGINE_CATEGORIES_FAILURE`;
import * as actions from './actions';

const defaultPickerState = {
  open: false,
  state: 'selecting', // selecting | uploading | complete
  progressPercentByFileKey: {},
  success: false,
  error: false,
  warning: false,
  uploadResult: [],
  //isShowListFile: false
  checkedFile: [],
  currentEngineCategory: '67cd4dd0-2f75-445d-a6f0-2f297d6cd182'
};

const defaultState = {
  // populated like:
  // [pickerId]: { ...defaultPickerState }

};
const currentEngineCategoryDefault = '67cd4dd0-2f75-445d-a6f0-2f297d6cd182';
const makeLibrariesByCategories = (
  entityIdentifierTypes,
  libraries
) => {
  const availableLibraries = libraries
    .filter(library =>
      (
        get(
          library,
          'libraryType.entityIdentifierTypes',
          []
        ) || []
      ).some(({ id }) => entityIdentifierTypes.includes(id))
    )
    .reduce(
      (libraries, library) => ({
        ...libraries,
        [library.id]: library
      }),
      {}
    );
  return isEmpty(availableLibraries)
    ? null
    : availableLibraries;
}

export default createReducer(defaultState, {
  [actions.PICK_START](
    state,
    {
      meta: { id }
    }
  ) {
    return {
      [id]: {
        ...defaultPickerState,
        ...state[id],
        open: true,
        state: 'selecting'
      }
    };
  },
  [actions.PICK_END](
    state,
    {
      payload: { type },
      meta: { id }
    }
  ) {
    return {
      ...state,
      [id]: {
        ...state[id],
        open: false,
        state: state[id].uploadResult.length ? 'complete' : 'overview'
      }
    };
  },
  [actions.CLEAR_FILEPICKER_DATA](
    state,
    {
      meta: { id }
    }
  ) {
    return update(state, {
      $unset: [id]
    });
  },
  [actions.ABORT_REQUEST](
    state,
    {
      meta: { id, fileKey }
    }
  ) {
    let newProgressPercentByFileKey = get(state, [id, 'progressPercentByFileKey'], {});
    if (fileKey) {
      newProgressPercentByFileKey = update(newProgressPercentByFileKey, {
        [fileKey]: {
          aborted: { $set: 'aborted' }
        }
      });
    } else {
      Object.keys(get(state, [id, 'progressPercentByFileKey'], {})).forEach(fileKey => {
        newProgressPercentByFileKey = update(newProgressPercentByFileKey, {
          [fileKey]: {
            aborted: { $set: 'aborted' }
          }
        });
      });
    }
    return {
      ...state,
      [id]: {
        ...state[id],
        progressPercentByFileKey: newProgressPercentByFileKey
      }
    }
  },
  [actions.RETRY_REQUEST](
    state,
    {
      meta: { id }
    }
  ) {
    return {
      ...state,
      [id]: {
        ...state[id],
        state: 'uploading',
        progressPercentByFileKey: {},
        success: null,
        error: null,
        warning: null
      }
    }
  },
  [actions.RETRY_DONE](
    state,
    {
      meta: { id }
    }
  ) {
    return {
      ...state,
      [id]: {
        ...state[id],
        state: 'complete'
      }
    };
  },
  [actions.UPLOAD_REQUEST](
    state,
    {
      meta: { id }
    }
  ) {
    // todo: status message
    return {
      ...state,
      [id]: {
        ...state[id],
        state: 'uploading',
        progressPercentByFileKey: {},
        success: null,
        error: null,
        warning: null,
        //uploadResult: null
      }
    };
  },
  [actions.UPLOAD_PROGRESS](
    state,
    {
      payload,
      meta: { fileKey, id }
    }
  ) {
    // todo: status message
    return {
      ...state,
      [id]: {
        ...state[id],
        progressPercentByFileKey: {
          ...state[id].progressPercentByFileKey,
          [fileKey]: {
            ...state[id].progressPercentByFileKey[fileKey],
            ...payload
          }
        }
      }
    };
  },
  [actions.UPLOAD_COMPLETE](
    state,
    {
      payload,
      meta: { warning, error, id }
    }
  ) {
    const errorMessage = get(error, 'message', error); // Error or string
    // Extract failed files to be reuploaded
    const failedFiles = isArray(payload)
      ? payload
        .filter(result => result.error)
        .map(result => result.file)
      : [];
    // Combine existing uploadResult if any
    const prevUploadResult = (get(state, [id, 'uploadResult']) || [])
      .filter(result => !result.error);
    return {
      ...state,
      [id]: {
        ...state[id],
        success: !(warning || error) || null,
        error: error ? errorMessage : null,
        warning: warning || null,
        state: 'complete',
        uploadResult: prevUploadResult.concat(payload),
        failedFiles,
        isShowListFile: true
      }
    };
  },
  [actions.ON_SELECTION_CHANGE](state, { payload: { id, value, type }}) {
    let newChecked = [...state[id].checkedFile];
    const currentIndex = newChecked.indexOf(value);
    if(type === 'all'){
      if (newChecked.length < state[id].uploadResult.length) {
        newChecked = Object.keys([...state[id].uploadResult]).map(Number);
      } else {
        newChecked = [];
      }
     
    }else {
      if (currentIndex === -1) {
        newChecked.push(value);
      } else {
        newChecked.splice(currentIndex, 1);
      }
    }
    return {
      ...state,
      [id]: {
        ...state[id],
        checkedFile: newChecked
      } 
    }
  },
  [actions.REMOVE_FILE_UPLOAD](state, { payload: { id, value } }) {
    const newCheckedFile = [...state[id].checkedFile].filter(item => !value.includes(item));
    const newUploadResult = [...state[id].uploadResult].filter((item, key) => !value.includes(key));

    return {
      ...state,
      [id]: {
        ...state[id],
        checkedFile: newCheckedFile,
        uploadResult: newUploadResult,
        state: newUploadResult.length ? 'complete' : 'overview',
        isShowListFile: newUploadResult.length ? true : false
      }
    }
  },
  [actions.SHOW_EDIT_FILE_UPLOAD](state, { payload: {id} }) {
    return {
      ...state,
      [id]: {
        ...state[id],
        isShowEditFileUpload: true
      }
    }
  },
  [actions.HIDE_EDIT_FILE_UPLOAD](state, { payload: {id} }) {
    return {
      ...state,
      [id]: {
        ...state[id],
        isShowEditFileUpload: false
      }
    }
  },
  [actions.FETCH_ENGINE_CATEGORIES_SUCCESS](state, { payload: { id, engineCategories }}) {
    const newEngineCategories = engineCategories.filter(item => !actions.CATEGORY_IDS_TO_EXCLUDE.includes(item.id) && item.categoryType && item.engines.records.filter(engine => engine.runtimeType === "edge")
    .length)
    console.log('newEngineCategories', newEngineCategories)
    const librariesCategory = [...newEngineCategories].filter(
      ({ libraryEntityIdentifierTypeIds, engines }) =>
        Array.isArray(libraryEntityIdentifierTypeIds) &&
        libraryEntityIdentifierTypeIds.length > 0 &&
        engines.records.filter(item => item.libraryRequired).length > 0
    );
    const libraries = get(state[id], 'libraries', {});
    const librariesByCategories = [...librariesCategory].reduce(
      (acc, { id, libraryEntityIdentifierTypeIds }) => ({
        ...acc,
        [id]: makeLibrariesByCategories(
          libraryEntityIdentifierTypeIds,
          Object.values(libraries)
        )
      }),
      {}
    );
    return {
      ...state,
      [id]: {
        ...state[id],
        engineCategories: newEngineCategories,
        librariesByCategories
      }
    }
  },
  [actions.FETCH_LIBRARIES_SUCCESS](state, { payload: { id, libraries }}){
    const newLibraries = libraries.reduce(
      (res, value) => {
        if (value.libraryId && value.version > 0) {
          return {
            ...res,
            [value.id]: {
              ...value
            }
          };
        }
        return res
      },
      {}
    );
    return {
      ...state,
      [id]: {
        ...state[id],
        libraries: newLibraries
      }
    }
  },
  [actions.FETCH_ENGINES_SUCCESS](state, { payload: { id, engines } }) {
    const engineByCategories = engines.reduce((res, value) => {
      if(!res[value.category.id]){
        res[value.category.id] = [
          ...value
        ];
      }else {
        res[value.category.id] = [
          ...res[value.category.id],
          value
        ]
      }
      return res;
    }, {})
    return {
      ...state,
      [id]: {
        ...state[id],
        engineByCategories
      }
    }
  },
  [actions.ADD_ENGINE](state, { payload: { id, engineId } }) {
    const currentEngineCategory = get(state[id], 'currentEngineCategory', currentEngineCategoryDefault);
    const category = get(state[id], 'engineCategories', []).find(item => item.id === currentEngineCategory);
    const enginesSelected = get(state[id], 'enginesSelected', []);
    let newEnginesSelected = [...enginesSelected];
    if(!newEnginesSelected.length){
      newEnginesSelected.push({
        categoryId: currentEngineCategory,
        categoryName: category.name,
        engineIds: [engineId]
      })
    }else {
      if(!newEnginesSelected.some(item => item.categoryId === currentEngineCategory)){
        newEnginesSelected.push({
          categoryId: currentEngineCategory,
          categoryName: category.name,
          engineIds: [engineId]
        })
      }else {
        const index = newEnginesSelected.findIndex(item => item.categoryId === currentEngineCategory);
        newEnginesSelected[index] = {
          ...newEnginesSelected[index],
          engineIds: [
            ...newEnginesSelected[index].engineIds,
            engineId
          ]
        }
      }
    }

    return {
      ...state,
      [id]: {
        ...state[id],
        enginesSelected: newEnginesSelected
      }
    }
  },
  [actions.CHANGE_ENGINE](state, { payload: { id, engineId } }) {
    return {
      ...state,
      [id]: {
        ...state[id],
        currentEngineCategory: engineId
      }
    }
  },
  [actions.REMOVE_ENGINE](state, { payload: { id, engineId } }) {
    const enginesSelected = get(state[id], 'enginesSelected', []);
    const newEnginesSelected = [...enginesSelected].map(item => {
      if(item.engineIds.includes(engineId)){
        return {
          ...item,
          engineIds: [
            ...item.engineIds.filter(item => item !== engineId)
          ]
        }
      }
      return item;
    }).filter(item => item.engineIds.length)
    return {
      ...state,
      [id]: {
        ...state[id],
        enginesSelected: newEnginesSelected
      }
    }
  }
});

const local = state => state[namespace];

export const isOpen = (state, id) => get(local(state), [id, 'open']);
export const state = (state, id) =>
  get(local(state), [id, 'state'], 'overview');

// Keep this in case we want to go back to using mean percentage progresses
export const progressPercent = (state, id) => {
  const currentProgress = get(local(state), [id, 'progressPercentByFileKey']);
  if (!currentProgress) {
    return 0;
  }

  const meanProgress = mean(Object.values(currentProgress));
  const rounded = Math.round(meanProgress);
  return isNaN(rounded) ? 0 : rounded;
};
export const percentByFiles = (state, id) => {
  const currentFiles = get(local(state), [id, 'progressPercentByFileKey'], {});
  return Object.keys(currentFiles).map(key => {
    const value = currentFiles[key];
    return {
      key,
      value
    };
  })
}
export const failedFiles = (state, id) => {
  const failedFiles = get(local(state), [id, 'failedFiles'], []);
  return failedFiles;
};
export const uploadResult = (state, id) => get(local(state), [id, 'uploadResult'], []);
export const didSucceed = (state, id) => !!get(local(state), [id, 'success']);
export const didError = (state, id) => !!get(local(state), [id, 'error']);
export const didWarn = (state, id) => !!get(local(state), [id, 'warning']);
// todo: status message for normal cases
export const statusMessage = (state, id) =>
  get(local(state), [id, 'warning']) || get(local(state), [id, 'error']) || '';
export const isShowListFile = (state, id) => get(local(state), [id, 'isShowListFile'], false);
export const checkedFile = (state, id) => get(local(state), [id, 'checkedFile'], []);
export const isShowEditFileUpload = (state, id) => get(local(state), [id, 'isShowEditFileUpload'], false);
export const engineCategories = (state, id) => get(local(state), [id, 'engineCategories'], []);
export const librariesByCategories = (state, id) => get(local(state), [id, 'librariesByCategories'], {});
export const engineByCategories = (state, id) => get(local(state), [id, 'engineByCategories'], {});
export const currentEngineCategory = (state, id) => get(local(state), [id, 'currentEngineCategory'], currentEngineCategoryDefault);
export const enginesSelected = (state, id) => get(local(state), [id, 'enginesSelected'], []);