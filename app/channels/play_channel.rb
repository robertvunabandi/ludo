class PlayChannel < ApplicationCable::Channel
  # events that we expect to see for PLAY
  E_APPEAR = "appear"
  E_DISAPPEAR = "disappear"
  E_START = "start"
  E_HISTORY = "history"
  E_TURN_INFO = "turn_info"

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
    @players = @game.players.order(:created_at)
    @turn_outcome_determined = false
    @players_in_turn_order = @players.collect{ |p| p.participant_id}

    broadcast_rules_info(E_START)

    # create the zeroth turn
    current_turn = Turn.current_turn(@game)
    turn = Turn.find_or_create_by(game: @game, turn: current_turn)
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
    participant_id = data["participant_id"]

    current_turn = Turn.current_turn(@game)
    turn = Turn.find_by(game: @game, turn: current_turn)
    turn_info = get_turn_info(turn)
    turn_pid = turn_info[:turn_participant_id]

    if (participant_id != turn_pid)
      puts "#{participant_id} tried rolling but turn's not their turn"
      return
    end

    is_rolling = turn_info[:is_rolling]
    if !is_rolling
      puts "#{participant_id} tried rolling but is_rolling=false"
      return
    end

    num_rolls = turn_info[:num_rolls]
    rolls = (1..num_rolls).collect{ |c| rand(1..6) }
    roll = Roll.create(turn: turn, roll_hint: Roll.hint_from_rolls(rolls))

    if !roll.valid?
      # TODO: not sure how to handle this in the client...
      # should check if I can send it twice
      puts "ERROR - roll is invalid (#{roll})."
      puts "ERRORS: #{roll.errors.messages}"
      return
    end

    broadcast_turn_history(E_HISTORY, turn)
    broadcast_turn_info(E_TURN_INFO, turn)
  end

  def action(data)
    participant_id = data["participant_id"]
    action = data["action"]
    piece = data["piece"]
    roll = data["roll"]

    current_turn = Turn.current_turn(@game)
    turn = Turn.find_by(game: @game, turn: current_turn)

    # TODO: validate the participant that sent the action
    # TODO: create the action
    # TODO: broadcast the turn info through history
    return
    broadcast_turn_history(E_HISTORY, turn)
    broadcast_turn_info(E_TURN_INFO, turn)
  end

  def finish_turn(data)
    participant_id = data["participant_id"]

    current_turn = Turn.current_turn(@game)
    turn = Turn.find_by(game: @game, turn: current_turn)
    turn_info = get_turn_info(turn)
    turn_pid = turn_info[:turn_participant_id]

    if (participant_id != turn_pid)
      puts "#{participant_id} tried finishing turn but turn's not their turn"
      return
    end

    is_rolling = turn_info[:is_rolling]
    if is_rolling
      puts "#{participant_id} tried finishing turn but is_rolling=true"
      return
    end
    is_moving = turn_info[:is_moving]
    if is_moving
      puts "#{participant_id} tried finishing turn but is_moving=true"
      return
    end

    next_turn = Turn.create_next_turn(@game)
    saved_nt = next_turn.save
    if !saved_nt
      # TODO: not sure what to do if it fails
      puts "ERROR: next_turn didn't save - #{next_turn}"
      puts "ERRORS: #{next_turn.errors.messages}"
      return
    end

    broadcast_turn_history(E_HISTORY, next_turn)
    broadcast_turn_info(E_TURN_INFO, next_turn)
  end

  def history_request(data)
    # TODO: send all the necessary history for that index through E_HISTORY
    turn_requested = data["turn"]
    if turn_requested == -1
      turn_requested = Turn.current_turn(@game)
    end
    begin
      turn = Turn.find_by(game: @game, turn: turn_requested)
      broadcast_turn_history(E_HISTORY, turn)
    rescue
      turn_s = "(#{turn_requested}, data.turn=#{data['turn']})"
      puts "==TURN REQUESTED #{turn_s} NOT FOUND=="
    end
  end

  def turn_info_request
    current_turn = Turn.current_turn(@game)
    turn = Turn.find_by(game: @game, turn: current_turn)
    broadcast_turn_info(E_TURN_INFO, turn)
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

  def broadcast_rules_info(event)
    ActionCable.server.broadcast(@channel, event: event, rules: @rules)
  end

  def broadcast_turn_info(event, turn)
    turn_info = get_turn_info(turn)

    ActionCable.server.broadcast(
      @channel,
      event: event,
      turn_participant_id: turn_info[:turn_participant_id],
      turn: turn_info[:turn],
      is_turn_order_determination: turn_info[:is_turn_order_determination],
      is_rolling: turn_info[:is_rolling],
      num_rolls: turn_info[:num_rolls],
      is_moving: turn_info[:is_moving],
      remaining_rolls: turn_info[:remaining_rolls],
    )
  end

  def set_players_in_turn_order
    # order the players from largest rolls sum to smallest rolls sum
    # TODO: not sure if this method works. will need to test it out
    old_order = @players_in_turn_order
    turns = @game.turns.order(:created_at).first(@players.count)
    # there should be only one roll for each players because of
    # turn order determination
    outcomes = turns.collect{ |t| Roll.rolls_from_hint(t.rolls.first.roll_hint) }
    mapping = {}
    for i in 0...num_players
      mapping[old_order[i]] = outcomes[i].inject(0){ |sum, roll| sum - roll }
    end
    @players_in_turn_order = old_order.sort_by { |p| mapping[p] }
  end

  def broadcast_turn_history(event, turn)
    rolls = turn.rolls.count == 0 ? [] : (
      turn.rolls.order(:created_at)
        .collect{ |r| {roll_id: r.id, rolls: Roll.rolls_from_hint(r.roll_hint)} }
    )
    actions = turn.actions.count == 0 ? [] : (
      turn.actions.order(:created_at)
        .collect{ |a| {action_id: a.id, action: a.action, piece: a.piece, roll: a.roll} })
    ActionCable.server.broadcast(
      @channel, event: event, turn: turn.turn, rolls: rolls, actions: actions
    )
  end

  def get_turn_info(turn)
    is_turn_order_determination = turn.turn < @game.players.count
    if !is_turn_order_determination && !@turn_outcome_determined
      set_players_in_turn_order
    end

    is_rolling, num_rolls = is_rolling?(turn, is_turn_order_determination)
    is_moving, remaining_rolls = is_moving?(
      turn, is_rolling, is_turn_order_determination
    )

    num_players = @players_in_turn_order.length()
    turn_participant_id = @players_in_turn_order[turn.turn % num_players]

    return {
      turn: turn.turn,
      turn_participant_id: turn_participant_id,
      is_turn_order_determination: is_turn_order_determination,
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
