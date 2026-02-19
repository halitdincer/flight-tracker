# frozen_string_literal: true

class StatisticsAggregatorJob < ApplicationJob
  queue_as :statistics

  def perform(date = nil)
    target_date = date ? Date.parse(date.to_s) : Date.yesterday

    Rails.logger.info "[StatisticsAggregator] Generating statistics for #{target_date}"

    stat = DailyStatistic.generate_for_date(target_date)

    Rails.logger.info "[StatisticsAggregator] Generated stats: #{stat.total_flights} flights, #{stat.unique_aircraft} aircraft"
  end
end
