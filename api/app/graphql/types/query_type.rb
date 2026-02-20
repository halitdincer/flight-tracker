# frozen_string_literal: true

module Types
  class QueryType < Types::BaseObject
    field :node, Types::NodeType, null: true, description: "Fetches an object given its ID." do
      argument :id, ID, required: true, description: "ID of the object."
    end

    def node(id:)
      context.schema.object_from_id(id, context)
    end

    field :nodes, [ Types::NodeType, null: true ], null: true, description: "Fetches a list of objects given a list of IDs." do
      argument :ids, [ ID ], required: true, description: "IDs of the objects."
    end

    def nodes(ids:)
      ids.map { |id| context.schema.object_from_id(id, context) }
    end

    # Flights query with filtering and pagination
    field :flights, Types::FlightConnectionType, null: false do
      argument :callsign, String, required: false
      argument :country, String, required: false
      argument :bounding_box, Types::BoundingBoxInputType, required: false
      argument :limit, Integer, required: false, default_value: 50
      argument :offset, Integer, required: false, default_value: 0
    end

    def flights(callsign: nil, country: nil, bounding_box: nil, limit:, offset:)
      scope = Flight.includes(:flight_positions).order(last_seen_at: :desc)
      scope = scope.search_callsign(callsign) if callsign.present?
      scope = scope.by_country(country) if country.present?

      # Filter by bounding box using latest position
      if bounding_box
        flight_ids = FlightPosition
          .select("DISTINCT ON (flight_id) flight_id")
          .where(latitude: bounding_box[:lamin]..bounding_box[:lamax])
          .where(longitude: bounding_box[:lomin]..bounding_box[:lomax])
          .order(:flight_id, recorded_at: :desc)
          .pluck(:flight_id)
        scope = scope.where(id: flight_ids)
      end

      total = scope.count
      nodes = scope.limit(limit).offset(offset)

      {
        nodes: nodes,
        total_count: total,
        has_next_page: offset + limit < total
      }
    end

    # Single flight by icao24
    field :flight, Types::FlightType, null: true do
      argument :icao24, String, required: true
    end

    def flight(icao24:)
      Flight.find_by(icao24: icao24)
    end

    # Flight position history
    field :flight_history, [ Types::FlightPositionType ], null: false do
      argument :icao24, String, required: true
      argument :start_time, GraphQL::Types::ISO8601DateTime, required: false
      argument :end_time, GraphQL::Types::ISO8601DateTime, required: false
    end

    def flight_history(icao24:, start_time: nil, end_time: nil)
      flight = Flight.find_by(icao24: icao24)
      return [] unless flight

      scope = flight.flight_positions.order(recorded_at: :asc)
      scope = scope.where("recorded_at >= ?", start_time) if start_time
      scope = scope.where("recorded_at <= ?", end_time) if end_time
      scope
    end

    # Daily statistics
    field :statistics, [ Types::DailyStatisticType ], null: false do
      argument :start_date, GraphQL::Types::ISO8601Date, required: true
      argument :end_date, GraphQL::Types::ISO8601Date, required: true
    end

    def statistics(start_date:, end_date:)
      DailyStatistic.in_range(start_date, end_date).order(date: :asc)
    end

    # Live flights from OpenSky API (proxied)
    field :live_flights, [ Types::LiveFlightType ], null: false do
      argument :bounding_box, Types::BoundingBoxInputType, required: false
    end

    def live_flights(bounding_box: nil)
      client = OpenskyClient.new
      params = bounding_box ? bounding_box.to_h : {}

      states = client.fetch_states(**params)

      states.filter_map do |state|
        next unless state[:latitude] && state[:longitude]

        {
          icao24: state[:icao24],
          callsign: state[:callsign],
          origin_country: state[:origin_country],
          latitude: state[:latitude],
          longitude: state[:longitude],
          altitude: state[:baro_altitude] || state[:geo_altitude],
          velocity: state[:velocity],
          heading: state[:true_track],
          vertical_rate: state[:vertical_rate],
          on_ground: state[:on_ground] || false
        }
      end
    rescue OpenskyClient::RateLimitError
      cached_flights = cached_live_flights(bounding_box: bounding_box)
      return cached_flights if cached_flights.any?

      raise GraphQL::ExecutionError,
        "OpenSky API rate limit exceeded and no cached flights are available right now."
    rescue OpenskyClient::ApiError => api_error
      begin
        cached_flights = cached_live_flights(bounding_box: bounding_box)
        return cached_flights if cached_flights.any?

        raise GraphQL::ExecutionError,
          "#{api_error.message}; no cached flights are available right now."
      rescue GraphQL::ExecutionError
        raise
      rescue StandardError => fallback_error
        raise GraphQL::ExecutionError, "#{api_error.message}; cached fallback failed: #{fallback_error.message}"
      end
    end

    private

    def cached_live_flights(bounding_box: nil)
      window_start = 2.hours.ago
      latest_positions = FlightPosition
        .where("recorded_at >= ?", window_start)
        .select("flight_id, MAX(recorded_at) AS max_recorded_at")
        .group(:flight_id)

      scope = FlightPosition
        .joins(:flight)
        .joins(
          "INNER JOIN (#{latest_positions.to_sql}) latest_positions " \
          "ON latest_positions.flight_id = flight_positions.flight_id " \
          "AND latest_positions.max_recorded_at = flight_positions.recorded_at"
        )

      if bounding_box
        scope = scope.where(latitude: bounding_box[:lamin]..bounding_box[:lamax])
          .where(longitude: bounding_box[:lomin]..bounding_box[:lomax])
      end

      scope.includes(:flight).map do |position|
        {
          icao24: position.flight.icao24,
          callsign: position.flight.callsign,
          origin_country: position.flight.origin_country,
          latitude: position.latitude,
          longitude: position.longitude,
          altitude: position.altitude,
          velocity: position.velocity,
          heading: position.heading,
          vertical_rate: position.vertical_rate,
          on_ground: position.on_ground || false
        }
      end
    end
  end
end
