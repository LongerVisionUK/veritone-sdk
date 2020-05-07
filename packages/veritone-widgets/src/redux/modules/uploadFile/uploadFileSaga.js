import {
  fork,
  all,
  call,
  put,
  take,
  takeEvery,
  select
} from 'redux-saga/effects';
import { isArray, noop, get, pickBy, identity } from 'lodash';

import { modules } from 'veritone-redux-common';
const { auth: authModule, config: configModule } = modules;

import { helpers } from 'veritone-redux-common';
const { fetchGraphQLApi } = helpers;
import uploadFilesChannel from '../../../shared/uploadFilesChannel';
import { handleRequest } from '../../../shared/util';
import {
  enginesSelected,
  uploadResult,
  tagsCustomize,
  contentTemplateSelected,
  selectedFolder
} from './';
// import {
//   ABORT_REQUEST,
//   UPLOAD_REQUEST,
//   RETRY_REQUEST,
//   RETRY_DONE,
//   uploadProgress,
//   uploadComplete,
//   endPick,
//   failedFiles,
//   uploadResult,
//   FETCH_ENGINE_CATEGORIES_REQUEST
// } from './';
import * as actions from './actions';
import { engineIsSelected } from '../engineSelection';
let requestMap;

function* finishUpload(id, result, { warning, error }, callback) {
  yield put(actions.uploadComplete(id, result, { warning, error }));

  if (warning || error) {
    // There are failed uploads, don't close out and display error screen
    return;
  }
  yield put(actions.endPick(id, 'complete'));
  // Get accumulated results, not just what's in the current upload/retry request
  // If there's no results, then the user must have aborted them all
  const totalResults = yield select(uploadResult, id);
  yield call(callback, totalResults, { warning, error, cancelled: !totalResults.length });
}

function* uploadFileSaga(id, fileOrFiles, callback = noop) {
  const files = isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
  const query = `query urls($name: String!){
        getSignedWritableUrl(key: $name) {
          url
          key
          bucket
          expiresInSeconds
          getUrl
          unsignedUrl
        }
      }`;

  const config = yield select(configModule.getConfig);
  // const { apiRoot, graphQLEndpoint } = config;
  // const graphQLUrl = `${apiRoot}/${graphQLEndpoint}`;
  // const sessionToken = yield select(authModule.selectSessionToken);
  // const oauthToken = yield select(authModule.selectOAuthToken);

  // get a signed URL for each object to be uploaded
  let signedWritableUrlResponses;
  // try {
  //   signedWritableUrlResponses = yield all(
  //     files.map(({ name }) =>
  //       call(fetchGraphQLApi, {
  //         endpoint: graphQLUrl,
  //         query: query,
  //         // todo: add uuid to $name to prevent naming conflicts
  //         variables: { name },
  //         token: sessionToken || oauthToken
  //       })
  //     )
  //   );
  // } catch (error) {

  // }
  try {
    const response = yield all(
      files.map(({ name }) =>
        call(handleRequest, { query, variables: { name } })
      )
    );
    signedWritableUrlResponses = response.map(item => item.response)
  } catch (error) {
    //return yield* finishUpload(id, null, { error }, callback);
  }
  //signedWritableUrlResponses = response;  
  let uploadDescriptors; // { url, key, bucket, etc }
  try {
    uploadDescriptors = signedWritableUrlResponses.map(
      ({ data: { getSignedWritableUrl }, errors }) => {
        if (errors && errors.length) {
          throw new Error(
            `Call to getSignedWritableUrl returned error: ${errors[0].message}`
          );
        }

        return getSignedWritableUrl;
      }
    );
  } catch (e) {
    return yield* finishUpload(id, null, { error: e.message }, callback);
  }

  let resultChan;
  try {
    const uploadChannelResult = yield call(uploadFilesChannel, uploadDescriptors, files);
    resultChan = uploadChannelResult.channel;
    requestMap = uploadChannelResult.requestMap;
  } catch (error) {
    return yield* finishUpload(id, null, { error }, callback);
  }

  let result = [];

  while (result.length !== files.length) {
    const {
      progress = 0,
      aborted,
      error,
      success,
      file,
      descriptor: { key, bucket, expiresInSeconds, getUrl, unsignedUrl }
    } = yield take(resultChan);

    if (success || error) {
      yield put(actions.uploadProgress(id, key, {
        name: file.name,
        type: file.type,
        size: file.size,
        error,
        aborted,
        percent: 100
      }));

      result.push({
        key,
        bucket,
        expiresInSeconds,
        fileName: file.name,
        size: file.size,
        type: file.type,
        aborted,
        error: error || false,
        unsignedUrl: error ? null : unsignedUrl,
        getUrl: error ? null : getUrl,
        file
      });

      continue;
    }

    yield put(actions.uploadProgress(id, key, {
      name: file.name,
      type: file.type,
      size: file.size,
      percent: progress
    }));
  }

  // Remove aborted requests
  result = result.filter(r => !r.aborted);

  const isError = result.length && result.every(e => e.error);
  const isWarning = !isError && result.some(e => e.error);

  yield* finishUpload(
    id,
    result,
    {
      warning: isWarning ? 'Some files failed to upload.' : false,
      error: isError ? 'All files failed to upload.' : false
    },
    callback
  );
}

