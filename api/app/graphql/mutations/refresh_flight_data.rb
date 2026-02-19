# frozen_string_literal: true

module Mutations
  class RefreshFlightData < BaseMutation
    field :success, Boolean, null: false
    field :flights_updated, Integer, null: false
    field :positions_created, Integer, null: false
    field :errors, [ String ], null: false

    def resolve
      client = OpenskyClient.new
      states = client.fetch_states

      flights_updated = 0
      positions_created = 0

      ActiveRecord::Base.transaction do
        states.each do |state|
          next unless state[:latitude] && state[:longitude]

          flight = Flight.upsert_from_opensky(state)
          flights_updated += 1

          FlightPosition.create_from_opensky(flight, state)
          positions_created += 1
        end
      end

      {
        success: true,
        flights_updated: flights_updated,
        positions_created: positions_created,
        errors: []
      }
    rescue OpenskyClient::ApiError => e
      {
        success: false,
        flights_updated: 0,
        positions_created: 0,
        errors: [ e.message ]
      }
    end
  end
end
