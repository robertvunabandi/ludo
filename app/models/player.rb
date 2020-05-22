class Player < ApplicationRecord
  belongs_to :game
  belongs_to :participant

  # A game of Ludo has at most this many players
  MAX_PLAYERS = 4

  validates :game, presence: true
  validates :participant, presence: true

  class ParticipantValidator < ActiveModel::Validator
    def validate(record)
      # Uh... look at that double "??". We gotta put two because
      # "record.new_record?" is actually a method that returns
      # a boolean, then the other "?" is for ternary operator
      extra = record.new_record?? 0 : 1
      if record.game.players.count >= (MAX_PLAYERS + extra)
        record.errors[:participant] << "a game cannot have more than 4 players"
      end
    end
  end
  validates_with ParticipantValidator

  def is_host
    # TODO: there should be a better way to do this by using the
    #       order operation somehow. Tue result of self.game.players
    #       is an ActiveRecord::Associations::CollectionProxy, but
    #       it doesn't have an order operation somehow. Anyway, this
    #       ugly thing works.
    players = self.game.players.collect {|p| p}.sort {|a, b| a.created_at >b.created_at ? 1 : -1}
    return self == players.first
  end
end
