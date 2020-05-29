class Turn < ApplicationRecord
  # Maybe this should have been called "round", but then the "turn"
  # field would also be "round". Uh.
  belongs_to :game
  has_many :rolls
  has_many :actions

  validates :game, presence:true
  validates :turn, presence:true, :numericality => { :only_integer => true }

  def self.create_next_turn(game)
    turn = Turn.new
    turn.game = game
    turn.turn = Turn.next_turn(game)
    return turn
  end

  def self.next_turn(game)
    if Turn.where(game_id: game.id).count == 0
      return 0
    end
    max_turn = Turn.where(game_id: game.id).maximum(:turn)
    return max_turn + 1
  end
end
