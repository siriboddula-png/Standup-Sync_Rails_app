class ApplicationController < ActionController::Base
  allow_browser versions: :modern
  before_action :authenticate_user!, unless: :devise_controller?
  before_action :configure_permitted_parameters, if: :devise_controller?

  private

  def after_sign_out_path_for(resource_or_scope)
    new_user_session_path
  end

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [ :username, :first_name, :last_name ])
    devise_parameter_sanitizer.permit(:account_update, keys: [ :username, :first_name, :last_name ])
  end

  def after_sign_in_path_for(resource)
    standups_path
  end
end
