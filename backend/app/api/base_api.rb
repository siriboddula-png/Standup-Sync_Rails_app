class BaseApi < Grape::API
  format :json
  rescue_from Grape::Exceptions::ValidationErrors do |e|
    error!({ errors: e.as_json }, 422)
  end
  mount UsersApi
  mount V1::Base
end
