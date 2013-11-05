module Jekyll
  module LongerExcerpt
    def longer_excerpt(input)
      separator     = "<!-- more -->"
      head, _, tail = input["content"].partition(separator)

      "" << head << "\n\n" << tail.scan(/^\[[^\]]+\]:.+$/).join("\n")
    end
  end
end

Liquid::Template.register_filter(Jekyll::LongerExcerpt)
