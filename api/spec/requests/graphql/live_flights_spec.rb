# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'LiveFlights query', type: :request do
  it 'falls back to cached positions when OpenSky is rate limited' do
    flight = Flight.create!(
      icao24: 'abc123',
      callsign: 'THY123',
      origin_country: 'Turkey',
      first_seen_at: 1.day.ago,
      last_seen_at: 10.minutes.ago
    )

    FlightPosition.create!(
      flight: flight,
      latitude: 40.98,
      longitude: 28.82,
      on_ground: false,
      recorded_at: 90.minutes.ago
    )

    FlightPosition.create!(
      flight: flight,
      latitude: 41.02,
      longitude: 29.01,
      on_ground: true,
      altitude: 1200,
      velocity: 230,
      heading: 45,
      vertical_rate: 0,
      recorded_at: 30.minutes.ago
    )

    stale_flight = Flight.create!(
      icao24: 'old999',
      callsign: 'OLD999',
      origin_country: 'Turkey',
      first_seen_at: 1.day.ago,
      last_seen_at: 1.day.ago
    )

    FlightPosition.create!(
      flight: stale_flight,
      latitude: 39.0,
      longitude: 27.0,
      on_ground: false,
      recorded_at: 3.hours.ago
    )

    client = instance_double(OpenskyClient)
    allow(client).to receive(:fetch_states).and_raise(OpenskyClient::RateLimitError, 'OpenSky API rate limit exceeded')
    allow(OpenskyClient).to receive(:new).and_return(client)

    post '/graphql', params: { query: <<~GRAPHQL }
      query {
        liveFlights {
          icao24
          callsign
          originCountry
          latitude
          longitude
          altitude
          velocity
          heading
          verticalRate
          onGround
        }
      }
    GRAPHQL

    expect(response).to have_http_status(:ok)

    body = JSON.parse(response.body)
    expect(body['errors']).to be_nil

    live_flights = body.dig('data', 'liveFlights')
    expect(live_flights.size).to eq(1)
    expect(live_flights.first).to include(
      'icao24' => 'abc123',
      'callsign' => 'THY123',
      'originCountry' => 'Turkey',
      'latitude' => 41.02,
      'longitude' => 29.01,
      'altitude' => 1200.0,
      'velocity' => 230.0,
      'heading' => 45.0,
      'verticalRate' => 0.0,
      'onGround' => true
    )
  end
end
