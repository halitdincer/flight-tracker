# frozen_string_literal: true

class OpenskyClient
  BASE_URL = "https://opensky-network.org/api"

  class ApiError < StandardError; end
  class RateLimitError < ApiError; end
  class NotFoundError < ApiError; end

  def initialize(username: nil, password: nil)
    @username = username || ENV["OPENSKY_USERNAME"]
    @password = password || ENV["OPENSKY_PASSWORD"]
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

    response = connection.get("states/all", params)
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
      faraday.request :authorization, :basic, @username, @password if @username && @password
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
