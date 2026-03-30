require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module StandupSync
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.1

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w[assets tasks])

    # Grape API configuration - exclude from Zeitwerk autoloading
    config.autoload_paths << Rails.root.join("app", "api")
    config.eager_load_paths << Rails.root.join("app", "api")

    # Tell Zeitwerk to ignore the API directory
    Rails.autoloaders.main.ignore(Rails.root.join("app", "api"))

    # Configure ActiveJob to use GoodJob
    config.active_job.queue_adapter = :good_job

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    config.time_zone = "Asia/Kolkata"
    # config.eager_load_paths << Rails.root.join("extras")
  end
end
