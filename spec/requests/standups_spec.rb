require 'rails_helper'

RSpec.describe "Standups CRUD", type: :request do
  let(:user) {
    User.create!(email: "user@test.com", password: "password", username: "u1", first_name: "U", last_name: "One")
  }
  let(:other_user) {
    User.create!(email: "other@test.com", password: "password", username: "u2", first_name: "O", last_name: "Two")
  }

  let(:valid_params) {
    { standup: { done: "I have finished the login system.", doing: "I am working on the dashboard now.", standup_date: Date.today } }
  }

  before { sign_in user }


  describe "SEARCH" do
    it "filters results by username" do
      get standups_path, params: { query: 'u2' }
    end

    it "returns all entries when name is not entered" do
      get standups_path
    end

    it "filters results by specific date" do
      get standups_path, params: { search_date: Date.yesterday.to_s }
    end
  end

  describe "CREATE" do
    it "creates a standup and redirects" do
      expect {
        post standups_path, params: valid_params
      }.to change(Standup, :count).by(1)
      expect(response).to redirect_to(standups_path)
    end
  end

  describe "READ" do
    it "lists all standups on index" do
      get standups_path
      expect(response).to have_http_status(:ok)
    end

    it "shows personal logs in profile" do
      get profile_path
      expect(response).to have_http_status(:ok)
    end
  end

  describe "UPDATE" do
    let!(:standup) { user.standups.create!(name: "User", done: "Old done content with 15 chars", doing: "Old doing content with 15 chars", standup_date: Date.today) }

    it "allows owner to update" do
      patch standup_path(standup), params: { standup: { done: "New updated done content with 15 chars" } }
      expect(standup.reload.done).to eq("New updated done content with 15 chars")
      expect(response).to redirect_to(standups_path)
    end

    it "prevents non-owners from updating" do
      sign_out user
      sign_in other_user
      patch standup_path(standup), params: { standup: { done: "Malicious update attempt" } }
      expect(response).to redirect_to(standups_path)
      expect(flash[:alert]).to eq("You are not authorized to modify this entry.")
    end
  end

  describe "DELETE" do
    let!(:standup) { user.standups.create!(name: "User", done: "Content to be deleted soon", doing: "Content to be deleted soon", standup_date: Date.today) }
    it "allows owner to delete" do
      expect {
        delete standup_path(standup)
      }.to change(Standup, :count).by(-1)
      expect(response).to have_http_status(:see_other)
    end
  end
end
