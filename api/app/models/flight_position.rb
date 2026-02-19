# frozen_string_literal: true

class FlightPosition < ApplicationRecord
  belongs_to :flight

  validates :latitude, presence: true, numericality: { greater_than_or_equal_to: -90, less_than_or_equal_to: 90 }
  validates :longitude, presence: true, numericality: { greater_than_or_equal_to: -180, less_than_or_equal_to: 180 }
  validates :recorded_at, presence: true

  scope :recent, -> { where('recorded_at > ?', 24.hours.ago) }
  scope :in_time_range, ->(start_time, end_time) { where(recorded_at: start_time..end_time) }

  # Create a position record from OpenSky state data
  def self.create_from_opensky(flight, state)
    return nil unless state[:latitude] && state[:longitude]

    create!(
      flight: flight,
      latitude: state[:latitude],
      longitude: state[:longitude],
      altitude: state[:baro_altitude] || state[:geo_altitude],
      velocity: state[:velocity],
      heading: state[:true_track],
      vertical_rate: state[:vertical_rate],
      on_ground: state[:on_ground] || false,
      recorded_at: Time.current
    )
  end
end