function* watchUploadRequest() {
  yield takeEvery(actions.UPLOAD_REQUEST, function* (action) {
    const { files, callback } = action.payload;
    const { id } = action.meta;
    yield call(uploadFileSaga, id, files, callback);
  });
}

function* watchRetryRequest() {
  yield takeEvery(actions.RETRY_REQUEST, function* (action) {
    const { callback } = action.payload;
    const { id } = action.meta;
    const erroredFiles = yield select(actions.failedFiles, id) || [];
    yield call(uploadFileSaga, id, erroredFiles, callback);
  });
}

function* watchRetryDone() {
  yield takeEvery(actions.RETRY_DONE, function* (action) {
    const { callback } = action.payload;
    const { id } = action.meta;
    const uploads = yield select(uploadResult, id) || [];
    const completedUploads = uploads.filter(upload => !upload.error);

    yield put(actions.endPick(id));
    yield call(callback, completedUploads, { cancelled: !completedUploads.length });
  });
}

function* watchAbortions() {
  yield takeEvery(actions.ABORT_REQUEST, function* (action) {
    if (!requestMap) {
      return;
    }
    const { fileKey } = action.meta;
    // Abort requests somehow
    if (fileKey && requestMap[fileKey]) {
      yield requestMap[fileKey].abort && requestMap[fileKey].abort();
      delete requestMap[fileKey];
    } else {
      Object.keys(requestMap).forEach(fileKey => {
        requestMap[fileKey].abort && requestMap[fileKey].abort();
        delete requestMap[fileKey];
      });
    }
  });
}

function* watchFetchEngineCategories() {
  yield takeEvery(actions.FETCH_LIBRARIES_SUCCESS, function* (action) {
    const { id } = action.payload;
    const query = `query engineCategories{
      engineCategories(limit:200){
        count
        records{
          id
          name
          iconClass
          description
          engines(limit: 200){
            records{
              id
              name
              libraryRequired
              runtimeType
            }
          }
          libraryEntityIdentifierTypes{
            records{
              id
              label
            }
          }
          libraryEntityIdentifierTypeIds
          categoryType
          searchConfiguration{
            isSearchEnabled
            searchMetadataKey
            searchFields{
              searchField
              indexField
            }
            autocompleteFields{
              autocompleteField
              indexField
            }
          }
        }
      }
     }  
    `;
    const { error, response } = yield call(handleRequest, { query })
    const { records } = get(response, 'data.engineCategories', []);
    if (error) {
      yield put(actions.fetchEngineCategoriesFailure(id))
    }else {
      yield put(actions.fetchEngineCategoriesSuccess(id, records))
    }
  })
}

function* watchFetchLibraries() {
  yield takeEvery(actions.FETCH_LIBRARIES_REQUEST, function* (action) {
    const { id } = action.meta;
    const query = `query getLibraries{
      libraries(limit: 200) {
        records {
          id
          libraryId: id
          name
          version
          coverImageUrl
          organizationId
          libraryType {
            id
            label
            entityIdentifierTypes {
              id
            }
          }
          summary {
            entityCount
            unpublishedEntityCount
          }
          createdDateTime
        }
      }
    }
    `;
    const { error, response } = yield call(handleRequest, { query })
    const { records } = get(response, 'data.libraries', []);
    if (error) {
      yield put(actions.fetchLibrariesFailure(id))
    }else {
      yield put(actions.fetchLibrariesSuccess(id, records))
    }
  })
}

