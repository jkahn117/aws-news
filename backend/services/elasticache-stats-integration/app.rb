#
# ElastiCacheStatisticsIntegrationFunction
# 
# This function allows AWS AppSync to interoperate with Amazon
# ElastiCache (Redis). It provides a set of actions that correspond
# to data retrievals from ElastiCache, specific to Statistics.
#

require 'redis'
require 'aws-xray-sdk/lambda'

@redis = nil

ARTICLE_COUNT_KEY = ENV['ARTICLE_COUNT_KEY']
BLOG_COUNT_KEY = ENV['BLOG_COUNT_KEY']

#
# Get Article statistics. Response:
#
# {
#   "total": "1",
#   "daily": {
#     "20200625": "1"
#   }
# }
#
def get_article_stats
  get_stats_for(ARTICLE_COUNT_KEY)
end

def get_blog_stats(blogId)
  get_stats_for("#{BLOG_COUNT_KEY}:#{blogId}")
end

#
# Main handler method.
#
def handler(event:, context:)
  unless @redis
    begin
      @redis = Redis.new(cluster: [ "redis://#{ENV['ELASTICACHE_ENDPOINT']}:#{ENV['ELASTICACHE_PORT']}" ])
    rescue Exception => e
      puts e.message
      puts e.backtrace.inspect
    end
  end
  
  case event['action']
  when 'getArticleStats'
    get_article_stats
  when 'getBlogStats'
    get_blog_stats(event['args']['blogId'])
  else
    raise "[ERROR] Unknown method - #{event['action']}, failing"
  end
end

private

def get_stats_for(key)
  total, days = @redis.pipelined do
    @redis.get "{#{key}}:total"
    @redis.zrevrange("{#{key}}:days", 0, 6)
  end
  
  daily_counts = @redis.pipelined do
    days.each { |d| @redis.get("{#{key}}:#{d}") }
  end
  
  {
    total: total || 0,
    daily: Hash[days.zip(daily_counts)]
  }
end
