require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'validations' do
    subject {
      User.new(
        email: "test@example.com",
        password: "password123",
        username: "testuser",
        first_name: "Test",
        last_name: "User"
      )
    }

    # Test: Valid attributes
    it "is valid with valid attributes" do
      expect(subject).to be_valid
    end

    # Test: Unique Email Address
    it "is invalid without a unique email" do
      User.create!(email: "test@example.com", password: "password123", username: "user1", first_name: "A", last_name: "B")
      duplicate_user = User.new(email: "test@example.com", password: "password456", username: "user2", first_name: "C", last_name: "D")
      expect(duplicate_user).not_to be_valid
    end

    # Test: Minimum Password Length
    it "is invalid with a password shorter than 6 characters" do
      subject.password = "12345"
      expect(subject).not_to be_valid
      expect(subject.errors[:password]).to include("is too short (minimum is 6 characters)")
    end

    # Test: Required Profile Fields
    describe "required profile fields" do
      it "is invalid without a username" do
        subject.username = nil
        expect(subject).not_to be_valid
      end

      it "is invalid without a first_name" do
        subject.first_name = nil
        expect(subject).not_to be_valid
      end

      it "is invalid without a last_name" do
        subject.last_name = nil
        expect(subject).not_to be_valid
      end
    end
  end

  # Test: Gravatar Integration
  describe '#gravatar_url' do
    it "generates a link based on the md5 hash of the email" do
      email = "TEST@example.com"
      user = User.new(email: email)
      hash = Digest::MD5.hexdigest(email.downcase)
      expect(user.gravatar_url).to include("https://www.gravatar.com/avatar/#{hash}")
    end
  end

  # Test: Model Associations
  describe 'associations' do
    it "has many standups" do
      assc = described_class.reflect_on_association(:standups)
      expect(assc.macro).to eq :has_many
    end

    it "destroys dependent standups" do
      user = User.create!(email: "test@example.com", password: "password123", username: "testuser", first_name: "Test", last_name: "User")
      user.standups.create!(
        name: "Test",
        done: "Done content with 15 chars",
        doing: "Doing content with 15 chars",
        standup_date: Date.today
      )

      expect { user.destroy }.to change(Standup, :count).by(-1)
    end
  end
end
