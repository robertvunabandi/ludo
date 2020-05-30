class PlayChannel < ApplicationCable::Channel
  # events that we expect to see for PLAY
  E_APPEAR = "appear"
  E_DISAPPEAR = "disappear"
  E_START = "start"
  E_HISTORY = "history"

  # conditions for rolling after 6, RASC stands for Roll After Six Condition
  RASC_ANY_VALUE = Rule::RULE_SPECS[Rule::R_ROLL_AFTER_SIX_CONDITION][:select][:any]
  RASC_ALL_VALUE = Rule::RULE_SPECS[Rule::R_ROLL_AFTER_SIX_CONDITION][:select][:all]

  def self.channel_name(game_id)
    return "play_space:#{game_id}"
  end

  def subscribed
    # stream_from "some_channel"
    @game = Game.find(params["game_id"])
    @channel = PlayChannel::channel_name(@game.id)
    stream_from @channel

    @roll_after_six = @game.rules.where(
      name: Rule::R_ROLL_AFTER_SIX
    ).pluck(:value)[0] == Rule::True
    @roll_after_six_condition_value = @game.rules.where(
      name: Rule::R_ROLL_AFTER_SIX_CONDITION
    ).pluck(:value)[0]
    @num_dices = @game.rules.where(name: Rule::R_DICE_COUNT).pluck(:value)[0]
    @rules = get_rules

    broadcast_current_turn_info(E_START, true)
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
    puts "LEAVING: unsubscribed #{participant.id} from #{@channel}"
  end

  # DEFINED ACTIONS

  def appear
    ActionCable.server.broadcast(
      @channel, event: E_APPEAR, participant_id: participant.id
    )
  end

  def leave
    ActionCable.server.broadcast(
      @channel, event: E_DISAPPEAR, participant_id: participant.id
    )
  end

  def roll(data)
    # TODO: perform the roll, then send a history
  end

  def action(data)
    # TODO: perform the action, then send a history
  end

  def finish(data)
    # TODO: perfrom the action, which will finish the current turn
    # this must be perform only by the current player whose turn it is
    # then send a new turn info
  end

  def history_request(data)
    # TODO: send all the necessary history for that index through E_HISTORY
  end

  ###
  ### Public static methods, must be declared before `private`
  ### keyword even though it should really be placed more below
  ###

  def self.get_unaccounted_rolls(action_rolls, actual_rolls)
    # this method is very similar to the `is_array_subset?` inside
    # models/action.rb. See there for more info on what it's doing

    # the action_rolls have all the rolls that are currently done
    # the actual_rolls are the rolls that were rolled and may still
    # be needing actions
    # Preconditions: action_rolls is a subset of actual_rolls
    unnacounted_rolls = []
    action_rolls.sort!
    actual_rolls.sort!
    i, j = [0, 0]
    while true
      # if we reach the last element of action_rolls, then we
      # need to add all unaccounted rolls in the actual_rolls
      if i == action_rolls.length
        for k in j...actual_rolls.length
          unnacounted_rolls << actual_rolls[k]
        end
        return unnacounted_rolls
      end
      # no need to check if j == actual_rolls.length because if
      # we reach the last element of actual_rolls, we must also
      # reach the last element of action_rolls. So, that case will
      # be handled in the condition above. this is because of the
      # subset precondition above
      raise "INVALID SITUATION" unless j < actual_rolls.length

      # if they match at i and j, then the value at j is accounted for
      if action_rolls[i] == actual_rolls[j]
        i, j = [i + 1, j + 1]
        next
      end
      # the value at j is not accounted for
      unnacounted_rolls << actual_rolls[j]
      j += 1
    end
  end

  private

  def broadcast_current_turn_info(event, with_rules = false)
    rules = with_rules ? @rules : nil
    current_turn_info = get_current_turn_info
    ActionCable.server.broadcast(
      @channel,
      event: event,
      is_turn_order_determination: current_turn_info[:is_turn_order_determination],
      turn: current_turn_info[:turn],
      is_rolling: current_turn_info[:is_rolling],
      num_rolls: current_turn_info[:num_rolls],
      is_moving: current_turn_info[:is_moving],
      remaining_rolls: current_turn_info[:remaining_rolls],
      rules: rules,
    )
  end

  def is_turn_order_determination
    return turns <= players
  end

  def get_current_turn_info
    is_turn_order_determination = @game.turns.count < @game.players.count

    current_turn = Turn.current_turn(@game)
    # this will only create the first time, later on it will find
    # the turn that is already created by the FINISH action
    turn = Turn.find_or_create_by(game: @game, turn: current_turn)
    is_rolling, num_rolls = is_rolling?(turn, is_turn_order_determination)
    is_moving, remaining_rolls = is_moving?(
      turn, is_rolling, is_turn_order_determination
    )

    return {
      is_turn_order_determination: is_turn_order_determination,
      turn: current_turn,
      is_rolling: is_rolling,
      num_rolls: num_rolls,
      is_moving: is_moving,
      remaining_rolls: remaining_rolls,
    }
  end

  def is_rolling?(turn, is_turn_order_determination)
    # first check if the turn has any roll if not, we are rolling.
    rolls = turn.rolls
    if rolls.count == 0
      return true, @num_dices
    end

    # if there is at least one roll and it's turn order determination,
    # we can't be rolling
    if is_turn_order_determination
      return false, 0
    end

    # if we're not rolling after 6, we just return false from here
    if !@roll_after_six
      return false, 0
    end

    actual_rolls = rolls.order(:created_at)
      .collect{ |r| Roll.rolls_from_hint(r.roll_hint) }
      .last

    # we need at least one 6 to roll again
    any_condition = actual_rolls.include? 6
    if !any_condition
      return false, 0
    end

    all_condition = actual_rolls.all? { |r| r == 6 }
    if @roll_after_six_condition_value == RASC_ALL_VALUE
      return all_condition, (all_condition ? @num_dices : 0)
    end
    return true, actual_rolls.count(6)
  end

  def is_moving?(turn, is_rolling, is_turn_order_determination)
    # we can't be moving if we're rolling or we're in turn
    # order determination
    if is_rolling || is_turn_order_determination
      return false, nil
    end

    actual_rolls = turn.rolls.collect{ |r| Roll.rolls_from_hint(r.roll_hint) }.flatten
    action_rolls = turn.actions.select(:roll).collect{ |a| a[:roll] }
    unaccounted_rolls = PlayChannel.get_unaccounted_rolls(action_rolls, actual_rolls)
    # sometimes, this will be false. this creates a problem if we
    # need to move to the next turn. how we mitigate this is that
    # the player whose turn it is will send a "DONE" event to move
    # to the next turn.
    return (unaccounted_rolls.count != 0), unaccounted_rolls
  end

  def get_rules
    rules = @game.rules.collect{|r| {name: r[:name],  value: r.human_value}}
    rule_hash = Hash.new
    rules.each do |rule|
      rule_hash[rule[:name]] = rule[:value]
    end
    return rule_hash
  end
end
