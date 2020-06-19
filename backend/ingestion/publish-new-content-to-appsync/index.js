/**
 * PublishNewContentToAppSync
 * 
 * This function is triggered by EventBridge payloads matching rules:
 *   - detail-type == blog_created
 *   - detail-type == article_created
 * 
 * The function will use data from the event to update a Blog or Article
 * record via AWS AppSync. Use Update mutation for both as we are really
 * just bumping the version number after initial creation by the out of
 * band process. This triggers a subscription event to be sent via WebSocket
 * to the Amplify DataStore client on the frontend.
 * 
 */

const axios = require('axios');
const aws4 = require('aws4');
const urlParse = require('url').URL;

const appSyncEndpoint = process.env.APPSYNC_ENDPOINT;
const appSyncHost = new urlParse(appSyncEndpoint).hostname.toString();

//
// Use UpdateBlog mutation here as the item already exists in the system,
// here we simply bump the version for Amplify DataStore to be alerted.
// Need to include all required attributes in the response payload, this
// seems to be a consideration of Amplify DataStore.
//
const updateBlogMutation = `
mutation UpdateBlog($input: UpdateBlogInput!) {
  updateBlog(input: $input) {
    id
    title
    url
    lastImportAt
    _lastChangedAt
    _version
    _deleted
  }
}
`;

//
// Update Article GraphQL payload. See comments above.
//
const updateArticleMutation = `
mutation UpdateArticle($input: UpdateArticleInput!) {
  updateArticle(input: $input) {
    id
    title
    published
    publishedAt
    url
    image
    excerpt
    author
    contentUri
    tags
    blog {
      id
    }
    _lastChangedAt
    _version
    _deleted
  }
}
`;

//
// Update a Blog record. Really just bumping the version.
//
async function updateBlog(blogId, title) {
  const input = {
    id: blogId,
    title
  };

  await _updateRecord(updateBlogMutation, "UpdateBlog", input);
}

//
// Update an Article record. Really just bumping the version.
//
async function updateArticle(articleId, blogId, title) {
  const input = {
    id: articleId,
    blogId,
    title
  };

  await _updateRecord(updateArticleMutation, "UpdateArticle", input);
}

//
// Build and send the actual GraphQL payload to AppSync endpoint,
// signing with SigV4.
//
async function _updateRecord(query, operationName, input) {
  let mutation = {
    query,
    operationName,
    variables: {
      input: {
        ...input,
        _version: 1
      }
    }
  };

  let request = aws4.sign({
    method: 'POST',
    url: appSyncEndpoint,
    host: appSyncHost,
    path: '/graphql',
    headers: {
      'Content-Type': 'application/json'
    },
    service: 'appsync',
    data: mutation,
    body: JSON.stringify(mutation)
  });
  delete request.headers['Host'];
  delete request.headers['Content-Length'];

  let result = await axios(request);
  console.log(JSON.stringify(result.data));
  if (result.errors && result.errors.length > 0) {
    console.error(`[createRecord] ${result.errors[0].message}`);
    throw new Error(`AppSync error - ${result.errors[0].errorType}: ${result.errors[0].message}`);
  }
}


/**
 * 
 * Main handler function.
 * 
 * Sample event for new article
 * {
 *   "version": "0",
 *   "id": "a4a137e6-4545-8740-3516-0e882cd075e7",
 *   "detail-type": "article_created",
 *   "source": "arn:aws:lambda:us-east-2:XXXXXXXXXXXX:function:ProcessBlogFunction",
 *   "account": "XXXXXXXXXXXX",
 *   "time": "2020-01-03T23:06:29Z",
 *   "region": "us-east-2",
 *   "resources": [],
 *   "detail": {
 *     "articleId": "9e7387e20fc36d72ccac725f4835ec16",
 *     "title": "Building an AWS IoT Core device using AWS Serverless and an ESP32",
 *     "blogId": "0011ecb2680decfd1de620336d1a1485",
 *     "publishedAt": "2020-01-03T22:02:31+00:00"
 *   }
 * }
 */

exports.handler = async(event) => {
  console.log(JSON.stringify(event));

  let { 'detail-type': detailType, detail: { blogId, articleId, title } } = event;
  
  switch(detailType) {
    case "blog_created":
      await updateBlog(blogId, title);
      break;
    case "article_created":
      await updateArticle(articleId, blogId, title);
      break;
    default:
      console.error('[ERROR] Unknown event type ', detailType)
  }

  return;
}
