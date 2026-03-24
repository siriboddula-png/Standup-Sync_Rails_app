class DailyBlockerJob < ApplicationJob
  queue_as :default

  def perform
    # Use the system's configured time zone
    start_time = Time.zone.now.beginning_of_day
    end_time   = Time.zone.now.end_of_day

    standups = Standup.where(created_at: start_time..end_time)

    Rails.logger.info "DEBUG: StandupMailerWorker running at #{Time.zone.now}"
    Rails.logger.info "DEBUG: Searching between #{start_time} and #{end_time}"
    Rails.logger.info "DEBUG: Found #{standups.count} standups"

    if standups.any?
      # Ensure you use deliver_now here!
      StandupMailer.daily_summary(standups).deliver_now
      Rails.logger.info "DEBUG: Email sent!"
    else
      Rails.logger.info "DEBUG: No standups found, skipping email."
    end
  end
end
