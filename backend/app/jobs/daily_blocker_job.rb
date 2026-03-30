class DailyBlockerJob < ApplicationJob
  queue_as :default

  def perform(manager_email = nil)
    # Use ENV variable or default email if manager_email is not provided
    manager_email ||= ENV["MANAGER_EMAIL"] || "manager@exmaple.com"

    # Use the system's configured time zone
    date = Date.current
    start_time = date.beginning_of_day
    end_time   = date.end_of_day

    Rails.logger.info "DEBUG: DailyBlockerJob running at #{Time.zone.now}"
    Rails.logger.info "DEBUG: Searching between #{start_time} and #{end_time}"
    Rails.logger.info "DEBUG: Manager email: #{manager_email}"

    # Find all standups for today
    standups = Standup.includes(:user).where(standup_date: start_time..end_time)

    Rails.logger.info "DEBUG: Found #{standups.count} standups"

    # Filter standups with blockers and transform to the format expected by the mailer
    blockers_data = standups.select { |s| s.blockers.present? && ![ "", "nil", "-", "none", "None" ].include?(s.blockers) }
                            .sort_by { |s| s.user.first_name }
                            .map do |standup|
      {
        user_name: "#{standup.user.first_name} #{standup.user.last_name}",
        user_email: standup.user.email,
        blocker_text: standup.blockers,
        done: standup.done,
        doing: standup.doing,
        standup_date: standup.standup_date
      }
    end

    Rails.logger.info "DEBUG: Found #{blockers_data.size} blockers"

    # Send email with blocker data (even if empty)
    BlockerMailer.daily_blockers_summary(manager_email, blockers_data, date).deliver_now

    Rails.logger.info "DEBUG: Daily summary email sent to #{manager_email} with #{blockers_data.size} blockers"
  end
end
