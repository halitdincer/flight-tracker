# frozen_string_literal: true

class FlightDataFetcherJob < ApplicationJob
  queue_as :data_fetcher

  def perform
    client = OpenskyClient.new
    states = client.fetch_states

    Rails.logger.info "[FlightDataFetcher] Fetched #{states.size} flight states"

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

    Rails.logger.info "[FlightDataFetcher] Updated #{flights_updated} flights, created #{positions_created} positions"
  rescue OpenskyClient::ApiError => e
    Rails.logger.error "[FlightDataFetcher] API error: #{e.message}"
    raise # Re-raise to trigger Sidekiq retry
  end
end
