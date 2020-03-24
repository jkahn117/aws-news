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
    const pipeline = redis.pipeline();
    pipeline.zincrby(POPULAR_CONTENT_KEY, 1, articleId);
    
    if (blogId) {
      pipeline.zincrby(`${POPULAR_CONTENT_KEY}:${blogId}`, 1, articleId);
    }

    await pipeline.exec();
    
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

  const output = event.records.map((record) => {
    let payload = Buffer.from(record.data, "base64").toString("ascii");
    console.log(payload);

    const { event_type, attributes: { path, id, blogId }} = payload;
    if (event_type === "pageView" && path.startsWith("/article")) {
      incrementArticleReadCount(id, blogId);
    }

    return {
      recordId: record.recordId,
      result: 'Ok',
      data: record.data
    };
  });

  console.log(`Processing completed.  Successful records ${output.length}.`);
  return { records: output };  
}
