/**
 * PublishNewContentToElasticache
 * 
 * This function is triggered by EventBridge payloads matching rules:
 *   - detail-type == article_created
 * 
 * The function captures new article events published to EventBridge and
 * writes applicable data to Redis (ElastiCache), primarily for statitics
 * but also latest content.
 * 
 */

const Redis = require("ioredis");

const LATEST_CONTENT_KEY = process.env.LATEST_CONTENT_KEY;
const BLOG_COUNT_KEY = process.env.BLOG_COUNT_KEY;

let redis = new Redis.Cluster([
  {
    host: process.env.ELASTICACHE_ENDPOINT,
    port: process.env.ELASTICACHE_PORT
  }
]);

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

  let { detail: { blogId, articleId } } = event;

  try {
    // add blog to list of latest
    const pipeline = redis.pipeline();
    pipeline.lpush(LATEST_CONTENT_KEY, articleId);
    pipeline.ltrim(LATEST_CONTENT_KEY, 0, 99);  
    await pipeline.exec();

    // increment count of articles on this blog
    await pipeline.incr(BLOG_COUNT_KEY + blogId);
  } catch(error) {
    console.error(`[ERROR] ${error}`)
  }

  return;
}
