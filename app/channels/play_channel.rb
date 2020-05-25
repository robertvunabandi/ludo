class PlayChannel < ApplicationCable::Channel
  # events that we expect to see for PLAY
  E_APPEAR = "appear"
  E_DISAPPEAR = "disappear"
  E_MOVE = "move"

  def self.channel_name(game_id)
    return "play_space:#{game_id}"
  end

  def subscribed
    # stream_from "some_channel"
    @game = Game.find(params["game_id"])
    @channel = PlayChannel::channel_name(@game.id)
    stream_from @channel
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

  def move(data)
    rolls = data["rolls"]
    actions = data["actions"]
    pid = data["participant_id"]
    # TODO: do something with the rolls and actions, maybe
    # some validations too. I think here we need to determine
    # whose turn it is. I'll probably do it naively first, then
    # go from there.
  end

  private

  def get_players(changer_id=nil)
    players = Player.where(game_id: @game.id)
    # I need to return a List<{participant_id:str, username:str, is_host:bool}>
    return players.collect{ |p| {participant_id: p.participant.id, username: p.participant.username, is_host: p.is_host}}
  end
end
