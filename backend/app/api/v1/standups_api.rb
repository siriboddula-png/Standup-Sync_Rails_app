module V1
  class StandupsApi < Grape::API
    helpers do
      def authenticate!
        error!({ error: "Unauthorized" }, 401) unless authenticated?
      end

      def authenticated?
        params[:authenticated_user_id].present? || params[:user_id].present?
      end

      def current_user_id
        params[:authenticated_user_id] || params[:user_id]
      end
    end

    resource :standups do
      desc "Get standups with optional search, filter, and sort"
      params do
        optional :search_name, type: String, desc: "Search by user name"
        optional :search_date, type: Date, desc: "Filter by specific date"
        optional :sort, type: String, values: %w[asc desc], default: "desc"
        optional :user_id, type: Integer, desc: "Filter for a specific user's profile (optional)"
        optional :authenticated_user_id, type: Integer, desc: "ID of authenticated user (required for auth)"
        optional :start_date, type: Date, desc: "Start date for date range filter"
        optional :end_date, type: Date, desc: "End date for date range filter"
        optional :q, type: String, desc: "Search query for standup content"
      end

      get do
        authenticate!

        standups_query = Standup.includes(:user)

        if params[:user_id]
          standups_query = standups_query.where(user_id: params[:user_id])
        end

        # Filter by date range if provided
        if params[:start_date] && params[:end_date]
          standups_query = standups_query.where(standup_date: params[:start_date]..params[:end_date])
        elsif params[:search_date]
          standups_query = standups_query.where(standup_date: params[:search_date])
        end

        # Search in content if query provided
        if params[:q]
          search_term = "%#{params[:q]}%"
          standups_query = standups_query.where(
            "done ILIKE ? OR doing ILIKE ? OR blockers ILIKE ?",
            search_term, search_term, search_term
          )
        end

        # Search by user name if provided
        if params[:search_name]
          standups_query = standups_query.joins(:user).where(
            "users.first_name ILIKE ? OR users.last_name ILIKE ? OR users.username ILIKE ? OR CONCAT(users.first_name, ' ', users.last_name) ILIKE ?",
            "%#{params[:search_name]}%", "%#{params[:search_name]}%", "%#{params[:search_name]}%", "%#{params[:search_name]}%"
          )
        end

        # Sort
        sort_order = params[:sort] == "asc" ? :asc : :desc
        standups = standups_query.order(standup_date: sort_order)

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
        params do
          optional :user_id, type: Integer, desc: "User ID for verification"
        end
        get do
          standup = Standup.includes(:user).find(params[:id])

          # Optional: Verify user_id if provided
          if params[:user_id] && standup.user_id != params[:user_id]
            error!({ error: "Standup not found or access denied" }, 404)
          end

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
        params do
          requires :user_id, type: Integer, desc: "User ID for verification (required)"
        end
        delete do
          standup = Standup.find(params[:id])

          # Verify ownership - user can only delete their own standups
          if standup.user_id != params[:user_id]
            error!({ error: "Standup not found or access denied" }, 403)
          end

          standup.destroy
          { status: "success", message: "Deleted successfully" }
        end

        desc "Update a standup"
        params do
          requires :user_id, type: Integer, desc: "User ID for verification (required)"
          optional :done, type: String
          optional :doing, type: String
          optional :blockers, type: String
        end
        put do
          standup = Standup.find(params[:id])

          # Verify ownership - user can only update their own standups
          if standup.user_id != params[:user_id]
            error!({ error: "Standup not found or access denied" }, 403)
          end

          # Only update fields that are provided
          update_params = declared(params, include_missing: false).except(:user_id)

          if standup.update(update_params)
            standup
          else
            error!({ errors: standup.errors.full_messages }, 422)
          end
        end
      end
    end
  end
end
