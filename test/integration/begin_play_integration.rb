require 'test_helper'

# the following three functions immitate what the server in
# PlayChannel would do
def is_turn_order_determination?(game)
  return game.turns.count < game.players.count
end

def is_rolling?(game, turn, is_turn_order_determination)
  rolls = turn.rolls
  if rolls.count == 0
    num_rolls = game.rules.where(name: Rule::R_DICE_COUNT).pluck(:value)[0]
    return true, num_rolls
  end
  if is_turn_order_determination
    return false, 0
  end
  if game.rules.where(name: Rule::R_ROLL_AFTER_SIX).pluck(:value)[0] == Rule::False
    return false, 0
  end

  actual_rolls = rolls.order(:created_at)
    .collect{ |r| Roll.rolls_from_hint(r.roll_hint) }
    .last

  any_condition = actual_rolls.include? 6
  if !any_condition
    return false, 0
  end

  all_condition = actual_rolls.all? { |r| r == 6 }
  roll_after_six_condition_value = game.rules.where(name: Rule::R_ROLL_AFTER_SIX_CONDITION).pluck(:value)[0]
  all_value = Rule::RULE_SPECS[Rule::R_ROLL_AFTER_SIX_CONDITION][:select][:all]
  if roll_after_six_condition_value == all_value
    num_rolls = game.rules.where(name: Rule::R_DICE_COUNT).pluck(:value)[0]
    return all_condition, (all_condition ? num_rolls : 0)
  end
  return true, actual_rolls.count(6)
end

def is_moving?(game, turn, is_rolling, is_turn_order_determination)
  if is_rolling || is_turn_order_determination
    return false, nil
  end

  actual_rolls = turn.rolls.collect{ |r| Roll.rolls_from_hint(r.roll_hint) }.flatten
  action_rolls = turn.actions.select(:roll).collect{ |a| a[:roll] }
  unaccounted_rolls = PlayChannel.get_unaccounted_rolls(action_rolls, actual_rolls)
  return unaccounted_rolls.count != 0, unaccounted_rolls
end

