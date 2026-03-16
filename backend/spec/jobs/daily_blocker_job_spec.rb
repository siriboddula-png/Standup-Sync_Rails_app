require "rails_helper"

RSpec.describe DailyBlockerJob, type: :job do
  include ActiveJob::TestHelper

  describe "#perform" do
    let(:manager_email) { "manager@example.com" }
    let(:user1) { User.create!(first_name: "Alice", last_name: "Johnson", email: "alice@example.com", username: "alicej", password: "password123") }
    let(:user2) { User.create!(first_name: "Bob", last_name: "Williams", email: "bob@example.com", username: "bobw", password: "password123") }
    let(:user3) { User.create!(first_name: "Charlie", last_name: "Brown", email: "charlie@example.com", username: "charlieb", password: "password123") }

    before do
      # Clear any previous emails
      ActionMailer::Base.deliveries.clear
    end

    context "with blockers from today" do
      before do
        # Create standups with blockers for today
        Standup.create!(
          user: user1,
          name: "Daily Standup",
          done: "Completed API integration and testing",
          doing: "Working on frontend components",
          blockers: "Waiting for design mockups",
          standup_date: Date.current
        )

        Standup.create!(
          user: user2,
          name: "Daily Standup",
          done: "Fixed bugs in payment module",
          doing: "Code review and documentation",
          blockers: "Need access to staging server",
          standup_date: Date.current
        )
      end

      it "sends an email" do
        expect {
          DailyBlockerJob.perform_now(manager_email)
        }.to change { ActionMailer::Base.deliveries.count }.by(1)
      end

      it "sends email to the correct recipient" do
        DailyBlockerJob.perform_now(manager_email)

        email = ActionMailer::Base.deliveries.last
        expect(email.to).to include(manager_email)
      end

      it "includes correct subject with blocker count" do
        DailyBlockerJob.perform_now(manager_email)

        email = ActionMailer::Base.deliveries.last
        expect(email.subject).to include("2 Blockers")
        expect(email.subject).to include(Date.current.strftime('%B %d, %Y'))
      end

      it "includes blocker information in email body" do
        DailyBlockerJob.perform_now(manager_email)

        email = ActionMailer::Base.deliveries.last
        expect(email.body.encoded).to include("Waiting for design mockups")
        expect(email.body.encoded).to include("Need access to staging server")
      end

      it "includes user names in email" do
        DailyBlockerJob.perform_now(manager_email)

        email = ActionMailer::Base.deliveries.last
        expect(email.body.encoded).to include("Alice Johnson")
        expect(email.body.encoded).to include("Bob Williams")
      end

      it "orders users by first name" do
        DailyBlockerJob.perform_now(manager_email)

        email = ActionMailer::Base.deliveries.last
        alice_position = email.body.encoded.index("Alice Johnson")
        bob_position = email.body.encoded.index("Bob Williams")

        expect(alice_position).to be < bob_position
      end

      it "logs the email sending" do
        allow(Rails.logger).to receive(:info)
        DailyBlockerJob.perform_now(manager_email)
        expect(Rails.logger).to have_received(:info).with(/Daily summary email sent to #{manager_email} with 2 blockers/)
      end
    end

    context "with no blockers today" do
      before do
        # Create standup without blockers
        Standup.create!(
          user: user1,
          name: "Daily Standup",
          done: "Completed all assigned tasks successfully",
          doing: "Working on new feature implementation",
          blockers: nil,
          standup_date: Date.current
        )
      end

      it "sends an email with 0 blockers" do
        DailyBlockerJob.perform_now(manager_email)

        email = ActionMailer::Base.deliveries.last
        expect(email.subject).to include("0 Blockers")
      end

      it "includes no blockers message" do
        DailyBlockerJob.perform_now(manager_email)

        email = ActionMailer::Base.deliveries.last
        expect(email.body.encoded).to match(/no blockers|great news/i)
      end
    end

    context "filtering out invalid blocker values" do
      before do
        # Create standups with various blocker values
        Standup.create!(user: user1, name: "Daily Standup", blockers: "Real blocker issue", standup_date: Date.current, done: "Completed testing phase", doing: "Working on deployment")
        Standup.create!(user: user2, name: "Daily Standup", blockers: "-", standup_date: Date.current, done: "Completed code review", doing: "Working on bug fixes")
        Standup.create!(user: user3, name: "Daily Standup", blockers: "none", standup_date: Date.current, done: "Completed documentation", doing: "Working on new features")
      end

      it "excludes standups with '-' as blocker" do
        DailyBlockerJob.perform_now(manager_email)

        email = ActionMailer::Base.deliveries.last
        expect(email.subject).to include("1 Blockers")
        expect(email.body.encoded).to include("Real blocker issue")
        expect(email.body.encoded).to_not include("Bob Williams")
      end

      it "excludes standups with 'none' as blocker" do
        DailyBlockerJob.perform_now(manager_email)

        email = ActionMailer::Base.deliveries.last
        expect(email.body.encoded).to_not include("Charlie Brown")
      end
    end

    context "with standups from different dates" do
      before do
        # Today's standup with blocker
        Standup.create!(
          user: user1,
          name: "Daily Standup",
          blockers: "Current blocker",
          standup_date: Date.current,
          done: "Completed testing phase successfully",
          doing: "Working on deployment tasks"
        )

        # Yesterday's standup with blocker
        Standup.create!(
          user: user2,
          name: "Daily Standup",
          blockers: "Old blocker from yesterday",
          standup_date: Date.yesterday,
          done: "Completed code review process",
          doing: "Working on bug fixes today"
        )

        # Last week's standup with blocker
        Standup.create!(
          user: user3,
          name: "Daily Standup",
          blockers: "Very old blocker",
          standup_date: 1.week.ago,
          done: "Completed documentation work",
          doing: "Working on new features now"
        )
      end

      it "only includes blockers from today" do
        DailyBlockerJob.perform_now(manager_email)

        email = ActionMailer::Base.deliveries.last
        expect(email.subject).to include("1 Blockers")
        expect(email.body.encoded).to include("Current blocker")
      end

      it "excludes blockers from previous days" do
        DailyBlockerJob.perform_now(manager_email)

        email = ActionMailer::Base.deliveries.last
        expect(email.body.encoded).to_not include("Old blocker from yesterday")
        expect(email.body.encoded).to_not include("Very old blocker")
      end
    end

    context "when manager_email is not provided" do
      it "uses ENV['MANAGER_EMAIL'] as fallback" do
        ENV["MANAGER_EMAIL"] = "default@example.com"

        DailyBlockerJob.perform_now(nil)

        email = ActionMailer::Base.deliveries.last
        expect(email.to).to include("default@example.com")

        ENV.delete("MANAGER_EMAIL")
      end

      it "uses default email when ENV is not set" do
        ENV.delete("MANAGER_EMAIL")

        DailyBlockerJob.perform_now(nil)

        email = ActionMailer::Base.deliveries.last
        expect(email.to).to include("manager@exmaple.com")
      end
    end

    context "Sidekiq integration" do
      it "can be enqueued" do
        expect {
          DailyBlockerJob.perform_later(manager_email)
        }.to have_enqueued_job(DailyBlockerJob).with(manager_email)
      end

      it "is queued in the default queue" do
        expect(DailyBlockerJob.new.queue_name).to eq("default")
      end

      it "processes the job when enqueued" do
        Standup.create!(
          user: user1,
          name: "Daily Standup",
          blockers: "Test blocker",
          standup_date: Date.current,
          done: "Completed testing phase successfully",
          doing: "Working on deployment tasks"
        )

        perform_enqueued_jobs do
          DailyBlockerJob.perform_later(manager_email)
        end

        expect(ActionMailer::Base.deliveries.count).to eq(1)
      end
    end

    context "edge cases" do
      it "handles empty string blockers" do
        Standup.create!(
          user: user1,
          name: "Daily Standup",
          blockers: "",
          standup_date: Date.current,
          done: "Completed testing phase successfully",
          doing: "Working on deployment tasks"
        )

        DailyBlockerJob.perform_now(manager_email)

        email = ActionMailer::Base.deliveries.last
        expect(email.subject).to include("0 Blockers")
      end

      it "handles nil blockers" do
        Standup.create!(
          user: user1,
          name: "Daily Standup",
          blockers: nil,
          standup_date: Date.current,
          done: "Completed testing phase successfully",
          doing: "Working on deployment tasks"
        )

        DailyBlockerJob.perform_now(manager_email)

        email = ActionMailer::Base.deliveries.last
        expect(email.subject).to include("0 Blockers")
      end

      it "handles blockers with whitespace" do
        Standup.create!(
          user: user1,
          name: "Daily Standup",
          blockers: "   ",
          standup_date: Date.current,
          done: "Completed testing phase successfully",
          doing: "Working on deployment tasks"
        )

        DailyBlockerJob.perform_now(manager_email)

        email = ActionMailer::Base.deliveries.last
        expect(email.subject).to include("0 Blockers")
      end

      it "handles case-insensitive 'none' variations" do
        Standup.create!(user: user1, name: "Daily Standup", blockers: "None", standup_date: Date.current, done: "Completed testing phase successfully", doing: "Working on deployment tasks")
        Standup.create!(user: user2, name: "Daily Standup", blockers: "NONE", standup_date: Date.current, done: "Completed code review process", doing: "Working on bug fixes today")
        Standup.create!(user: user3, name: "Daily Standup", blockers: "nil", standup_date: Date.current, done: "Completed documentation work", doing: "Working on new features now")

        DailyBlockerJob.perform_now(manager_email)

        email = ActionMailer::Base.deliveries.last
        expect(email.subject).to include("0 Blockers")
      end
    end
  end
end
