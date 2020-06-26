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
    XRay.recorder.capture('connect_to_redis') do |subsegment|
      begin
        @redis = Redis.new(cluster: [ "redis://#{ENV['ELASTICACHE_ENDPOINT']}:#{ENV['ELASTICACHE_PORT']}" ])
      rescue Exception => e
        puts e.message
        puts e.backtrace.inspect
      end
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
  XRay.recorder.begin_subsegment 'get_stats_from_redis'

  total, days = @redis.pipelined do
    @redis.get "{#{key}}:total"
    @redis.zrevrange("{#{key}}:days", 0, 6)
  end
  
  daily_new_post_count = @redis.pipelined do
    days.each { |d| @redis.get("{#{key}}:#{d}") }
  end

  XRay.recorder.end_subsegment

  daily_data = []
  days.each_with_index do |day, idx|
    daily_data << {
      date: Date.parse(day).strftime('%Y-%m-%d'),
      newPosts: daily_new_post_count[idx].to_i
    }
  end
  
  {
    total: total.to_i || 0,
    daily: daily_data
  }
end