function* watchFetchEngines() {
  yield takeEvery(actions.FETCH_ENGINE_CATEGORIES_SUCCESS, function* (action) {
    const { id } = action.payload;
    const query = ` query getEngines($offset: Int, $limit: Int) {
      engines(offset: $offset,limit: $limit){
        records {
          id
          name
          description
          libraryRequired
          runtimeType
          logoPath
          deploymentModel
          rating
          website
          price
          isPublic
          asset
          validateUri
          createsTDO
          iconPath
          supportedInputFormats
          isConductor
          fields {
            name
            type
            step
          }
          category {
            id
            name
          }
        }
     }
    }
    `;
    const results = [];
    const pageSize = 200;
    const initialOffset = 0;
    function* fetchEngines(offset) {
      const variables = {
        limit: pageSize,
        offset: offset
      };
      const { error, response } = yield call(handleRequest, { query, variables })
      if (error) {
        yield put(actions.fetchEnginesFailure(id))
      }
      const { records } = get(response, 'data.engines', []);
      results.push(...records);
      if (records.length === pageSize) {
        return yield fetchEngines(offset + pageSize)
      } else {
        yield put(actions.fetchEnginesSuccess(id, results));
      }
    }
    return yield fetchEngines(initialOffset)
  })
}

function* watchSaveTemplate() {
  yield takeEvery(actions.SAVE_TEMPLATE_REQUEST, function* (action) {
    const { id } = action.payload;
    const query = `mutation($name: String!, $taskList: JSONData!) {
      createProcessTemplate(input: {
          name: $name
          taskList: $taskList
      }) {
        process_template_id: id
      }
    }
    `;
    const enginesSelecteds = yield select(enginesSelected, id);
    console.log('enginesSelected', enginesSelecteds);
    const variables = {
      name: action.payload.value,
      taskList: JSON.stringify(enginesSelecteds)
    };
    const { error, response } = yield call(handleRequest, { query, variables })
    //const { records } = get(response, 'data.libraries', []);
    if (error) {
      yield put(actions.saveTemplateFailure(id))
    }else {
      yield put(actions.saveTemplateSuccess(id))
    }
  })
}

function* fetchTemplate(action) {
  const { id } = action.payload;
  const query = `query {
      processTemplates (
              limit: 100
              offset: 0,
  
          ) {
              records {
                  id
                  organizationId
                  name
                  taskList
              
              }
          }
      }
    `;

  const { error, response } = yield call(handleRequest, { query })
  const { records } = get(response, 'data.processTemplates', []);
  if (error) {
    yield put(actions.fetchTemplatesFailure(id))
  }
  yield put(actions.fetchTemplatesSuccess(id, records))
}
function* watchSaveTemplateSuccess() {
  yield takeEvery(actions.SAVE_TEMPLATE_SUCCESS, fetchTemplate);
  yield takeEvery(actions.FETCH_ENGINES_SUCCESS, fetchTemplate);
}

function* watchFetchContentTemplates() {
  yield takeEvery(actions.FETCH_CONTENT_TEMPLATES_REQUEST, function* (action) {
    const { id } = action.payload;
    const query = `query contentTemplates {
      dataRegistries {
        records {
          id
          name
          description
          schemas {
            records {
              id
              status
              definition
              majorVersion
              minorVersion
              validActions
            }
          }
          organizationId
        }
      }
    }
    `;
    const { error, response } = yield call(handleRequest, { query })
    const { records } = get(response, 'data.dataRegistries', []);
    if (error) {
      yield put(actions.fetchContentTemplatesFailure(id))
    }else {
      yield put(actions.fetchContentTemplatesSuccess(id, records))
    }
  })
}

