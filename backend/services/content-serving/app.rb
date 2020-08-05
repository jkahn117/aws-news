#
# ContentServingFunction
#
# This 
#

require 'aws-sdk-dynamodb'
require 'aws-sdk-s3'
require 'base64'
require 'json'
require 'kramdown'

## DyanmoDB client instance
$ddb_client = nil
## S3 Client
$s3_client = nil

ARTICLES_TABLE = ENV['ARTICLES_TABLE']
CONTENT_BUCKET = ENV['CONTENT_BUCKET']


Article = Struct.new(:content_uri, :image)

#
# Main handler function
#
def handler(event:, context:)
  if $s3_client.nil?
    $s3_client = Aws::S3::Client.new
  end

  article_id = event.dig('pathParameters', 'id')
  size = event.dig('queryStringParameters', 'size')

  article = get_article_metadata(article_id, size)

  case event['rawPath']
    when /^\/\w+\/content/
      respond_with_content(uri: article.content_uri)
    when /^\/\w+\/image/
      respond_with_image(uri: article.image)
    else
      failure(message: "Unknown action: #{path}")
  end
end


private

#
# Retrieves metadata on article from DynamoDB.
#
def get_article_metadata(article_id, size)
  if $ddb_client.nil?
    $ddb_client = Aws::DynamoDB::Client.new
  end

  size ||= 'md'  # for cases in which size is not assigned

  resp = $ddb_client.get_item({
    key: { id: article_id },
    projection_expression: "contentUri, sizedImage.#{size}",
    table_name: ARTICLES_TABLE
  })

  Article.new(resp.item['contentUri'], resp.item['sizedImage']["#{size}"])
end

#
# Retrieve object from S3, convert from Markdown to HTML, and return.
#
def respond_with_content(uri:)
  begin
    resp = $s3_client.get_object({
      bucket: CONTENT_BUCKET,
      key: "public/#{uri}"
    })

    {
      isBase64Encoded: false,
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html'
      },
      body: Kramdown::Document.new(resp.body.read).to_html
    }
  rescue Aws::S3::Errors::NoSuchKey
    failure(message: 'Not found')
  end
end


#
# Retrieve object from S3 and return as base 64 encoded.
#
def respond_with_image(uri:)
  begin
    resp = $s3_client.get_object({
      bucket: CONTENT_BUCKET,
      key: uri
    })

    # we expect webp to be the content-type
    content_type = resp.content_type || 'image/webp'

    {
      isBase64Encoded: true,
      statusCode: 200,
      headers: {
        'Content-Type': content_type
      },
      body: Base64.encode64(resp.body.read)
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
