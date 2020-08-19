/**
 * ElastiCacheArticleIntegrationFunction
 * 
 * This function allows AWS AppSync to interoperate with Amazon
 * ElastiCache (Redis). It provides a set of actions that correspond
 * to data retrievals from ElastiCache, specific to Articles.
 */

const Redis = require("ioredis");
const AWSXRay = require('aws-xray-sdk');
AWSXRay.capturePromise();

const LATEST_CONTENT_KEY = process.env.LATEST_CONTENT_KEY;
const POPULAR_CONTENT_KEY = process.env.POPULAR_CONTENT_KEY;

let redis = null;

/**
 * Helper function to prepare response for list of article ids.
 * @param {*} result 
 */
function _returnArticleList(result, end) {
  const [ err1, articleIds ] = result[0];
  const [ err2, length ] = result[1];
  
  if (err1 || err2) {
    console.error(`[ERROR] ${err1}`);
    console.error(`[ERROR] ${err2}`);
    return {
      error: "An error has occurred retrieving articles"
    }
  }

  // going to max out at 50 articles, to avoid potentially being never ending
  const nextIndex = Math.min(length, 50) > end ? end + 1 : null;

  return {
    ids: articleIds,
    nextToken: nextIndex ? _encodeNextToken("Article", nextIndex) : ""
  };
}

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
    return _returnArticleList(result, end);
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
    return _returnArticleList(result, end);
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
  const segment = AWSXRay.getSegment();
  
  console.log(JSON.stringify(event));
  const { info: { fieldName: action, variables: { limit=10, nextToken }}} = event;
  const start = nextToken !== "" ? _decodeNextToken(nextToken) : 0;
  
  if (!redis) {
    const connectSegment = segment.addNewSubsegment("connect_to_redis");
    redis = new Redis.Cluster([
      {
        host: process.env.ELASTICACHE_ENDPOINT,
        port: process.env.ELASTICACHE_PORT
      }
    ]);
    connectSegment.close();
  }
  
  return AWSXRay.captureAsyncFunc("load_articles", (subsegment) => {
    subsegment.addAnnotation('Action', action);
    const result = action === "latestArticles" ? getLatestArticles(start, limit) : getPopularArticles(start, limit);
    subsegment.close();
    return result;
  })
}
