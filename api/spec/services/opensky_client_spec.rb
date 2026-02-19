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
             -122.4194, 37.7749, 10000.0, false, 250.5, 180.0, 5.0, nil, 10500.0, '1234', false, 0 ]
          ]
        }
      end

      before do
        stub_request(:get, 'https://opensky-network.org/api/states/all')
          .to_return(status: 200, body: mock_response.to_json, headers: { 'Content-Type' => 'application/json' })
      end

      it 'returns parsed flight states' do
        states = client.fetch_states
        expect(states).to be_an(Array)
        expect(states.first[:icao24]).to eq('abc123')
        expect(states.first[:callsign]).to eq('UAL123')
        expect(states.first[:latitude]).to eq(37.7749)
      end
    end

    context 'when API returns rate limit error' do
      before do
        stub_request(:get, 'https://opensky-network.org/api/states/all')
          .to_return(status: 429)
      end

      it 'raises RateLimitError' do
        expect { client.fetch_states }.to raise_error(OpenskyClient::RateLimitError)
      end
    end
  end
end
