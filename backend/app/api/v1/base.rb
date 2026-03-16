module V1
  class Base < Grape::API
    version "v1", using: :path
    format :json

    mount V1::StandupsApi
  end
end
