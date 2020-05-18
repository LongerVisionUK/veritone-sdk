import { mean, isNaN, get, isArray, isEmpty } from 'lodash';
import update from 'immutability-helper';
import { helpers } from 'veritone-redux-common';
const { createReducer } = helpers;
export const namespace = 'uploadFile';
import * as actions from './actions';
import { getDateTimeNow } from '../../../shared/util';
const defaultPickerState = {
  open: false,
  state: 'selecting', // selecting | uploading | complete
  progressPercentByFileKey: {},
  success: false,
  error: false,
  warning: false,
  uploadResult: [],
  checkedFile: [],
  currentEngineCategory: '67cd4dd0-2f75-445d-a6f0-2f297d6cd182',
  uploadResultEdit: {
    getUrlProgramImage: '',
    programLiveImage: '',
    getUrlProgramLiveImage: '',
    uploadResultId: [],
    fileName: '',
    dateTime: '',
    tagsEdit: []
  }
};

const defaultState = {
  // populated like:
  // [pickerId]: { ...defaultPickerState }

};
const currentEngineCategoryDefault = '67cd4dd0-2f75-445d-a6f0-2f297d6cd182';
const folderSelectedDefault = { name: 'My Organization', treeObjectId: "c548f7e5-a174-4d4f-8660-839048546aab" };
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
      meta: { id, type }
    }
  ) {
    return {
      [id]: {
        ...defaultPickerState,
        ...state[id],
        open: true,
        state: 'selecting',
        type
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
        warning: null
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
    let prevUploadResult = (get(state, [id, 'uploadResult']) || [])
      .filter(result => !result.error);
    const type = get(state[id], 'type', '');
    const checkedFile = get(state[id], 'checkedFile', []);
    let uploadResultEdit = get(state[id], 'uploadResultEdit', {});
    if (type === 'programImage') {
      //prevUploadResult = prevUploadResult.map(item => ({...item,  programImage: payload[0].unsignedUrl, getUrlProgramImage: payload[0].getUrl}))
      uploadResultEdit = {
        ...uploadResultEdit,
        programImage: payload[0].unsignedUrl,
        getUrlProgramImage: payload[0].getUrl,
        uploadResultId: checkedFile
      }
    }
    if (type === 'programLiveImage') {
      //prevUploadResult = prevUploadResult.map(item => ({...item,  programImage: payload[0].unsignedUrl, getUrlProgramImage: payload[0].getUrl}))
      uploadResultEdit = {
        ...uploadResultEdit,
        programLiveImage: payload[0].unsignedUrl,
        getUrlProgramLiveImage: payload[0].getUrl,
        uploadResultId: checkedFile
      }
    }
    // if(checkedFile.length === 1 && type === 'programImage') {
    //   prevUploadResult[checkedFile[0]] = {
    //     ...prevUploadResult[checkedFile[0]],
    //     programImage: payload[0].unsignedUrl,
    //     getUrlProgramImage: payload[0].getUrl
    //   }
    // }
    // if(checkedFile.length === 1 && type === 'programLiveImage') {
    //   prevUploadResult[checkedFile[0]] = {
    //     ...prevUploadResult[checkedFile[0]],
    //     programLiveImage: payload[0].unsignedUrl,
    //     getUrlProgramLiveImage: payload[0].getUrl
    //   }
    // }
    return {
      ...state,
      [id]: {
        ...state[id],
        success: !(warning || error) || null,
        error: error ? errorMessage : null,
        warning: warning || null,
        state: 'complete',
        uploadResult: type === 'uploadFile' ? prevUploadResult.concat(payload) : prevUploadResult,
        failedFiles,
        isShowListFile: true,
        uploadResultEdit
      }
    };
  },
  [actions.ON_SELECTION_CHANGE](state, { payload: { id, value, type } }) {
    let newChecked = [...state[id].checkedFile];
    const currentIndex = newChecked.indexOf(value);
    if (type === 'all') {
      if (newChecked.length < state[id].uploadResult.length) {
        newChecked = Object.keys([...state[id].uploadResult]).map(Number);
      } else {
        newChecked = [];
      }

    } else {
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
  [actions.SHOW_EDIT_FILE_UPLOAD](state, { payload: { id } }) {
    const uploadResult = get(state[id], 'uploadResult', []);
    const checkedFile = get(state[id], 'checkedFile', []);
    return {
      ...state,
      [id]: {
        ...state[id],
        isShowEditFileUpload: true,
        uploadResultEdit: {
          ...state[id].uploadResultEdit,
          fileName: checkedFile.length === 1 ? uploadResult[0].fileName : '',
          dateTime: getDateTimeNow(),
          uploadResultId: checkedFile
        }
      }
    }
  },
  [actions.HIDE_EDIT_FILE_UPLOAD](state, { payload: { id } }) {
    return {
      ...state,
      [id]: {
        ...state[id],
        isShowEditFileUpload: false,
        uploadResultEdit: {
          programImage: '',
          getUrlProgramImage: '',
          programLiveImage: '',
          getUrlProgramLiveImage: '',
          uploadResultId: [],
          tagsEdit: []
        }
      }
    }
  },
  [actions.FETCH_LIBRARIES_REQUEST](state, { meta: { id } }) {
    return {
      ...state,
      [id]: {
        ...state[id],
        loadingUpload: true
      }
    }
  },
  [actions.FETCH_ENGINE_CATEGORIES_SUCCESS](state, { payload: { id, engineCategories } }) {
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
  [actions.FETCH_LIBRARIES_SUCCESS](state, { payload: { id, libraries } }) {
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
    const enginesFilter = engines.filter(item => item.runtimeType === "edge");
    console.log('enginesFilter', enginesFilter)
    let engineByCategories = enginesFilter.reduce((res, value) => {
      if (!res[value.category.id]) {
        res[value.category.id] = [
          value
        ].sort((a, b) => {
          if (a.isConductor && b.isConductor) {
            return 0;
          } else if (a.isConductor) {
            return -1;
          } else if (b.isConductor) {
            return 1;
          }
          return 0;
        });
      } else {
        res[value.category.id] = [
          ...res[value.category.id],
          value
        ].sort((a, b) => {
          if (a.isConductor && b.isConductor) {
            return 0;
          } else if (a.isConductor) {
            return -1;
          } else if (b.isConductor) {
            return 1;
          }
          return 0;
        });
      }
      return res;
    }, {})
    return {
      ...state,
      [id]: {
        ...state[id],
        engineByCategories,
        enginesDefault: enginesFilter,
        loadingUpload: false
      }
    }
  },
  [actions.ADD_ENGINE](state, { payload: { id, engineId } }) {
    const currentEngineCategory = get(state[id], 'currentEngineCategory', currentEngineCategoryDefault);
    const category = get(state[id], 'engineCategories', []).find(item => item.id === currentEngineCategory);
    const enginesSelected = get(state[id], 'enginesSelected', []);
    const enginesDefault = get(state[id], 'enginesDefault', []);
    let engineSelected = enginesDefault.find(item => item.id === engineId);
    engineSelected = {
      ...engineSelected,
      expand: true
    }
    let newEnginesSelected = [...enginesSelected];
    if (!newEnginesSelected.length) {
      newEnginesSelected.push({
        categoryId: currentEngineCategory,
        categoryName: category.name,
        engineIds: [engineSelected]
      })
    } else {
      if (!newEnginesSelected.some(item => item.categoryId === currentEngineCategory)) {
        newEnginesSelected.push({
          categoryId: currentEngineCategory,
          categoryName: category.name,
          engineIds: [engineSelected]
        })
      } else {
        const index = newEnginesSelected.findIndex(item => item.categoryId === currentEngineCategory);
        newEnginesSelected[index] = {
          ...newEnginesSelected[index],
          engineIds: [
            ...newEnginesSelected[index].engineIds,
            engineSelected
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
      if (item.engineIds.some(item => item.id === engineId)) {
        return {
          ...item,
          engineIds: [
            ...item.engineIds.filter(item => item.id !== engineId)
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
  },

  [actions.SHOW_MODAL_SAVE_TEMPLATE](state, { payload: { id, value } }) {
    return {
      ...state,
      [id]: {
        ...state[id],
        isShowModalSaveTemplate: value
      }
    }
  },

  [actions.HIDE_MODAL_SAVE_TEMPLATE](state, { payload: { id, value } }) {
    return {
      ...state,
      [id]: {
        ...state[id],
        isShowModalSaveTemplate: value
      }
    }
  },

  [actions.SAVE_TEMPLATE_SUCCESS](state, { payload: { id } }) {
    return {
      ...state,
      [id]: {
        ...state[id],
        isShowModalSaveTemplate: false
      }
    }
  },

  [actions.FETCH_TEMPLATES_SUCCESS](state, { payload: { id, templates } }) {
    const enginesDefault = get(state[id], 'enginesDefault', []);
    const newTemplates = templates.map(item => {
      const newTaskList = [];
      if (!item.taskList[0].engineIds) {
        item.taskList.forEach(element => {
          if (!newTaskList.some(item => item.categoryId === element.category.engineCategoryId)) {
            newTaskList.push({
              categoryId: element.category.engineCategoryId,
              categoryName: element.category.engineCategoryName,
              engineIds: [element.engineId]
            });
          } else if (!newTaskList.some(item => item.engineIds.includes(element.engineId))) {
            const index = newTaskList.findIndex(item => item.categoryId === element.category.engineCategoryId)
            newTaskList[index].engineIds = [
              ...newTaskList[index].engineIds,
              element.engineId
            ]
          }
        })
        return {
          ...item,
          taskList: newTaskList
        };
      }
      return item;
    })
    return {
      ...state,
      [id]: {
        ...state[id],
        templates: newTemplates
      }
    }
  },
  [actions.CHANGE_TEMPLATE](state, { payload: { id, templateId } }) {
    const templates = get(state[id], 'templates', []);
    const newEnginesSelected = [...templates].find(item => item.id === templateId).taskList
    return {
      ...state,
      [id]: {
        ...state[id],
        enginesSelected: newEnginesSelected
      }
    }
  },
  [actions.ON_CLICK_ENGINE_CATEGORY](state, { payload: { id, engineCategoryId } }) {
    const enginesSelected = get(state[id], 'enginesSelected', []);
    const engineByCategories = get(state[id], 'engineByCategories', {});
    const librariesSelected = get(state[id], 'librariesSelected', {});
    const isLibrarySelected = !!(!isEmpty(librariesSelected) && Array.isArray(librariesSelected[engineCategoryId]) && librariesSelected[engineCategoryId].length);
    console.log('isLibrarySelected', isLibrarySelected)
    const engineCategoriesSelected = !isEmpty(engineByCategories) && engineByCategories[engineCategoryId].filter(item => item.libraryRequired === isLibrarySelected);
    console.log('engineCategoriesSelected', engineCategoriesSelected)
    let engineToSelect = engineCategoriesSelected.length && engineCategoriesSelected[0];
    if(!engineToSelect) {
      return {
        ...state
      }
    }
    engineToSelect = {
      ...engineToSelect,
      expand: true
    }
    if (isLibrarySelected) {
      engineToSelect = {
        ...engineToSelect,
        librariesSelected: !isEmpty(librariesSelected) && Array.isArray(librariesSelected[engineCategoryId]) && librariesSelected[engineCategoryId]
      }
    }
    let newEnginesSelected = [];
    if (enginesSelected.some(item => item.categoryId === engineCategoryId)) {
      newEnginesSelected = [...enginesSelected].filter(item => item.categoryId !== engineCategoryId)
    } else {
      newEnginesSelected = [
        ...enginesSelected,
        {
          categoryId: engineCategoryId,
          categoryName: engineToSelect.category.name,
          engineIds: [engineToSelect]
        }
      ]
    }
    return {
      ...state,
      [id]: {
        ...state[id],
        enginesSelected: newEnginesSelected
      }
    }
  },
  [actions.FETCH_CONTENT_TEMPLATES_SUCCESS](state, { payload: { id, contentTemplates } }) {
    return {
      ...state,
      [id]: {
        ...state[id],
        contentTemplates
      }
    }
  },
  [actions.ADD_CONTENT_TEMPLATE](state, { payload: { id, contentTemplateId } }) {
    const contentTemplates = get(state[id], 'contentTemplates', []);
    const contentTemplate = contentTemplates.find(item => item.id === contentTemplateId);
    let contentTemplateSelected = get(state[id], 'contentTemplateSelected', []);
    const records = get(contentTemplate, 'schemas.records', []).find(item => item.status === 'published');
    const { properties = {} } = get(records, 'definition', {});
    const { required = [] } = get(records, 'definition', {});
    const data = Object.keys(properties).reduce((res, value) => ({
      ...res,
      [value]: ''
    }), {})
    contentTemplateSelected = [
      ...contentTemplateSelected,
      {
        ...contentTemplate,
        data,
        validate: required
      }
    ]
    return {
      ...state,
      [id]: {
        ...state[id],
        contentTemplateSelected
      }
    }
  },
  [actions.REMOVE_CONTENT_TEMPLATE](state, { payload: { id, contentTemplateId } }) {
    const contentTemplateSelected = get(state[id], 'contentTemplateSelected', []);
    const newContentTemplateSelected = contentTemplateSelected.filter(item => item.id !== contentTemplateId);
    return {
      ...state,
      [id]: {
        ...state[id],
        contentTemplateSelected: newContentTemplateSelected
      }
    }
  },
  [actions.ON_CHANGE_FORM_CONTENT_TEMPLATE](state, { payload: { id, contentTemplateId, name, value } }) {
    let contentTemplateSelected = get(state[id], 'contentTemplateSelected', []);
    const newContentTemplateSelected = [...contentTemplateSelected].map(item => {
      if (item.id === contentTemplateId) {
        return {
          ...item,
          data: {
            ...item.data,
            [name]: value
          },
          validate: value.length ? item.validate.filter(element => element !== name) : item.validate
        }
      }
      return item;
    })
    return {
      ...state,
      [id]: {
        ...state[id],
        contentTemplateSelected: newContentTemplateSelected
      }
    }
  },
  [actions.SELECT_FOLDER](state, { payload: { id, selectedFolder } }) {
    return {
      ...state,
      [id]: {
        ...state[id],
        selectedFolder: {
          ...selectedFolder,
          name: selectedFolder.treeObjectId === 'c548f7e5-a174-4d4f-8660-839048546aab' ? 'My Organization' : selectedFolder.name
        }
      }
    }
  },
  [actions.ADD_TAGS_CUSTOMIZE](state, { payload: { id, value, type } }) {
    if (type === 'editFileUpload') {
      return {
        ...state,
        [id]: {
          ...state[id],
          uploadResultEdit: {
            ...state[id].uploadResultEdit,
            tagsEdit: state[id].uploadResultEdit.tagsEdit.length ? [
              ...state[id].uploadResultEdit.tagsEdit,
              {
                value
              }
            ] : [{ value }]
          }
        }
      }
    } else {
      return {
        ...state,
        [id]: {
          ...state[id],
          tagsCustomize: state[id].tagsCustomize ? [
            ...state[id].tagsCustomize,
            {
              value
            }
          ] : [{ value }]
        }
      }
    }
  },
  [actions.REMOVE_TAGS_CUSTOMIZE](state, { payload: { id, value, type } }) {
    if (type === 'editFileUpload') {
      let uploadResultEdit = get(state[id], 'uploadResultEdit', []);
      uploadResultEdit.tagsEdit = uploadResultEdit.tagsEdit.filter(item => item.value !== value);
      return {
        ...state,
        [id]: {
          ...state[id],
          uploadResultEdit
        }
      }

    } else {
      const tagsCustomize = get(state[id], 'tagsCustomize', []).filter(item => item.value !== value);
      return {
        ...state,
        [id]: {
          ...state[id],
          tagsCustomize
        }
      }
    }
  },
  [actions.FETCH_CREATE_JOB_SUCCESS](state, { payload: { id, records, key } }) {
    const uploadResult = get(state[id], 'uploadResult', []);
    if ((uploadResult.length - 1) === key) {
      return {
        ...state,
        [id]: {
          ...state[id],
          uploadResult: [],
          state: 'overview',
          enginesSelected: [],
          contentTemplateSelected: [],
          tagsCustomize: [],
          selectedFolder: folderSelectedDefault,
          checkedFile: []
        }
      }
    }
    return {
      ...state
    }

  },
  [actions.ON_CHANGE_LIBRARIES](state, { payload: { id, categoryId, value } }) {
    let librariesSelected = get(state[id], 'librariesSelected', {});
    if (!Object.keys(librariesSelected)) {
      librariesSelected = {
        [categoryId]: value
      }
    } else {
      librariesSelected = {
        ...librariesSelected,
        [categoryId]: value
      }
    }
    return {
      ...state,
      [id]: {
        ...state[id],
        librariesSelected
      }
    }
  },
  [actions.ON_CHANGE_FORM_ENGINE_SELECTED](state, { payload: { id, engineId, name, value } }) {
    const enginesSelected = get(state[id], 'enginesSelected', []);
    const newEnginesSelected = [...enginesSelected].map(item => {
      if (item.engineIds.some(engine => engine.id === engineId)) {
        const index = item.engineIds.findIndex(item => item.id === engineId);
        item.engineIds[index].fields = item.engineIds[index].fields.map(item => {
          if (item.name === name) {
            return {
              ...item,
              defaultValue: value
            }
          }
          return item
        })
        return item;
      }
      return item;
    })
    return {
      ...state,
      [id]: {
        ...state[id],
        enginesSelected: newEnginesSelected
      }
    }
  },
  [actions.ON_CHANGE_LIBRARIES_ENGINE_SELECTED](state, { payload: { id, engineId, value } }) {
    const enginesSelected = get(state[id], 'enginesSelected', []);
    const newEnginesSelected = [...enginesSelected].map(item => {
      if (item.engineIds.some(engine => engine.id === engineId)) {
        const index = item.engineIds.findIndex(item => item.id === engineId);
        item.engineIds[index].librariesSelected = value;
        return item;
      }
      return item;
    })
    return {
      ...state,
      [id]: {
        ...state[id],
        enginesSelected: newEnginesSelected
      }
    }
  },
  [actions.ON_CLOSE_MODAL_UPLOAD_FILE](state, { payload: { id } }) {
    return {
      ...state,
      [id]: {
        ...defaultPickerState,
        state: 'overview'
      }
    }
  },
  [actions.ON_CHANGE_EXPAND](state, { payload: { id, categoryId, engineId, expand } }) {
    const enginesSelected = get(state[id], 'enginesSelected', []);
    const newEnginesSelected = enginesSelected.map(item => {
      if (item.categoryId === categoryId) {
        const findIndex = item.engineIds.findIndex(item => item.id === engineId);
        item.engineIds[findIndex] = {
          ...item.engineIds[findIndex],
          expand
        }
        return item;
      }
      return item;
    })
    return {
      ...state,
      [id]: {
        ...state[id],
        enginesSelected: newEnginesSelected
      }
    }
  },
  [actions.ON_CHANGE_FILE_NAME_EDIT](state, { payload: { id, value } }) {
    // const checkedFile = get(state[id], 'checkedFile', []);
    // const uploadResult = get(state[id], 'uploadResult', []);
    // const uploadResultEdit = get(state[id], 'uploadResultEdit', {});
    // const newUploadResult = uploadResult.map((item, key) => {
    //   if(checkedFile.includes(key)) {
    //     return {
    //       ...item,
    //       fileName: value
    //     }
    //   }
    //   return item;
    // })
    return {
      ...state,
      [id]: {
        ...state[id],
        uploadResultEdit: {
          ...state[id].uploadResultEdit,
          fileName: value
        }
      }
    }
  },
  [actions.ON_CHANGE_DATE_TIME_EDIT](state, { payload: { id, value } }) {
    // const checkedFile = get(state[id], 'checkedFile', []);
    // const uploadResult = get(state[id], 'uploadResult', []);
    // const newUploadResult = uploadResult.map((item, key) => {
    //   if(checkedFile.includes(key)) {
    //     return {
    //       ...item,
    //       dateTime: new Date(value).toISOString()
    //     }
    //   }
    //   return item;
    // })
    return {
      ...state,
      [id]: {
        ...state[id],
        uploadResultEdit: {
          ...state[id].uploadResultEdit,
          dateTime: value
        }
      }
    }
  },
  [actions.SAVE_EDIT_FILE_UPLOAD](state, { payload: { id } }) {
    const uploadResultEdit = get(state[id], 'uploadResultEdit', []);
    const uploadResult = get(state[id], 'uploadResult', []);
    const newUploadResult = uploadResult.map((item, key) => {
      if (uploadResultEdit.uploadResultId.includes(key)) {
        return {
          ...item,
          ...uploadResultEdit,
          programImage: uploadResultEdit.programImage || item.programImage,
          getUrlProgramImage: uploadResultEdit.getUrlProgramImage || item.getUrlProgramImage,
          programLiveImage: uploadResultEdit.programLiveImage || item.programLiveImage,
          getUrlProgramLiveImage: uploadResultEdit.getUrlProgramLiveImage || item.getUrlProgramLiveImage,
          uploadResultId: uploadResultEdit.uploadResultId.length && uploadResultEdit.uploadResultId || item.uploadResultId,
          tagsEdit: uploadResultEdit.tagsEdit.length && uploadResultEdit.tagsEdit || item.tagsEdit
        }
      }
      return item;
    })
    return {
      ...state,
      [id]: {
        ...state[id],
        uploadResult: newUploadResult,
        uploadResultEdit: {
          programImage: '',
          getUrlProgramImage: '',
          programLiveImage: '',
          getUrlProgramLiveImage: '',
          uploadResultId: [],
          tagsEdit: []
        },
        isShowEditFileUpload: false
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
export const isShowModalSaveTemplate = (state, id) => get(local(state), [id, 'isShowModalSaveTemplate'], false);
export const templates = (state, id) => get(local(state), [id, 'templates'], []);
export const contentTemplates = (state, id) => get(local(state), [id, 'contentTemplates'], []);
export const contentTemplateSelected = (state, id) => get(local(state), [id, 'contentTemplateSelected'], []);
export const selectedFolder = (state, id) => get(local(state), [id, 'selectedFolder'], folderSelectedDefault);
export const tagsCustomize = (state, id) => get(local(state), [id, 'tagsCustomize'], []);
export const loadingUpload = (state, id) => get(local(state), [id, 'loadingUpload'], false);
export const librariesSelected = (state, id) => get(local(state), [id, 'librariesSelected'], {});
export const libraries = (state, id) => get(local(state), [id, 'libraries'], {});
export const uploadResultEdit = (state, id) => get(local(state), [id, 'uploadResultEdit'], {});