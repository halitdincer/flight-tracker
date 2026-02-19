# frozen_string_literal: true

module Types
  class FlightType < Types::BaseObject
    field :id, ID, null: false
    field :icao24, String, null: false
    field :callsign, String
    field :origin_country, String
    field :first_seen_at, GraphQL::Types::ISO8601DateTime
    field :last_seen_at, GraphQL::Types::ISO8601DateTime
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false

    field :positions, [Types::FlightPositionType], null: false do
      argument :limit, Integer, required: false, default_value: 100
    end

    field :recent_position, Types::FlightPositionType

    def positions(limit:)
      object.flight_positions.order(recorded_at: :desc).limit(limit)
    end

    def recent_position
      object.flight_positions.order(recorded_at: :desc).first
    end
  end
end
