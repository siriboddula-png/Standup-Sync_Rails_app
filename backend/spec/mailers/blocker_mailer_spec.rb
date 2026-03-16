require "rails_helper"

RSpec.describe BlockerMailer, type: :mailer do
  describe "#daily_blockers_summary" do
    let(:manager_email) { "manager@example.com" }
    let(:date) { Date.new(2026, 3, 14) }
    let(:user1) { User.create!(first_name: "John", last_name: "Doe", email: "john@example.com", username: "johndoe", password: "password123") }
    let(:user2) { User.create!(first_name: "Jane", last_name: "Smith", email: "jane@example.com", username: "janesmith", password: "password123") }
    
    let(:blockers_data) do
      [
        {
          user_name: "John Doe",
          user_email: "john@example.com",
          blocker_text: "Waiting for API credentials from vendor",
          done: "Completed user authentication",
          doing: "Working on payment integration",
          standup_date: date
        },
        {
          user_name: "Jane Smith",
          user_email: "jane@example.com",
          blocker_text: "Database migration failing in staging",
          done: "Fixed bug in search feature",
          doing: "Implementing email notifications",
          standup_date: date
        }
      ]
    end

    subject(:mail) { described_class.daily_blockers_summary(manager_email, blockers_data, date) }

    context "with blockers present" do
      it "renders the headers" do
        expect(mail.subject).to eq("Daily Standup Summary - 2 Blockers on March 14, 2026")
        expect(mail.to).to eq([manager_email])
        expect(mail.from).to eq(["noreply@standupsync.com"])
      end

      it "includes the correct number of blockers in subject" do
        expect(mail.subject).to include("2 Blockers")
      end

      it "includes the date in subject" do
        expect(mail.subject).to include("March 14, 2026")
      end

      it "renders the body with blocker information" do
        expect(mail.body.encoded).to include("John Doe")
        expect(mail.body.encoded).to include("Waiting for API credentials from vendor")
        expect(mail.body.encoded).to include("Jane Smith")
        expect(mail.body.encoded).to include("Database migration failing in staging")
      end

      it "includes user emails in the body" do
        expect(mail.body.encoded).to include("john@example.com")
        expect(mail.body.encoded).to include("jane@example.com")
      end

      it "includes done and doing information" do
        expect(mail.body.encoded).to include("Completed user authentication")
        expect(mail.body.encoded).to include("Working on payment integration")
      end

      it "has both HTML and text parts" do
        expect(mail.body.parts.map(&:content_type)).to include(/text\/html/, /text\/plain/)
      end
    end

    context "with no blockers" do
      let(:empty_blockers_data) { [] }
      subject(:mail) { described_class.daily_blockers_summary(manager_email, empty_blockers_data, date) }

      it "renders subject with 0 blockers" do
        expect(mail.subject).to eq("Daily Standup Summary - 0 Blockers on March 14, 2026")
      end

      it "includes no blockers message in body" do
        expect(mail.body.encoded).to include("No blockers")
      end
    end

    context "with single blocker" do
      let(:single_blocker_data) do
        [
          {
            user_name: "John Doe",
            user_email: "john@example.com",
            blocker_text: "Need code review",
            done: "Completed feature",
            doing: "Writing tests",
            standup_date: date
          }
        ]
      end
      subject(:mail) { described_class.daily_blockers_summary(manager_email, single_blocker_data, date) }

      it "uses singular form in subject" do
        expect(mail.subject).to include("1 Blockers")
      end

      it "includes the single blocker information" do
        expect(mail.body.encoded).to include("John Doe")
        expect(mail.body.encoded).to include("Need code review")
      end
    end
  end
end

