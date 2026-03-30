Rails.application.configure do
  config.good_job.enable_cron = true

  config.good_job.cron = {
    daily_blocker_email: {
      cron: "51 21 * * *",
      class: "DailyBlockerJob",
      description: "Send daily blocker summary email to manager at 9:50 PM IST",
      set: { time_zone: "Asia/Kolkata" }
    }
  }

  config.good_job.preserve_job_records = true
  config.good_job.retry_on_unhandled_error = false
  config.good_job.on_thread_error = ->(exception) { Rails.logger.error(exception) }

  config.good_job.execution_mode = :async
  config.good_job.queues = "*"
  config.good_job.max_threads = 5

  config.good_job.poll_interval = 30
  config.good_job.shutdown_timeout = 25

  config.good_job.enable_listen_notify = true
end
