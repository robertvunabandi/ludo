# The main field of a game is the status, which can be:
# - 1: WAITING
# - 2: ONGOING
# - 3: COMPLETED

class Game < ApplicationRecord
  STATUS_WAITING = 10
  STATUS_CANCELLED = 11
  STATUS_ONGOING = 20
  STATUS_COMPLETED = 30
  STATUS_ENDED_BEFORE_COMPLETION = 31

  # Ensure that the status received is valid
  VALID_STATUSES = [
    STATUS_WAITING,
    STATUS_CANCELLED,
    STATUS_ONGOING,
    STATUS_COMPLETED,
    STATUS_ENDED_BEFORE_COMPLETION,
  ]
  validates(
    :status,
    presence: true,
    :numericality => { :only_integer => true },
    :inclusion => {:in => VALID_STATUSES},
    if: :should_validate?,
  )

  def readable_status
    case self.status
    when STATUS_WAITING
      return "waiting"
    when STATUS_CANCELLED
      return "cancelled"
    when STATUS_ONGOING
      return "ongoing"
    when STATUS_COMPLETED
      return "completed"
    when STATUS_ENDED_BEFORE_COMPLETION
      return "ended-before-completion"
    else
      return "[INVALID_STATUS]"
    end
  end

  def is_waiting
    self.status == STATUS_WAITING
  end

  def is_cancelled
    self.status == STATUS_CANCELLED
  end
  def set_cancelled
    self.status = STATUS_CANCELLED
  end

  def is_ongoing
    self.status == STATUS_ONGOING
  end
  def set_ongoing
    self.status = STATUS_ONGOING
  end

  def is_ended
    [STATUS_COMPLETED, STATUS_ENDED_BEFORE_COMPLETION].include?(self.status)
  end
  def is_ended_before_completion
    self.status == STATUS_ENDED_BEFORE_COMPLETION
  end
  def set_ended(game_completed = false)
    self.status = game_completed ? STATUS_COMPLETED : STATUS_ENDED_BEFORE_COMPLETION
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
