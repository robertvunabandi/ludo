class Participant < ApplicationRecord
  has_many :players

  def username
    # TODO: Temporarily do this until we create a username field
    "anonymous"
  end
end
