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

const LATEST_CONTENT_KEY = process.env.LATEST_CONTENT_KEY;
const BLOG_COUNT_KEY = process.env.BLOG_COUNT_KEY;

let redis = new Redis.Cluster([
  {
    host: process.env.ELASTICACHE_ENDPOINT,
    port: process.env.ELASTICACHE_PORT
  }
]);

async function getLatestArticles(start=0, count=10) {
  try {
    let end = start + count - 1;
    let result = await redis.lrange(LATEST_CONTENT_KEY, start, end);

    if (!result) { return [] }

    return result.map( (r) => {
      return { id: r };
    })
  } catch(error) {
    console.error(JSON.stringify(error));
    return { error: error.message };
  }
}

/**
 * 
 * Main handler function.
 * 
 */
exports.handler = async(event) => {
  console.log(JSON.stringify(event));

  switch(event.action) {
    case "latest":
      let { start, count } = { payload: { start, count }}
      console.log(start)
      console.log(count)
      return await getLatestArticles(start, count);
    default:
      throw("No such method");
  }
}
