require 'rails_helper'

RSpec.describe Standup, type: :model do
  let(:user) {
    User.create!(
      email: "dev@example.com",
      password: "password",
      username: "dev_user",
      first_name: "Dev",
      last_name: "One"
    )
  }

  describe 'validations' do
    it "is valid with content longer than 15 characters and a current or previous date" do
      standup_today = Standup.new(
        user: user,
        name: "Dev",
        done: "I finished the authentication module today.",
        doing: "I am working on the rspec unit tests.",
        standup_date: Date.today
      )
      expect(standup_today).to be_valid

      standup_yesterday = Standup.new(
        user: user,
        name: "Dev",
        done: "I finished the authentication module today.",
        doing: "I am working on the rspec unit tests.",
        standup_date: Date.yesterday
      )
      expect(standup_yesterday).to be_valid
    end

    it "is invalid if the standup_date is in the future" do
      standup = Standup.new(standup_date: Date.tomorrow)
      standup.valid?
      expect(standup.errors[:standup_date]).to include("cannot be in the future. You can only log past or current progress.")
    end
  end
end
