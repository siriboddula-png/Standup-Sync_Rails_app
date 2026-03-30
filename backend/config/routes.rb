Rails.application.routes.draw do
  mount GoodJob::Engine => "/good_job"

  mount BaseApi => "/api"
  devise_for :users, skip: [ :registrations ]
  authenticated :user do
    root to: "standups#index", as: :authenticated_root
  end
  devise_scope :user do
    root to: "devise/sessions#new"
  end
  resources :standups, path: "updates", only: [ :index, :create, :new, :edit, :update, :destroy ]
  get "profile", to: "standups#profile", as: :profile
end
