require "sidekiq"
require "sidekiq-cron"

Sidekiq.configure_server do |config|
  config.redis = { url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0") }

  # Load the cron schedule after Sidekiq server starts
  config.on(:startup) do
    schedule_file = Rails.root.join("config", "schedule.yml")

    if File.exist?(schedule_file)
      schedule = YAML.load_file(schedule_file)

      if schedule
        Sidekiq::Cron::Job.load_from_hash(schedule)
        puts " Loaded Sidekiq-Cron schedule from #{schedule_file}"
        puts " Total jobs loaded: #{Sidekiq::Cron::Job.all.count}"

        # Log each job's details
        Sidekiq::Cron::Job.all.each do |job|
          puts ""
          puts "      Job Name: #{job.name}"
          puts "      Cron Expression: #{job.cron}"
          puts "      Job Class: #{job.class}"
          puts "      Enabled: #{job.enabled?}"
        end
        puts ""
      else
        puts " schedule.yml is empty"
      end
    else
      puts " schedule.yml not found at #{schedule_file}"
    end
  end
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0") }
end
