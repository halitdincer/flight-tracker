# frozen_string_literal: true

module Types
  class DailyStatisticType < Types::BaseObject
    field :id, ID, null: false
    field :date, GraphQL::Types::ISO8601Date, null: false
    field :total_flights, Integer, null: false
    field :unique_aircraft, Integer, null: false
    field :flights_by_country, GraphQL::Types::JSON
    field :avg_altitude, Float
  end
end
