import {
  call,
  takeEvery,
  put,
  select
} from 'redux-saga/effects';
import { get } from 'lodash';
import { handleRequest } from './helper';
import * as folderReducer from './index';
import * as folderSelector from './selector';
export default function* deleteFolderSaga() {
  yield takeEvery(folderReducer.DELETE_FOLDER, deleteFolder);
}

function* deleteFolder(action) {
  const { folderId } = action.payload;
  yield put(folderReducer.deleteFolderStart(folderId));
  const foldersData = yield select(folderSelector.folderData);
  const folder = get(foldersData, ['byId', folderId], {});
  if (folder.hasContent) {
    //for improving
  }
  const queryFolder = `query folder($id:ID!){
    folder(id: $id){
      id
      name
      orderIndex
      parent{
        id
      }
      treeObjectId
    }
  }`;
  const variablesFolder = {
    id: folderId
  }
  const { error, response } = yield call(handleRequest, { query: queryFolder, variables: variablesFolder });
  if (error) {
    return yield put(folderReducer.deleteFolderError(folderId));
  }
  const { orderIndex, parent, treeObjectId } = get(response, 'data.folder', {});
  const query = `
    mutation deleteFolder($id: ID!,$orderIndex: Int! ){
      deleteFolder(input:{
        id: $id,
        orderIndex: $orderIndex
      })
      {
        id
      }
    }
  `
  const variables = {
    id: treeObjectId,
    orderIndex
  }
  const { error: errorDelete } = yield call(handleRequest, { query, variables });
  if (errorDelete) {
    yield put(folderReducer.deleteFolderError(folderId));
  }
  yield put(folderReducer.initFolder(parent.id));
  return yield put(folderReducer.deleteFolderSuccess(folderId));
}