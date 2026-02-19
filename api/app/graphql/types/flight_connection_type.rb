# frozen_string_literal: true

module Types
  class FlightConnectionType < Types::BaseObject
    field :nodes, [ Types::FlightType ], null: false
    field :total_count, Integer, null: false
    field :has_next_page, Boolean, null: false
  end
end
