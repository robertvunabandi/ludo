class Participant < ApplicationRecord
  DEFAULT_USERNAME_START = 'anonymous'
  MIN_USERNAME_LENGTH = 4
  MAX_USERNAME_LENGTH = 25

  has_many :players

  validates(
    :username,
    presence: true,
    length: {minimum: MIN_USERNAME_LENGTH, maximum: MAX_USERNAME_LENGTH},
    if: :should_validate?,
  )

  before_create :default_username

  private

  def should_validate?
    # if not a new record, we automatically validate.
    # if new record but the username is given (i.e.,
    # it's not nil), then we also validate.
    !new_record? && !self.username.nil?
  end

  def default_username
    if self.username.nil?
      number = "#{rand(1..99999)}".rjust(5, '0')
      self.username = "anonymous-#{number}"
    end
  end
end
