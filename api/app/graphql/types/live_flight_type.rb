# frozen_string_literal: true

module Types
  class LiveFlightType < Types::BaseObject
    field :icao24, String, null: false
    field :callsign, String
    field :origin_country, String
    field :latitude, Float, null: false
    field :longitude, Float, null: false
    field :altitude, Float
    field :velocity, Float
    field :heading, Float
    field :vertical_rate, Float
    field :on_ground, Boolean, null: false
  end
end
