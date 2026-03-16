class DailyBlockerJob < ApplicationJob
  queue_as :default

  def perform(manager_email = nil)
    manager_email ||= ENV["MANAGER_EMAIL"] || "manager@exmaple.com"

    today = Date.current

    standups_with_blockers = Standup
      .includes(:user)
      .where(standup_date: today)
      .where.not(blockers: [ nil, "", "-", "none", "nil", "None", "NONE", "NIL" ])
      .order("users.first_name ASC")

    standups_with_real_blockers = standups_with_blockers.select do |standup|
      blocker = standup.blockers.to_s.strip.downcase
      ![ "", "-", "none", "nil" ].include?(blocker)
    end

    blockers_data = standups_with_real_blockers.map do |standup|
      {
        user_name: "#{standup.user.first_name} #{standup.user.last_name}",
        user_email: standup.user.email,
        blocker_text: standup.blockers,
        done: standup.done,
        doing: standup.doing,
        standup_date: standup.standup_date
      }
    end

    BlockerMailer.daily_blockers_summary(
      manager_email,
      blockers_data,
      today
    ).deliver_now

    Rails.logger.info "Daily summary email sent to #{manager_email} with #{blockers_data.size} blockers"
  end
end
