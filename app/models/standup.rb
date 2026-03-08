class Standup < ApplicationRecord
  belongs_to :user
  validates :name, presence: true
  validates :done, :doing, presence: true, length: { minimum: 15 }
  validates :blockers, length: { maximum: 200 }, allow_blank: true
  validates :standup_date, presence: true
  validate :date_cannot_be_in_future

  def self.sorted_by_date(direction = "desc")
    order(standup_date: direction)
  end

  scope :recent, -> { order(created_at: :desc) }

  private

  def date_cannot_be_in_future
    if standup_date.present? && standup_date > Date.today
      errors.add(:standup_date, "cannot be in the future. You can only log past or current progress.")
    end
  end
end
