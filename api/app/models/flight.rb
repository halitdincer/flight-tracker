# frozen_string_literal: true

class Flight < ApplicationRecord
  has_many :flight_positions, dependent: :destroy

  validates :icao24, presence: true, uniqueness: true

  scope :active, -> { where('last_seen_at > ?', 1.hour.ago) }
  scope :by_country, ->(country) { where(origin_country: country) }
  scope :search_callsign, ->(term) { where('callsign LIKE ?', "%#{term}%") }

  # Update or create a flight from OpenSky state data
  def self.upsert_from_opensky(state)
    flight = find_or_initialize_by(icao24: state[:icao24])
    
    flight.callsign = state[:callsign] if state[:callsign].present?
    flight.origin_country = state[:origin_country]
    flight.first_seen_at ||= Time.current
    flight.last_seen_at = Time.current
    
    flight.save!
    flight
  end
end
