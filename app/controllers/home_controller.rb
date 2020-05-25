class HomeController < ApplicationController
  before_action :get_participant

  def index
  end

  def new
  end

  def create
    @game = Game.create

    # make this participant the first player, which will make them a host
    @player = Player.create(game: @game, participant: @participant)

    # use the game parameters to create the rules
    rule_fields = Rule::VALID_RULE_NAMES.collect {|r| {
      :name => r,
      :game => @game,
      :value => params[r],
    }}
    @rules = Rule.create(rule_fields)

    # finally, redirect to the home controller
    redirect_to controller: 'home', action: 'wait', game_id: @game.id
  end

  def join
    @error_msg = params[:error_msg]
  end

  def join_game
    game_id = params["game_id"]

    if game_id.nil?
      redirect_to action: 'join'
      return
    end

    # Now, check the various game statuses
    if !Game.exists? game_id
      error_msg = "The game ID you were looking for (#{game_id}) is invalid."
      redirect_to action: 'join', error_msg: error_msg
      return
    end
    @game = Game.find(game_id)
    if !@game.is_waiting
      error_msg = "The game ID you were looking for (#{game_id}) " \
        "is not waiting for new players to join. You can try " \
        "watching it or joining a different game."
      redirect_to action: 'join', error_msg: error_msg
      return
    end

    # find the player for this game. If the player doesn't exist, create
    # them. If they do, just get the player.
    if Player.exists?(game: @game, participant: @participant)
      @player = Player.find_by(game_id: @game.id, participant_id: @participant.id)
    else
      @player = Player.create(game: @game, participant: @participant)
    end

    if !@player.valid?
      errors = @player.errors.full_messages.join(", ")
      error_msg = "The following errors happened: #{errors}."
      redirect_to action: 'join', error_msg: error_msg
      return
    end

    redirect_to action: 'wait', game_id: game_id
  end

  def wait
    # TODO: if the host leaves, the game should automatically change to
    #       cancelled after a time out. The host should also have the option
    #       to cancel the game. For the time out, we can use the web socket.

    # Checking if the game id was provided
    if !params.has_key?(:game_id)
      error_msg = "You must provide a game ID in order to join a game."
      # I wanted to set the status to 400, but then it prompts the user
      # that they're being redirected. Is it possible to 400 without
      # prompting user? But anyways, whatever lol
      redirect_to action: 'join', error_msg: error_msg
      return
    end

    # with the game id, now we will check for various errors.
    game_id = params[:game_id]

    if !Game.exists? game_id
      error_msg = "The game ID (#{game_id}) you were looking for is invalid."
      redirect_to action: 'join', error_msg: error_msg
      return
    end
    @game = Game.find(game_id)
    if @game.is_ended
      error_msg = "The game ID (#{game_id}) you were looking for " \
        "has already ended."
      redirect_to action: 'join', error_msg: error_msg
    end
    if @game.is_cancelled
      error_msg = "The game ID (#{game_id}) you were looking for " \
        "was cancelled."
      redirect_to action: 'join', error_msg: error_msg
      return
    end
    # TODO: maybe also check that the game hasn't expired?

    # Now that we have the game, we get the player. Because of the
    # logic, a player would already have been created by this point
    # and this player is a player of this game, unless someone comes
    # at the wait link from an invalid place (i.e., they just type a
    # random URL), so we check that below.
    if !Player.exists?(game_id: @game.id, participant_id: @participant.id)
      error_msg = "It seems like you are not a player of the game ID " \
        "(#{game_id}) you are looking for. Try joining through the join " \
        "link. Or, if you'd like to watch that game, use the watch " \
        "option instead."
      redirect_to action: 'join', error_msg: error_msg
      return
    end

    @player = Player.find_by(game_id: @game.id, participant_id: @participant.id)

    # CASE 1: ONGOING
    # If the game is ongoing, this means that this player must have left
    # the game or something, so here, we just bring them back to the game
    if @game.is_ongoing
      redirect_to play_path(@game), method: 'post'
      return
    end

    # CASE 2: WAITING
    # We must be in the waiting case because we've exhausted all
    # possible game states. Now, onto sub-cases.

    # CASE 2.1: This person is the host, do nothing in that case.
    # The rest is handled by the view.
    if @player.is_host
      return
    end

    # CASE 2.2: This person is a new player that joined. Broadcast
    # to the waiting room that they joined. Then, let the rest be
    # handled by the view.
    ActionCable.server.broadcast(
      WaitChannel::channel_name(@game.id),
      event: WaitChannel::E_JOIN,
      participant_id: @participant.id,
      username: @participant.username,
    )
  end

  def cancel
    if !Game.exists? params[:game_id]
      redirect_to root_url, notice: "the game provided doesn't exist"
      return
    end

    @game = Game.find(params[:game_id])
    if !@game.is_waiting
      notice = "A game may only be cancelled if it's waiting to start"
      redirect_to root_url, notice: notice
      return
    end

    if !Player.exists?(game: @game, participant: @participant)
      notice = "You are not a player of this game. Only the host " \
        "of that game may cancel it."
      redirect_to root_url, notice: notice
      return
    end

    @player = Player.find_by(game_id: @game.id, participant_id: @participant.id)
    if !@player.is_host
      redirect_to root_url, notice: "Only the host may cancel a game"
      return
    end

    @game.set_cancelled
    if @game.save
      notice = "That game was cancelled successfully"
    else
      notice = "An error occurred while cancelling the game"
    end
    redirect_to root_url, notice: notice
  end

  def play
    if !Game.exists? params[:game_id]
      redirect_to root_url, notice: "the game provided doesn't exist"
      return
    end
    @game = Game.find(params[:game_id])

    if !Player.exists?(game: @game, participant: @participant)
      redirect_to root_url, notice: "You are not a player of this game"
      return
    end

    @player = Player.find_by(game_id: @game.id, participant_id: @participant.id)

    # TODO: maybe I should just let all members broadcast this event
    if @player.is_host
      if @game.is_waiting
        @game.set_ongoing
        if !@game.save
          # TODO: ok here we definitely need to put an error...
          error_msg = "starting the game failed, please try again"
          redirect_to wait_path(@game), error_msg: error_msg
        end
        ActionCable.server.broadcast(
          WaitChannel::channel_name(@game.id),
          event: WaitChannel::E_PLAY,
        )
      end
    elsif !@game.is_ongoing
      # TODO: maybe highlight that we're still waiting for host?
      redirect_to wait_path(@game), error_msg: "host hasn't started the game yet"
      return
    end

    # now fetch all the players in this game
    players = Player.where(game_id: @game.id)
    @players = players.collect{ |p| {participant_id: p.participant.id, username: p.participant.username, is_host: p.is_host}}
  end

  def watch_find
    @error_msg = params[:error_msg]
  end

  def watch
  end

  private

  def get_participant
    saved_participant = cookies.encrypted[:participant]
    if (saved_participant.nil?) || (!Participant.exists?(saved_participant))
      participant = Participant.new
      participant.save
      cookies.encrypted[:participant] = participant.id
    else
      participant = Participant.find(saved_participant)
    end
    @participant = participant
  end
end
