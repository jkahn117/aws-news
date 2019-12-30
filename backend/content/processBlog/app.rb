require 'feedjira'
require 'httparty'
require './article'

##
CONTENT_BUCKET = ENV['CONTENT_BUCKET']

## Set the table name for the Article model
## aws-record assume table name is same a model name, but not the case here.
Article.set_table_name ENV['ARTICLES_TABLE']

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

  data = HTTParty.get(event['blog']['url']).body
  entries = Feedjira.parse(data).entries
  entries.each do |entry|
    begin


    ### TODO: add check for existence before creating new entry
    ### check if the id already exists in the table


      Article.create_from(entry: entry, blog_id: blog_id, content_bucket: CONTENT_BUCKET)
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
