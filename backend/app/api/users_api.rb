class UsersApi < Grape::API
  resource :users do
    desc "Create a new user in the existing Postgres table"
    params do
      requires :first_name, type: String, desc: "User first name"
      requires :last_name, type: String, desc: "User last name"
      requires :username, type: String, desc: "Unique username"
      requires :email, type: String, desc: "User email"
      requires :password, type: String, desc: "User password"
      requires :password_confirmation, type: String, desc: "Password confirmation"
    end
    post do
      user = User.new(declared(params))

      if user.save
        { status: "success", user: { id: user.id, username: user.username, email: user.email } }
      else
        error!({ errors: user.errors.messages }, 422)
      end
    end

    desc "Logout"
    delete :sign_out do
      { status: "success", message: "Logged out successfully" }
    end

    desc "Login using Postgres credentials"
    params do
      requires :email, type: String
      requires :password, type: String
    end
    post :sign_in do
      user = User.find_by(email: params[:email])
      if user && user.valid_password?(params[:password])
      {
        status: "success",
        token: "session_token_#{user.id}",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          first_name: user.first_name
        }
      }
      else
        error!({ errors: { base: [ "Invalid email or password" ] } }, 401)
      end
    end

    desc "Send password reset instructions"
    params do
      requires :user, type: Hash do
        requires :email, type: String
      end
    end
    post :password do
      user = User.find_by(email: params[:user][:email])

      if user
        # This is a Devise method that sends the email
        user.send_reset_password_instructions
        { status: "success", message: "Instructions sent" }
      else
        # Following the UI's error handling for non-existent emails
        error!({ errors: [ "Email address not found" ] }, 404)
      end
    end
  end
end