class BeginPlayIntegrationTest < ActiveSupport::TestCase
  test "rolling at start of the game" do
    game = Game.create
    assert game.valid?
    pt1 = Participant.create(username: "host")
    pt2 = Participant.create(username: "player")
    pr1 = Player.create(game: game, participant: pt1)
    pr2 = Player.create(game: game, participant: pt2)
    # NOTE: this test assumes 2 dices for dice count!
    rule_fields = Rule::VALID_RULE_NAMES.collect {|r| {
      :name => r,
      :game => game,
      :value => Rule::RULE_SPECS[r][:default],
    }}
    rules = Rule.create(rule_fields)
    game.set_ongoing
    assert game.save

    turns_count = game.turns.count
    players_count = game.players.count
    is_turn_order_determination = is_turn_order_determination?(game)
    assert is_turn_order_determination

    # get the current turn and ensure that it's rolling for the very
    # first turn in the game
    current_turn = Turn.current_turn(game)
    turn = Turn.find_or_create_by(game: game, turn: current_turn)
    assert turn.valid?
    assert_equal 0, turn.turn

    is_rolling, num_rolls = is_rolling?(game, turn, is_turn_order_determination)
    assert is_rolling
    assert_equal 2, num_rolls
    is_moving, remaining_rolls = is_moving?(game, turn, is_rolling, is_turn_order_determination)
    assert_not is_moving
    assert remaining_rolls.nil?

    # make a roll, which will then make rolling for the first turn
    # not rolling anymore
    roll = Roll.create(turn: turn, roll_hint: 230)

    is_rolling, num_rolls = is_rolling?(game, turn, is_turn_order_determination)
    assert_not is_rolling
    assert_equal 0, num_rolls
    is_moving, remaining_rolls = is_moving?(game, turn, is_rolling, is_turn_order_determination)
    assert_not is_moving
    assert remaining_rolls.nil?

    # now, move to the next turn, do the same thing above
    turn = Turn.create_next_turn(game)
    assert turn.valid?
    assert_equal 1, turn.turn

    is_turn_order_determination = is_turn_order_determination?(game)
    assert is_turn_order_determination
    is_rolling, num_rolls = is_rolling?(game, turn, is_turn_order_determination)
    assert is_rolling
    assert_equal 2, num_rolls
    is_moving, remaining_rolls = is_moving?(game, turn, is_rolling, is_turn_order_determination)
    assert_not is_moving
    assert remaining_rolls.nil?


    roll = Roll.create(turn: turn, roll_hint: 640)
    is_rolling, num_rolls = is_rolling?(game, turn, is_turn_order_determination)
    assert_not is_rolling
    assert_equal 0, num_rolls
    is_moving, remaining_rolls = is_moving?(game, turn, is_rolling, is_turn_order_determination)
    assert_not is_moving
    assert remaining_rolls.nil?

    # move to the next turn, but this time it's not turn order anymore
    turn = Turn.create_next_turn(game)
    assert turn.valid?
    assert_equal 2, turn.turn

    is_turn_order_determination = is_turn_order_determination?(game)
    assert_not is_turn_order_determination
    is_rolling, num_rolls = is_rolling?(game, turn, is_turn_order_determination)
    assert is_rolling
    assert_equal 2, num_rolls
    is_moving, remaining_rolls = is_moving?(game, turn, is_rolling, is_turn_order_determination)
    assert_not is_moving
    assert remaining_rolls.nil?


    roll = Roll.create(turn: turn, roll_hint: 660)

    # we rolled two sixes, so it's still rolling
    is_rolling, num_rolls = is_rolling?(game, turn, is_turn_order_determination)
    assert is_rolling
    assert_equal 2, num_rolls
    is_moving, remaining_rolls = is_moving?(game, turn, is_rolling, is_turn_order_determination)
    assert_not is_moving
    assert remaining_rolls.nil?

    # roll again, we gotta roll again after but only 1
    roll = Roll.create(turn: turn, roll_hint: 650)
    is_rolling, num_rolls = is_rolling?(game, turn, is_turn_order_determination)
    assert is_rolling
    assert_equal 1, num_rolls
    is_moving, remaining_rolls = is_moving?(game, turn, is_rolling, is_turn_order_determination)
    assert_not is_moving
    assert remaining_rolls.nil?

    # roll again, now we stop rolling
    roll = Roll.create(turn: turn, roll_hint: 100)
    is_rolling, num_rolls = is_rolling?(game, turn, is_turn_order_determination)
    assert_not is_rolling
    assert_equal 0, num_rolls

    # now we're moving, and there's 5 rolls remaining from 66,65,1
    is_moving, remaining_rolls = is_moving?(game, turn, is_rolling, is_turn_order_determination)
    assert is_moving
    assert 5, remaining_rolls.count
    assert_equal [1, 5, 6, 6, 6], remaining_rolls.sort

    # move a piece out with a 6
    a = Action.create(
      turn: turn, action: Action.for(Action::A_BEGIN), piece: 1, roll: 6
    )
    assert a.valid?
    is_rolling, num_rolls = is_rolling?(game, turn, is_turn_order_determination)
    assert_not is_rolling
    assert_equal 0, num_rolls
    is_moving, remaining_rolls = is_moving?(game, turn, is_rolling, is_turn_order_determination)
    assert is_moving
    assert 4, remaining_rolls.count
    assert_equal [1, 5, 6, 6], remaining_rolls.sort

    # move that piece a few cells forward
    a = Action.create(
      turn: turn, action: Action.for(Action::A_MOVE), piece: 1, roll: 6
    )
    a = Action.create(
      turn: turn, action: Action.for(Action::A_MOVE), piece: 1, roll: 1
    )
    assert a.valid?
    is_rolling, num_rolls = is_rolling?(game, turn, is_turn_order_determination)
    assert_not is_rolling
    assert_equal 0, num_rolls
    is_moving, remaining_rolls = is_moving?(game, turn, is_rolling, is_turn_order_determination)
    assert is_moving
    assert 2, remaining_rolls.count
    assert_equal [5, 6], remaining_rolls.sort

    # move another piece out and a few cells forward
    a = Action.create(
      turn: turn, action: Action.for(Action::A_BEGIN), piece: 2, roll: 6
    )
    a = Action.create(
      turn: turn, action: Action.for(Action::A_MOVE), piece: 2, roll: 5
    )
    assert a.valid?
    is_rolling, num_rolls = is_rolling?(game, turn, is_turn_order_determination)
    assert_not is_rolling
    assert_equal 0, num_rolls
    is_moving, remaining_rolls = is_moving?(game, turn, is_rolling, is_turn_order_determination)
    assert_not is_moving
    assert 0, remaining_rolls.count
    assert_equal [], remaining_rolls.sort
  end
end
