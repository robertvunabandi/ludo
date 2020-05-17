# The main field of a game is the status, which can be:
# - 1: WAITING
# - 2: ONGOING
# - 3: COMPLETED

class Game < ApplicationRecord
  STATUS_WAITING = 1
  STATUS_ONGOING = 2
  STATUS_COMPLETED = 3

  # Ensure that the status received is valid
  validates(
    :status,
    presence: true,
    :numericality => { :only_integer => true },
    :inclusion => {:in => [STATUS_WAITING, STATUS_ONGOING, STATUS_COMPLETED]},
    if: :should_validate?,
  )

  def is_waiting
    self.status == STATUS_WAITING
  end

  def is_ongoing
    self.status == STATUS_ONGOING
  end
  def set_ongoing
    self.status = STATUS_ONGOING
  end

  def is_completed
    self.status == STATUS_COMPLETED
  end
  def set_completed
    self.status = STATUS_COMPLETED
  end

  before_create :default_values

  # ---------------------------------------------------------------------------
  private

  def should_validate?
    !new_record?
  end

  def default_values
    self.status = STATUS_WAITING
  end
end
