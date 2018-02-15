class JekyllFeed::Generator < Jekyll::Generator
  private

  def feed_source_path
    File.expand_path "../_layouts/feed.xml", File.dirname(__FILE__)
  end
end
