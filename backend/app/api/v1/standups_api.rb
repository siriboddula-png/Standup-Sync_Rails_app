module V1
  class StandupsApi < Grape::API
    resource :standups do
      desc "Get standups with optional search, filter, and sort"
      params do
        optional :search_name, type: String, desc: "Search by user name"
        optional :search_date, type: Date, desc: "Filter by specific date"
        optional :sort, type: String, values: %w[asc desc], default: "desc"
        optional :user_id, type: Integer, desc: "Filter for a specific user's profile"
      end

      get do
        standups = StandupSearchService.new(params).call
        standups.map do |standup|
          standup.as_json.merge(
            user: {
              id: standup.user.id,
              first_name: standup.user.first_name,
              last_name: standup.user.last_name,
              email: standup.user.email,
              gravatar_url: standup.user.gravatar_url
            }
          )
        end
      end

      desc "Create a new standup entry"
      params do
        requires :user_id, type: Integer
        requires :done, type: String
        requires :doing, type: String
        requires :blockers, type: String
        optional :standup_date, type: Date, default: -> { Date.today }
      end

      post do
        user = User.find(params[:user_id])
        standup = user.standups.build(declared(params).except(:user_id))
        standup.name = "#{user.first_name} #{user.last_name}"
        if standup.save
          { status: "success", standup: standup }
        else
          error!({ errors: standup.errors.full_messages }, 422)
        end
      end

      route_param :id do
        desc "Get a single standup by ID"
        get do
          standup = Standup.includes(:user).find(params[:id])
          standup.as_json.merge(
            user: {
              id: standup.user.id,
              first_name: standup.user.first_name,
              last_name: standup.user.last_name,
              email: standup.user.email,
              gravatar_url: standup.user.gravatar_url
            }
          )
        end

        desc "Delete a standup"
        delete do
          standup = Standup.find(params[:id])
          standup.destroy
          { status: "success", message: "Deleted successfully" }
        end

        desc "Update a standup"
        params do
          requires :done, type: String
          requires :doing, type: String
          requires :blockers, type: String
        end
        put do
          standup = Standup.find(params[:id])
          if standup.update(declared(params))
            standup
          else
            error!({ errors: standup.errors.full_messages }, 422)
          end
        end
      end
    end
  end
end
