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

async function countArticleRead(record) {
  let { event_type, attributes: { articleId } } = record;

  try {
    if (event_type === 'pageView') {
      const pipeline = redis.pipeline();
      pipeline.lpush(POPULAR_CONTENT_KEY, articleId);
      pipeline.ltrim(POPULAR_CONTENT_KEY, 0, 99);  
      await pipeline.exec();
    }

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
  console.log(JSON.stringify(event));

  const output = event.records.map((record) => {
    let payload = Buffer.from(record.kinesis.data, "base64").toString("ascii");
    console.log(payload);
    // write to elasticache

    return {
      recordId: record.recordId,
      result: 'Ok',
      data: record.data
    };
  });

  console.log(`Processing completed.  Successful records ${output.length}.`);
  return { records: output };  
}
