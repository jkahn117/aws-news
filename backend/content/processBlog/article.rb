#
#
#
require 'aws-record'
require 'aws-sdk-s3'
require 'digest'
require 'httparty'
require 'nokogiri'
require 'upmark'

# S3 client
$s3_client = Aws::S3::Client.new

class Article
  include Aws::Record

  # attributes
  string_attr   :__typename, default_value: 'Article'
  integer_attr  :_version, default_value: 1  # Amplify DataStore
  integer_attr  :_lastChangedAt, default_value: Time.now.to_i  # Amplify DataStore
  string_attr   :id, hash_key: true
  string_attr   :blogId
  string_attr   :title
  string_attr   :url
  boolean_attr  :published, default_value: false
  datetime_attr :publishedAt, default_value: Time.now
  string_attr   :author
  string_attr   :contentUri
  string_attr   :image
  string_attr   :excerpt
  list_attr     :tags

  class << self
    def create_from(entry:, blog_id:, content_bucket:)
      article = Article.new(
        blogId: blog_id,
        url: entry.url,
        title: entry.title,
        author: entry.author,
        publishedAt: entry.published,
        excerpt: entry.summary || '',
        tags: entry.categories
      )

      begin
        Article.write_content_to_s3(content_bucket, article.get_content_key, entry.content)
        article.image = Article.get_main_image(article.url)
      rescue Aws::S3::Errors::ServiceError => e
        p " -- FAILED TO STORE CONTENT: #{e.message}"
        raise
      rescue StandardError => e
        p " -- FAILED TO CREATE NEW ARTICLE: #{e.message}"
        raise
      end

      article.contentUri = "s3://#{content_bucket}/#{article.get_content_key}.md"
      article.published = true
      article.save!

      article
    end

    protected
    # Converts content to Markdown and writes to S3.
    def write_content_to_s3(bucket, key, content)
      $s3_client.put_object({
        body: Upmark.convert(content),
        bucket: bucket,
        key: "#{key}.md"
      })
    end

    def get_main_image(url)
      page = HTTParty.get(url)
      doc = Nokogiri::HTML(page)

      image_path = doc.xpath('/html/head/meta[@property="og:image"]/@content')
      if image_path.length > 0 && !image_path.first.value.empty?
        return image_path.first.value
      end

      nil
    end
  end

  def initialize(attr_values = {})
    super

    if (self.id.nil? && !self.url.nil?)
      self.id = Digest::MD5.hexdigest(self.url)
    end

    self
  end

  def get_content_key
    "#{self.publishedAt.year}/#{self.publishedAt.month}/#{self.id}"
  end
end