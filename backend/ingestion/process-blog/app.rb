require 'feedjira'
require 'httparty'
require 'json'
require 'aws-sdk-eventbridge'
require './article'

## Name of the S3 bucket in which article content is stored
CONTENT_BUCKET = ENV['CONTENT_BUCKET']
## Name of the EventBridge event bus for the application
EVENT_BUS = ENV['EVENT_BUS']

## Set the table name for the Article model
## aws-record assume table name is same a model name, but not the case here.
Article.set_table_name ENV['ARTICLES_TABLE']

## EventBridge client
$eventbridge_client = nil

$function_arn = nil

#
# Main handler function
#
# Expected input:
# {
#   "blog": {
#     "url": "https://aws.amazon.com/blogs/compute/feed/",
#     "title": "AWS Compute Blog",
#     "id": "0011ecb2680decfd1de620336d1a1485"
#   }
# }
#
def handler(event:, context:)
  blog_id = event['blog']['id']

  $function_arn = context.invoked_function_arn

  data = HTTParty.get(event['blog']['url']).body
  entries = Feedjira.parse(data).entries
  entries.each do |entry|
    begin
      unless Article.exists?(url: entry.url)
        p '-- New article found, creating from entry'

        article = Article.create_from(entry: entry, blog_id: blog_id, content_bucket: CONTENT_BUCKET)
        publish_new_article_event(article)
      end
    rescue Aws::Record::Errors::ConditionalWriteFailed => e
      p " -- Item already exists, ignoring"
    rescue StandardError => e
      p " -- ERROR #{e.message}"
      raise
    end
  end
  
  {
    'ImportAt': Time.now.utc.iso8601,
    'BlogId': event['blog']['id'],
    'Message': "Processed #{entries.length} entries"
  }
end

#
# When a new article is created, publish to EventBridge.
#
def publish_new_article_event(article)
  if $eventbridge_client.nil?
    $eventbridge_client = Aws::EventBridge::Client.new
  end
  
  event_detail = {
    "articleId": article.id,
    "title": article.title,
    "blogId": article.blogId,
    "publishedAt": article.publishedAt
  }

  event_detail["image"] = article.image if article.image

  resp = $eventbridge_client.put_events({
    entries: [
      {
        time: Time.now,
        source: $function_arn,
        resources: [],
        detail_type: "article_created",
        detail: JSON.generate(event_detail),
        event_bus_name: EVENT_BUS
      }
    ]
  })

  p resp
end