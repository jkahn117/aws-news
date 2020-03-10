/**
 * LatestContentFunction
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

const POPULAR_CONTENT_KEY = process.env.POPULAR_CONTENT_KEY;

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
 */
exports.handler = async(event) => {
  console.log(JSON.stringify(event));

  event.Records.forEach((record) => {
    let payload = Buffer.from(record.kinesis.data, "base64").toString("ascii");
    console.log(payload);
  });
}
