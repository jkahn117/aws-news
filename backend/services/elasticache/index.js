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

async function getLatestArticles(start, limit) {
  try {
    const pipeline = redis.pipeline();

    // get listing of article ids from list in desired range
    const end = start + limit - 1;
    pipeline.lrange(LATEST_CONTENT_KEY, start, end);

    // get the total length of the list to determine if we need to paginate
    pipeline.llen(LATEST_CONTENT_KEY);

    const [ articleIds, length ] = await pipeline.exec();

    const nextId = length > end ? end + 1 : null;

    return {
      ids: articleIds,
      nextToken: nextId ? _encodeNextToken("Article", nextId) : ""
    };
  } catch(error) {
    console.error(JSON.stringify(error));
    return { error: error.message };
  }
}

function _decodeNextToken(nextToken) {
  let str = new Buffer(nextToken, "base64").toString("ascii");
  return str.split(":")[1];
}

function _encodeNextToken(type, nextIndex) {
  return new Buffer(`${type}:${nextIndex}`).toString("base64");
}

/**
 * 
 * Main handler function.
 * 
 */
exports.handler = async(event) => {
  console.log(JSON.stringify(event));

  const { action, args: { limit=10, nextToken }} = event;
  const start = nextToken !== "" ? _decodeNextToken(nextToken) : 0;

  switch(action) {
    case "latestArticles":
      return await getLatestArticles(start, limit);
    case "popularArticles":
      return [];
    default:
      throw("No such method");
  }
}
