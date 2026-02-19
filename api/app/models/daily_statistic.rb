# frozen_string_literal: true

class DailyStatistic < ApplicationRecord
  validates :date, presence: true, uniqueness: true

  scope :in_range, ->(start_date, end_date) { where(date: start_date..end_date) }

  # Generate statistics for a specific date
  def self.generate_for_date(date)
    start_time = date.beginning_of_day
    end_time = date.end_of_day

    positions = FlightPosition.where(recorded_at: start_time..end_time)
    flights = Flight.where(id: positions.select(:flight_id).distinct)

    country_counts = flights.group(:origin_country).count

    find_or_initialize_by(date: date).tap do |stat|
      stat.total_flights = positions.select(:flight_id).distinct.count
      stat.unique_aircraft = flights.select(:icao24).distinct.count
      stat.flights_by_country = country_counts
      stat.avg_altitude = positions.where.not(altitude: nil).average(:altitude)
      stat.save!
    end
  end
end
