/**
 * ProcessArticleImage
 * 
 * This function is triggered by EventBridge payloads matching rules:
 *   - detail-type == article_created
 * 
 * The function downloads, processes, and stores article images to improve
 * performance when serving.
 * 
 */

const fetch = require("node-fetch");
const S3 = require("aws-sdk/clients/s3");
const sharp = require("sharp");

const DESIRED_WIDTHS = {
  'xl': 1024,
  'lg': 800,
  'md': 400
};

let s3client = null;

async function processImage(buffer, width) {
  return await sharp(buffer)
                        .resize({ width })
                        .webp()
                        .toBuffer();
}

async function storeImage(image, name) {
  if (!s3client) { s3client = new S3(); }

  return s3client.putObject({
    Bucket: process.env.CONTENT_BUCKET,
    Key: name,
    Body: image
  }).promise();
}

async function processAndStoreImage(buffer, articleId, size, width) {
  const image = await processImage(buffer, width);
  const name = `${articleId}-${size}.webp`;
  await storeImage(image, name);

  return Promise.resolve(name);
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
  const name = `public/${publishedAt.getFullYear()}/${publishedAt.getMonth() + 1}/${event.detail.articleId}`;

  try {
    const response = await fetch(event.detail.image);
    const buffer = await response.buffer();

    let work = Object.entries(DESIRED_WIDTHS).reduce((acc, [ key, value ]) => {
      acc.push(processAndStoreImage(buffer, name, key, value));
      return acc;
    }, []);

    const result = await Promise.all(work);
    return {
      error: null,
      result: {
        articleId: event.detail.articleId,
        count: result.length,
        images: result
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
