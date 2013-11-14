require 'htmlentities'

module Jekyll
  module EntityEncoder
    def encode_entities(input)
      @coder ||= HTMLEntities.new
      @coder.encode(@coder.decode(input), :decimal)
    end
  end
end

Liquid::Template.register_filter(Jekyll::EntityEncoder)
