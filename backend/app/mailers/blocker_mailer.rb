class BlockerMailer < ApplicationMailer
  default from: "noreply@standupsync.com"

  def daily_blockers_summary(manager_email, blockers_data, date)
    @blockers_data = blockers_data
    @date = date
    @total_blockers = blockers_data.size

    mail(
      to: manager_email,
      subject: "Daily Standup Summary - #{@total_blockers} Blockers on #{@date.strftime('%B %d, %Y')}"
    )
  end
end
