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

    ActionCable.server.broadcast(
      @channel,
      event: E_START,
      is_turn_order_determination: true,
      turn: 1,
      rules: get_rules,
    )
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

  def get_rules
    rules = @game.rules.collect{|r| {name: r[:name],  value: r.human_value}}
    rule_hash = Hash.new
    rules.each do |rule|
      rule_hash[rule[:name]] = rule[:value]
    end
    return rule_hash
  end
end
