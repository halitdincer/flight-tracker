# frozen_string_literal: true

module Types
  class MutationType < Types::BaseObject
    field :refresh_flight_data, mutation: Mutations::RefreshFlightData
  end
end
