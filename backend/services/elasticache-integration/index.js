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
const POPULAR_CONTENT_KEY = process.env.POPULAR_CONTENT_KEY;
const BLOG_COUNT_KEY = process.env.BLOG_COUNT_KEY;

let redis = new Redis.Cluster([
  {
    host: process.env.ELASTICACHE_ENDPOINT,
    port: process.env.ELASTICACHE_PORT
  }
]);

/**
 * Retrieves listing of latest articles ids and sets nextToken.
 * @param {Int} start 
 * @param {Int} limit 
 */
async function getLatestArticles(start, limit) {
  try {
    const pipeline = redis.pipeline();
  
    // get listing of article ids from list in desired range
    const end = (start + limit) - 1;
    pipeline.lrange(LATEST_CONTENT_KEY, start, end);

    // get the total length of the list to determine if we need to paginate
    pipeline.llen(LATEST_CONTENT_KEY);

    const result = await pipeline.exec();
    const [ err1, articleIds ] = result[0];
    const [ err2, length ] = result[1];
    
    if (err1 || err2) {
      console.error(`[ERROR - lrange] ${err1}`);
      console.error(`[ERROR - llen] ${err2}`);
      return {
        error: "An error has occurred retrieving latest articles"
      }
    }

    const nextIndex = length > end ? end + 1 : null;

    return {
      ids: articleIds,
      nextToken: nextIndex ? _encodeNextToken("Article", nextIndex) : ""
    };
  } catch(error) {
    console.error(JSON.stringify(error));
    return { error: error.message };
  }
}

/**
 * Retrieves listing of popular article ids and set nextToken if more.
 * @param {Int} start 
 * @param {Int} limit 
 */
async function getPopularArticles(start, limit) {
  try {
    const pipeline = redis.pipeline();

    // get the leaderboard for articles in the desired range
    const end = start + limit - 1;
    pipeline.zrevrange(POPULAR_CONTENT_KEY, start, end);

    // get the total number of articles in the leaderboard
    pipeline.zcount(POPULAR_CONTENT_KEY, 0, "+inf");

    const result = await pipeline.exec();
    const [ err1, articleIds ] = result[0];
    const [ err2, length ] = result[1];
    
    if (err1 || err2) {
      console.error(`[ERROR - lrange] ${err1}`);
      console.error(`[ERROR - llen] ${err2}`);
      return {
        error: "An error has occurred retrieving latest articles"
      }
    }

    // going to max out at 50 popular articles, to avoid potentially being never ending
    const nextIndex = Math.min(length, 50) > end ? end + 1 : null;

    return {
      ids: articleIds,
      nextToken: nextIndex ? _encodeNextToken("Article", nextIndex) : ""
    };
  } catch(error) {
    console.error(JSON.stringify(error));
    return { error: error.message };
  }
}

/**
 * Decodes nextToken opaque token to retrieve next item index.
 * @param {String} nextToken 
 */
function _decodeNextToken(nextToken) {
  let str = Buffer.from(nextToken, "base64").toString("ascii");
  return parseInt(str.split(":")[1]);
}

/**
 * Encodes an opaque token for nextToken value.
 * @param {String} type 
 * @param {Int} nextIndex 
 */
function _encodeNextToken(type, nextIndex) {
  return Buffer.from(`${type}:${nextIndex}`).toString("base64");
}

/**
 * 
 * Main handler function.
 * 
 */
exports.handler = async(event) => {
  // console.log(JSON.stringify(event));
  const { action, args: { limit=10, nextToken }} = event;
  const start = nextToken !== "" ? _decodeNextToken(nextToken) : 0;

  switch(action) {
    case "latestArticles":
      return await getLatestArticles(start, limit);
    case "popularArticles":
      return await getPopularArticles(start, limit);
    default:
      throw("No such method");
  }
}
