class PlayChannel < ApplicationCable::Channel
  # events that we expect to see for PLAY
  E_APPEAR = "appear"
  E_DISAPPEAR = "disappear"
  E_START = "start"
  E_HISTORY = "history"

  def self.channel_name(game_id)
    return "play_space:#{game_id}"
  end

  def subscribed
    # stream_from "some_channel"
    @game = Game.find(params["game_id"])
    @channel = PlayChannel::channel_name(@game.id)
    stream_from @channel

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

  def history_request(data)
    # TODO: send all the necessary history for that index through E_HISTORY
  end

  private

  def broadcast_current_turn_info(event, with_rules = false)
    rules = with_rules ? get_rules : nil
    current_turn = get_current_turn
    ActionCable.server.broadcast(
      @channel,
      event: event,
      is_turn_order_determination: current_turn[:is_turn_order_determination],
      turn: current_turn[:turn],
      is_rolling: current_turn[:is_rolling],
      is_moving: current_turn[:is_moving],
      remaining_rolls: current_turn[:remaining_rolls],
      rules: rules,
    )
  end

  def is_turn_order_determination
    return turns <= players
  end

  def get_current_turn
    turns_count = @game.turns.count
    players_count = @game.players.count
    turn = turns_count == 0 ? 0 : @game.turns.maximum(:turn).turn

    return {
      is_turn_order_determination: turns_count < players_count,
      turn: turn,
      is_rolling: false,
      is_moving: false,
      remaining_rolls: nil,
    }
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
