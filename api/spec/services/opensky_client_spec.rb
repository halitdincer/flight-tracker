# frozen_string_literal: true

require 'rails_helper'

RSpec.describe OpenskyClient do
  subject(:client) { described_class.new }

  describe '#fetch_states' do
    context 'when API returns successfully' do
      let(:mock_response) do
        {
          'time' => 1609459200,
          'states' => [
            [ 'abc123', 'UAL123  ', 'United States', 1609459200, 1609459200,
             -122.4194, 37.7749, 10000.0, false, 250.5, 180.0, 5.0, nil, 10500.0, '1234', false, 0, 1 ]
          ]
        }
      end

      before do
        stub_request(:get, 'https://opensky-network.org/api/states/all')
          .with(query: hash_including('extended' => '1'))
          .to_return(status: 200, body: mock_response.to_json, headers: { 'Content-Type' => 'application/json' })
      end

      it 'returns parsed flight states' do
        states = client.fetch_states
        expect(states).to be_an(Array)
        expect(states.first[:icao24]).to eq('abc123')
        expect(states.first[:callsign]).to eq('UAL123')
        expect(states.first[:latitude]).to eq(37.7749)
        expect(states.first[:category]).to eq(1)
      end
    end

    context 'when API returns rate limit error' do
      before do
        stub_request(:get, 'https://opensky-network.org/api/states/all')
          .with(query: hash_including('extended' => '1'))
          .to_return(status: 429)
      end

      it 'raises RateLimitError' do
        expect { client.fetch_states }.to raise_error(OpenskyClient::RateLimitError)
      end
    end

    context 'when OAuth client credentials are configured' do
      subject(:client) { described_class.new(client_id: 'oauth-client', client_secret: 'oauth-secret') }

      let(:mock_response) do
        {
          'time' => 1609459200,
          'states' => [
            [ 'abc123', 'UAL123  ', 'United States', 1609459200, 1609459200,
             -122.4194, 37.7749, 10000.0, false, 250.5, 180.0, 5.0, nil, 10500.0, '1234', false, 0, 1 ]
          ]
        }
      end

      it 'fetches token and uses bearer authorization for states request' do
        stub_request(:post, 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token')
          .with(body: {
            grant_type: 'client_credentials',
            client_id: 'oauth-client',
            client_secret: 'oauth-secret'
          })
          .to_return(status: 200, body: { access_token: 'token-1', expires_in: 3600 }.to_json,
            headers: { 'Content-Type' => 'application/json' })

        stub_request(:get, 'https://opensky-network.org/api/states/all')
          .with(query: hash_including('extended' => '1'), headers: { 'Authorization' => 'Bearer token-1' })
          .to_return(status: 200, body: mock_response.to_json, headers: { 'Content-Type' => 'application/json' })

        states = client.fetch_states

        expect(states.first[:icao24]).to eq('abc123')
        expect(a_request(:post,
          'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token')).to have_been_made.once
      end

      it 'refreshes token when cached token is expired' do
        stub_request(:post, 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token')
          .to_return(
            { status: 200, body: { access_token: 'token-1', expires_in: 1 }.to_json,
              headers: { 'Content-Type' => 'application/json' } },
            { status: 200, body: { access_token: 'token-2', expires_in: 3600 }.to_json,
              headers: { 'Content-Type' => 'application/json' } }
          )

        stub_request(:get, 'https://opensky-network.org/api/states/all')
          .with(query: hash_including('extended' => '1'), headers: { 'Authorization' => 'Bearer token-1' })
          .to_return(status: 200, body: mock_response.to_json, headers: { 'Content-Type' => 'application/json' })

        stub_request(:get, 'https://opensky-network.org/api/states/all')
          .with(query: hash_including('extended' => '1'), headers: { 'Authorization' => 'Bearer token-2' })
          .to_return(status: 200, body: mock_response.to_json, headers: { 'Content-Type' => 'application/json' })

        client.fetch_states
        client.fetch_states

        expect(a_request(:post,
          'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token')).to have_been_made.twice
      end
    end
  end
end
