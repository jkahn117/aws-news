/**
 * ProcessArticleImage
 * 
 * This function is triggered by EventBridge payloads matching rules:
 *   - detail-type == article_created
 * 
 * The function downloads, processes, and stores article image to improve
 * performance when serving.
 * 
 */

const DDB = require("aws-sdk/clients/dynamodb");
const fetch = require("node-fetch");
const S3 = require("aws-sdk/clients/s3");
const sharp = require("sharp");

const DESIRED_IMAGE_WIDTH = process.env.DESIRED_IMAGE_WIDTH;

let ddbclient = null;
let s3client = null;

/**
 * Resizes the image to the desired width, using SharpJS (cover mode to
 * fill dimensions). Also converts to JPEG format.
 * @param {*} buffer 
 * @param {*} width 
 */
async function processImage(buffer, width) {
  return await sharp(buffer)
                  .resize({ width })
                  // .webp()  // iOS does not support webp format until iOS 14
                  .jpeg()
                  .toBuffer();
}

/**
 * Stores the image in the S3 bucket.
 * @param {*} image 
 * @param {*} name 
 */
async function storeImage(image, name, metadata) {
  if (!s3client) { s3client = new S3(); }

  return s3client.putObject({
    Bucket: process.env.CONTENT_BUCKET,
    Key: name,
    Body: image,
    ContentType: 'image/jpeg',
    Metadata: metadata
  }).promise();
}

/**
 * Processes and then stores in the image.
 * @param {*} buffer 
 * @param {*} articleId 
 * @param {*} size 
 * @param {*} width 
 */
async function processAndStoreImage(buffer, baseName, desiredWidth=DESIRED_IMAGE_WIDTH, metadata={}) {
  const image = await processImage(buffer, desiredWidth);
  await storeImage(image, `${baseName}.jpg`, metadata);

  return Promise.resolve({ name: `${baseName}.jpg`, size: `${desiredWidth} px` });
}

/**
 * Updates the Article record in DynamoDB by modifying the image field.
 * @param {*} articleId 
 * @param {*} images 
 */
async function updateArticleRecord(articleId, image) {
  if (!ddbclient) { ddbclient = new DDB.DocumentClient(); }

  console.log(image)

  return ddbclient.update({
    TableName: process.env.ARTICLES_TABLE,
    Key: { id: articleId },
    UpdateExpression: "set #i = :img",
    ExpressionAttributeNames: { '#i': 'image' },
    ExpressionAttributeValues: { ':img': image.name }
  }).promise();
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
 *     "publishedAt": "2020-01-03T22:02:31+00:00",
 *     "image": "https://abc123.cloudfront.net/.../image.png"
 *   }
 * }
 */
exports.handler = async(event) => {
  // console.log(JSON.stringify(event));

  if (! (event.detail || event.detail.image)) {
    console.error('[ERROR] Missing image url - bad payload');
    return;
  }

  const publishedAt = new Date(event.detail.publishedAt);
  const baseName = `public/${publishedAt.getFullYear()}/${publishedAt.getMonth() + 1}/${event.detail.articleId}`;

  try {
    const response = await fetch(event.detail.image);
    const buffer = await response.buffer();

    const result = await processAndStoreImage(buffer,
                                              baseName,
                                              Number(DESIRED_IMAGE_WIDTH),
                                              {
                                                articleId: event.detail.articleId,
                                                origImageUrl: event.detail.image,
                                                imageWidth: DESIRED_IMAGE_WIDTH
                                              });

    await updateArticleRecord(event.detail.articleId, result);

    return {
      error: null,
      result: {
        articleId: event.detail.articleId,
        result
      }
    };
  } catch (error) {
    console.error(error);
    return {
      error: error,
      result: {}
    };
  }
}
