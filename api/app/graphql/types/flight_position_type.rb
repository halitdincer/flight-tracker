# frozen_string_literal: true

module Types
  class FlightPositionType < Types::BaseObject
    field :id, ID, null: false
    field :flight_id, ID, null: false
    field :latitude, Float, null: false
    field :longitude, Float, null: false
    field :altitude, Float
    field :velocity, Float
    field :heading, Float
    field :vertical_rate, Float
    field :on_ground, Boolean, null: false
    field :recorded_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
