module Jekyll
  module RSSURLFilter
    def relative_urls_to_absolute(input)
      url = "http://exciting.io"
      input.gsub(/src="\/([^\/])/, 'src="' + url + '/\1').gsub(/href="\/([^\/])/, 'href="' + url + '/\1')
    end
  end
end

Liquid::Template.register_filter(Jekyll::RSSURLFilter)
