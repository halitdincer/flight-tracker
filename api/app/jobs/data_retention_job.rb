# frozen_string_literal: true

class DataRetentionJob < ApplicationJob
  queue_as :default

  POSITION_RETENTION_DAYS = 30

  def perform
    cutoff_date = POSITION_RETENTION_DAYS.days.ago

    Rails.logger.info "[DataRetention] Cleaning positions older than #{cutoff_date}"

    deleted_count = FlightPosition.where('recorded_at < ?', cutoff_date).delete_all

    Rails.logger.info "[DataRetention] Deleted #{deleted_count} old position records"
  end
end
