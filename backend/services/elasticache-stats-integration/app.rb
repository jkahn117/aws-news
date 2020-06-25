# async function getArticleMetrics() {
#   const pipeline = redis.pipeline();
#   // get total
#   pipeline.get(`${ARTICLE_COUNT_KEY}:total`);
#   // get days on which we have new articles
#   pipeline.zrevrange(`${ARTICLE_COUNT_KEY}:days`, 0, 6);
#   const result = await pipeline.exec();

#   const [ err1, totalCount ] = result[0];
#   const [ err2, days ] = result[1];

#   if (err1 || err2) {
#     console.error(`[ERROR] ${err1}`);
#     console.error(`[ERROR] ${err2}`);
#     return {
#       error: "An error has occurred retrieving articles"
#     }
#   }

#   for (let date of days) {
#     pipeline.get(`${ARTICLE_COUNT_KEY}:${date}`);
#   }

#   let dailyCounts = await pipeline.exec();

#   return {
#     total: totalCount,
#     dailyCounts: days.reduce((n, d, i) => { n[d] = dailyCounts[i]; return n }, {})
#   }
# }

require 'redis'
require 'aws-xray-sdk/lambda'

redis = Redis.new(cluster: [ "redis://#{ENV['ELASTICACHE_ENDPOINT']}:#{ELASTICACHE_PORT}" ])

ARTICLE_COUNT_KEY = ENV['ARTICLE_COUNT_KEY']
BLOG_COUNT_KEY = ENV['ARTICLE_COUNT_KEY']

def get_article_stats
  total = redis.get "#{ARTICLE_COUNT_KEY}:total"

  {
    total: total
  }
end

def handler(event:, context:)
  get_article_stats
end