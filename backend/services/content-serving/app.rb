#
# ContentServingFunction
#
# This 
#

require 'aws-sdk-dynamodb'
require 'aws-sdk-s3'
require 'json'
require 'redcarpet'

## DyanmoDB client instance
$ddb_client = nil
## S3 Client
$s3_client = nil

$renderer = nil

ARTICLES_TABLE = ENV['ARTICLES_TABLE']
CONTENT_BUCKET = ENV['CONTENT_BUCKET']


Article = Struct.new(:content_uri)

#
# Main handler function
#
def handler(event:, context:)
  if $s3_client.nil?
    $s3_client = Aws::S3::Client.new
  end

  article_id = event.dig('pathParameters', 'id')
  article = get_article_metadata(article_id)

  respond_with_content(uri: article.content_uri)
end


private

#
# Retrieves metadata on article from DynamoDB.
#
def get_article_metadata(article_id)
  if $ddb_client.nil?
    $ddb_client = Aws::DynamoDB::Client.new
  end

  resp = $ddb_client.get_item({
    key: { id: article_id },
    projection_expression: "contentUri",
    table_name: ARTICLES_TABLE
  })

  Article.new(resp.item['contentUri'])
end

#
#
#
def get_renderer
  Redcarpet::Render::HTML.new(
    filter_html: true,
    no_styles: true,
    safe_links_only: true
  )
end

#
# Retrieve object from S3, convert from Markdown to HTML, and return.
#
def respond_with_content(uri:)
  if $renderer.nil?
    $renderer = get_renderer
  end

  begin
    resp = $s3_client.get_object({
      bucket: CONTENT_BUCKET,
      key: "public/#{uri}"
    })

    {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': ENV['CACHE_COTNROL_VALUE']
      },
      body: Redcarpet::Markdown.new($renderer).render(resp.body.read)
    }
  rescue Aws::S3::Errors::NoSuchKey
    failure(message: 'Not found')
  end
end

#
# Return an error response. Status code defaults to 404 (Not Found).
#
def failure(message:, statusCode: 404)
  {
    isBase64Encoded: false,
    statusCode: statusCode,
    body: {
      error: message
    }.to_json
  }
end
