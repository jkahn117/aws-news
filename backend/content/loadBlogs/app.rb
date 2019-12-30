require 'digest'
require 'yaml'
require 'aws-sdk-dynamodb'

##
BLOGS_TABLE = ENV['BLOGS_TABLE']

## DyanmoDB client instance
$ddb_client = nil

### Main handler function
def handler(event:, context:)
  if ($ddb_client.nil?)
    $ddb_client = Aws::DynamoDB::Client.new
  end

  blogs = load_blog_list
  if blogs[:count] == 0
    blogs = load_blog_list_from_local
  end

  blogs
end

###
def load_blog_list
  resp = $ddb_client.scan({
    table_name: BLOGS_TABLE
  })

  p "Scanned BlogTables ... found #{resp.length} blogs"
  { items: resp.items, count: resp.count }
end

###
def load_blog_list_from_local
  input = YAML.load(File.read('blogs.yaml'))['blogs']

  blogs = []
  input.each do |blog|
    item = {
      '__typename': 'Blog',
      '_version': 1,
      '_lastChangedAt': Time.now.to_i,
      id: calculate_id_for(blog),
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

###
def calculate_id_for(blog)
  Digest::MD5.hexdigest(blog['url'])
end
