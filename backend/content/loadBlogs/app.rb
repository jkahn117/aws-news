require 'digest'
require 'yaml'
require 'json'
require 'aws-sdk-dynamodb'
require 'aws-sdk-eventbridge'

## Name of the DynamoDB Blogs table
BLOGS_TABLE = ENV['BLOGS_TABLE']
## Name of the EventBridge event bus for the application
EVENT_BUS = ENV['EVENT_BUS']

$function_arn = nil


## DyanmoDB client instance
$ddb_client = nil
## EventBridge client
$eventbridge_client = nil

#
# Main handler function
#
def handler(event:, context:)
  if $ddb_client.nil?
    $ddb_client = Aws::DynamoDB::Client.new
  end

  $function_arn = context.invoked_function_arn

  blogs = load_blog_list
  if blogs[:count] == 0
    blogs = load_blog_list_from_local
  end

  blogs
end

#
# Scan the Blogs table to find all configured blogs.
#
def load_blog_list
  resp = $ddb_client.scan({
    table_name: BLOGS_TABLE
  })

  p "Scanned BlogTables ... found #{resp.length} blogs"
  { items: resp.items, count: resp.count }
end

#
# Use the local YAML configuration to load a list of blogs to DyanmoDB table.
#
def load_blog_list_from_local
  input = YAML.load(File.read('blogs.yaml'))['blogs']

  blogs = []
  input.each do |blog|
    blog_id = calculate_id_for(blog)
    item = {
      '__typename': 'Blog',
      '_version': 1,
      '_lastChangedAt': Time.now.to_i,
      id: ,
      title: blog['title'],
      url: blog['url']
    }

    $ddb_client.put_item({
      table_name: BLOGS_TABLE,
      item: item
    })

    blogs.push(item)
  end

  p "Added #{blogs.length} blogs"
  { items: blogs, count: blogs.length }
end

#
# When a new blog is created, publish to EventBridge.
#
def publish_new_blog_event(id:, title:, url:)
  if $eventbridge_client.nil?
    $eventbridge_client = Aws::EventBridge::Client.new
  end

  event_detail = {
    "blogId": id,
    "title": title,
    "url": url
  }

  resp = $eventbridge_client.put_events({
    entries: [
      {
        time: Time.now,
        source: $function_arn,
        resources: [],
        detail_type: "blog_created",
        detail: JSON.generate(event_detail),
        event_bus_name: EVENT_BUS
      }
    ]
  })

  p resp
end

#
# Calculate the unique identifier for a blog based on its feed URL.
#
def calculate_id_for(blog)
  Digest::MD5.hexdigest(blog['url'])
end
