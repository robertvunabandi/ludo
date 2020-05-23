class WaitChannel < ApplicationCable::Channel
  # events that we expect to see
  E_APPEAR = "appear"
  E_DISAPPEAR = "disappear"
  E_PLAYERS = "players"

  def self.channel_name(game_id)
    return "waiting_space:#{game_id}"
  end

  def subscribed
    # get the game id from the parameters
    @game = Game.find(params["game_id"])
    @channel = WaitChannel::channel_name(@game.id)
    stream_from @channel

    ActionCable.server.broadcast(
      @channel, event: E_PLAYERS, players: get_players
    )
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
    puts "LEAVING: unsubscribed #{participant.id} from #{@channel}"
  end

  def ping
    ActionCable.server.broadcast(
      @channel, event: "ping", participant_id: participant.id
    )
  end

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

  private

  def get_players
    players = Player.where(game_id: @game.id)
    # I need to return a List<{participant_id:str, username:str, is_host:bool}>
    return players.collect{ |p| {participant_id: p.participant.id, username: p.participant.username, is_host: p.is_host}}
  end
end
