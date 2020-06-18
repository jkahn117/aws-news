/**
 * AnalyticsEventProcessor
 * 
 * This function is triggered by a Kinesis Firehose stream sending events
 * from Pinpoint project.
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

async function incrementArticleReadCount(articleId, blogId) {
  try {
    let work = [ redis.zincrby(POPULAR_CONTENT_KEY, 1, articleId) ];
    
    if (blogId) {
      work.push(redis.zincrby(`${POPULAR_CONTENT_KEY}:${blogId}`, 1, articleId));
    }

    await Promise.all(work);
  } catch(error) {
    console.error(`[ERROR] ${error}`)
  }
};

/**
 * 
 * Main handler function.
 * 
 */
exports.handler = async(event) => {
  // console.log(JSON.stringify(event));

  const output = await Promise.all(
    event.records.map(async record => {
      let payload = Buffer.from(record.data, "base64").toString("ascii");
      const { event_type, attributes: { path, articleId, blogId }} = JSON.parse(payload);
      try {
        const { event_type, attributes: { path, articleId, blogId }} = JSON.parse(payload);
        if (event_type === "pageView" && path && path.startsWith("/article")) {
          await incrementArticleReadCount(articleId, blogId);
        }
      } catch (e) {
        console.error(`[ERROR] JSON Parsing -- ${articleId}`)
      }
  
      return {
        recordId: record.recordId,
        result: 'Ok',
        data: record.data
      };
    })
  );

  console.log(`Processing completed.  Successful records ${output.length}.`);
  return { records: output };  
}
