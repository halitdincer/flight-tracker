# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Health Check', type: :request do
  describe 'GET /up' do
    it 'returns ok status' do
      get '/up'
      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body)['status']).to eq('ok')
    end
  end
end
