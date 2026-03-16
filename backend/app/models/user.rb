class User < ApplicationRecord
  devise :database_authenticatable, :registerable, :recoverable, :rememberable, :validatable
  validates :username, presence: true, uniqueness: { case_sensitive: false }
  validates :email, presence: true, uniqueness: true
  validates :first_name, presence: true
  validates :last_name, presence: true
  validates :first_name, uniqueness: {
    scope: :last_name,
    case_sensitive: false,
    message: "and last name combination is already taken by another account"
  }
  validates :last_name, presence: true
  has_many :standups, dependent: :destroy

  def full_name
    "#{first_name} #{last_name}"
  end

  def gravatar_url
    hash = Digest::MD5.hexdigest(email.downcase)
    "https://www.gravatar.com/avatar/#{hash}?d=identicon&s=40"
  end
end
