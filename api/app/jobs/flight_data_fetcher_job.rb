# frozen_string_literal: true

class FlightDataFetcherJob < ApplicationJob
  queue_as :data_fetcher

  def perform
    # Skip stale jobs — after restarts, Sidekiq replays the entire backlog
    # and burns through the OpenSky API quota in minutes
    job_enqueued = enqueued_at.is_a?(Time) ? enqueued_at : Time.parse(enqueued_at.to_s) rescue nil
    if job_enqueued && job_enqueued < 10.minutes.ago
      Rails.logger.info "[FlightDataFetcher] Skipping stale job (enqueued at #{enqueued_at})"
      return
    end

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