function* watchFetchCreateTdo() {
  yield takeEvery(actions.FETCH_CREATE_TDO_REQUEST, function* (action) {
    const { id } = action.payload;
    const query = `mutation createTDO($input: CreateTDO){
      createTDO(input:$input){
        id
      }
    }  
    `;
    const dataUploadResult = yield select(uploadResult, id);
    const dataTagsCustomize = yield select(tagsCustomize, id);
    const dataContentTemplateSelected = yield select(contentTemplateSelected, id);
    const contentTemplates = dataContentTemplateSelected.map(item => {
      return {
        schemaId: get(item, 'schemas.records[0].id', null),
        data: pickBy(item.data, identity)
      }
    })
    const dataSelectedFolder = yield select(selectedFolder, id);
    const date = new Date().toISOString();
    yield yield all( dataUploadResult.map(item => {
      const dataDetail = {
        'veritone-program': {
          programImage: '',
          data: '',
          programId: '-1',
          programName: ''
        },
        'veritone-permissions': {
          acls: [],
          isPublic: false
        },
        tags: dataTagsCustomize,
        date,
        'veritone-file': {
          fileName: item.fileName,
          size: item.size,
          mimetype: item.type
        },
        'veritone-media-source': {
          mediaSourceTypeId: -5,
          mediaSourceId: -1
        }
      };
      const input = {
        startDateTime: date,
        stopDateTime: date,
        addToIndex: true,
        details: dataDetail,
        name: item.fileName,
        contentTemplates,
        parentFolderId: dataSelectedFolder.treeObjectId,
        sourceData: {
          sourceId: -1
        }
      }
      const variables = {
        input
      };
      const jobConfig = {
        details: dataDetail,
        parentFolderId: dataSelectedFolder.treeObjectId,
        sourceData: {
          sourceId: -1
        }
      }
      // const { error, response } = yield call(handleRequest, { query, variables })
      // const { tdoId } = get(response, 'data.createTDO', null);
      // // if (error) {
      // //   yield put(actions.fetchCreateTdoFailure(id))
      // // }
      // yield put(actions.fetchCreateTdoSuccess(id, tdoId, jobConfig))
      return call(callCreateTdo, { id, query, variables, jobConfig })
    })
    )
  })
}

function* callCreateTdo({ id, query, variables, jobConfig }) {
  const { error, response } = yield call(handleRequest, { query, variables })
      const { tdoId } = get(response, 'data.createTDO', null);
      if (error) {
        yield put(actions.fetchCreateTdoFailure(id))
      }
      yield put(actions.fetchCreateTdoSuccess(id, tdoId, jobConfig))
}
function* watchFetchCreateJob() {
  yield takeEvery(actions.FETCH_CREATE_TDO_SUCCESS, function* (action) {
    const { id, tdoId, jobConfig } = action.payload;
    const query = `mutation createJob($input: CreateJob){
      createJob(input: $input) {
        id
      }
    }  
    `;

    const dataUploadResult = yield select(uploadResult, id);
    const dataEnginesSelecteds = yield select(enginesSelected, id);
  
    yield yield all( dataUploadResult.map(item => {
      const tasks = [
        {
          engineId: "9e611ad7-2d3b-48f6-a51b-0a1ba40feab4",
          payload: {
            tdoId: tdoId,
            url: item.getUrl,
            startTimeOverride: 1587524429
          }
        }
      ];
      dataEnginesSelecteds.forEach(element => {
        element.engineIds.forEach(engine => {
          tasks.push({
            engineId: engine,
            payload: {
              diarise: "true"
            }
          })
        })
      })
      const input = {
        targetId: tdoId,
        tasks,
        jobConfig: {
          createTDOInput: jobConfig
        }
      }
      const variables = {
        input
      };
      return call(callCreateJob, { id, query, variables })
      // const { error, response } = yield call(handleRequest, { query, variables })
      // const { records } = get(response, 'data.createJob.tasks', []);
      // if (error) {
      //   yield put(actions.fetchCreateJobFailure(id))
      // }
      // yield put(actions.fetchCreateJobSuccess(id, records))
    })
    )
  })
}
function* callCreateJob({ id, query, variables }){
  const { error, response } = yield call(handleRequest, { query, variables })
  const { records } = get(response, 'data.createJob.tasks', []);
  if (error) {
    yield put(actions.fetchCreateJobFailure(id))
  }else {
    yield put(actions.fetchCreateJobSuccess(id, records))
  }
}
export default function* root() {
  yield all([
    fork(watchUploadRequest),
    fork(watchRetryRequest),
    fork(watchRetryDone),
    fork(watchAbortions),
    fork(watchFetchEngineCategories),
    fork(watchFetchLibraries),
    fork(watchFetchEngines),
    fork(watchSaveTemplate),
    fork(watchSaveTemplateSuccess),
    fork(watchFetchContentTemplates),
    fork(watchFetchCreateTdo),
    fork(watchFetchCreateJob)
  ]);
}
