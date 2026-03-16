# Load Grape API files manually to avoid Zeitwerk conflicts
# This ensures all API classes are loaded before Rails tries to mount them

Rails.application.config.before_initialize do
  # Load API files in the correct order
  api_files = [
    "app/api/users_api.rb",
    "app/api/standups_api.rb",
    "app/api/v1/standups_api.rb",
    "app/api/v1/base.rb",
    "app/api/base_api.rb"
  ]

  api_files.each do |file|
    path = Rails.root.join(file)
    if File.exist?(path)
      # Use load in development to allow reloading, require in production
      if Rails.env.development?
        load path
      else
        require path
      end
    end
  end
end
