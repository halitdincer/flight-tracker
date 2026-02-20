# frozen_string_literal: true

class OpenskyClient
  BASE_URL = "https://opensky-network.org/api"
  OAUTH_TOKEN_URL = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token"

  class ApiError < StandardError; end
  class RateLimitError < ApiError; end
  class NotFoundError < ApiError; end

  def initialize(username: nil, password: nil, client_id: nil, client_secret: nil)
    @username = username || ENV["OPENSKY_USERNAME"]
    @password = password || ENV["OPENSKY_PASSWORD"]
    @client_id = client_id || ENV["OPENSKY_CLIENT_ID"]
    @client_secret = client_secret || ENV["OPENSKY_CLIENT_SECRET"]
  end

  # Fetch all flight states within an optional bounding box
  # @param lamin [Float] Lower latitude bound
  # @param lomin [Float] Lower longitude bound
  # @param lamax [Float] Upper latitude bound
  # @param lomax [Float] Upper longitude bound
  # @return [Array<Hash>] Array of flight state hashes
  def fetch_states(lamin: nil, lomin: nil, lamax: nil, lomax: nil)
    params = {}
    if lamin && lomin && lamax && lomax
      params[:lamin] = lamin
      params[:lomin] = lomin
      params[:lamax] = lamax
      params[:lomax] = lomax
    end

    response = if oauth_enabled?
      connection.get("states/all", params, { "Authorization" => "Bearer #{access_token}" })
    else
      connection.get("states/all", params)
    end

    handle_response(response)
  end

  private

  def connection
    @connection ||= Faraday.new(url: BASE_URL) do |faraday|
      faraday.request :retry, {
        max: 3,
        interval: 0.5,
        interval_randomness: 0.5,
        backoff_factor: 2,
        exceptions: [ Faraday::TimeoutError, Faraday::ConnectionFailed ]
      }
      faraday.request :authorization, :basic, @username, @password if basic_auth_enabled?
      faraday.response :json
      faraday.adapter Faraday.default_adapter
      faraday.options.timeout = 30
      faraday.options.open_timeout = 10
    end
  end

  def oauth_enabled?
    @client_id.to_s != "" && @client_secret.to_s != ""
  end

  def basic_auth_enabled?
    !oauth_enabled? && @username.to_s != "" && @password.to_s != ""
  end

  def access_token
    refresh_access_token! if @access_token.nil? || Time.now >= @access_token_expires_at
    @access_token
  end

  def refresh_access_token!
    response = token_connection.post do |request|
      request.body = {
        grant_type: "client_credentials",
        client_id: @client_id,
        client_secret: @client_secret
      }
    end

    unless response.status == 200
      raise ApiError, "OpenSky OAuth token request failed: #{response.status}"
    end

    token = response.body.is_a?(Hash) ? response.body["access_token"] : nil
    expires_in = response.body.is_a?(Hash) ? response.body["expires_in"].to_i : 0

    if token.to_s == ""
      raise ApiError, "OpenSky OAuth token request failed: missing access_token"
    end

    @access_token = token
    @access_token_expires_at = Time.now + [ expires_in - 30, 0 ].max
  rescue Faraday::Error => e
    raise ApiError, "OpenSky OAuth token request failed: #{e.message}"
  end

  def token_connection
    @token_connection ||= Faraday.new(url: OAUTH_TOKEN_URL) do |faraday|
      faraday.request :retry, {
        max: 3,
        interval: 0.5,
        interval_randomness: 0.5,
        backoff_factor: 2,
        exceptions: [ Faraday::TimeoutError, Faraday::ConnectionFailed ]
      }
      faraday.request :url_encoded
      faraday.response :json
      faraday.adapter Faraday.default_adapter
      faraday.options.timeout = 30
      faraday.options.open_timeout = 10
    end
  end

  def handle_response(response)
    case response.status
    when 200
      parse_states(response.body)
    when 429
      raise RateLimitError, "OpenSky API rate limit exceeded"
    when 404
      raise NotFoundError, "OpenSky API endpoint not found"
    else
      raise ApiError, "OpenSky API error: #{response.status}"
    end
  end

  # Parse OpenSky states array format into hashes
  # OpenSky returns states as arrays, we convert to named hashes
  def parse_states(body)
    return [] unless body && body["states"]

    body["states"].map do |state|
      {
        icao24: state[0],
        callsign: state[1]&.strip,
        origin_country: state[2],
        time_position: state[3],
        last_contact: state[4],
        longitude: state[5],
        latitude: state[6],
        baro_altitude: state[7],
        on_ground: state[8],
        velocity: state[9],
        true_track: state[10],
        vertical_rate: state[11],
        sensors: state[12],
        geo_altitude: state[13],
        squawk: state[14],
        spi: state[15],
        position_source: state[16]
      }
    end.compact
  end
end
