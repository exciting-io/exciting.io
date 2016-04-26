module Jekyll
  class JekyllFeed < Jekyll::Generator
    private

    def source_path
      File.expand_path "../_layouts/feed.xml", File.dirname(__FILE__)
    end
  end
end
