class HomeController < ApplicationController
  def index
    @participant = get_participant

  end

  def new
    @participant = get_participant
  end

  def create
    @participant = get_participant
    @game = Game.create
    # use the game parameters to create the rules
    rule_fields = Rule::VALID_RULE_NAMES.collect {|r| {
      :name => r,
      :game => @game,
      :value => params[r],
    }}
    @rules = Rule.create(rule_fields)
    # TODO: create a channel local instance for the game or something??
    redirect_to controller: 'home', action: 'wait', game_id: @game.id
  end

  def join
    @participant = get_participant
    @error_msg = nil
    @game = nil
  end

  def join_game
    @participant = get_participant
    game_id = params["game_id"]

    if game_id.nil?
      redirect_to action: 'join'
      return
    end

    # TODO: Here, add connection to game socket if possible...
    redirect_to action: 'wait', game_id: game_id
  end

  def wait
    @participant = get_participant
    # TODO: if the host leaves, the game should automatically change to
    #       cancelled!
    # TODO: I wanted to set the status to 400, but then it prompts the user
    #       that they're being redirected. Is it possible to 400 without
    #       prompting user?
    # Checking if the game id was provided
    if !params.has_key?(:game_id)
      redirect_to action: 'join'
      return
    end

    # with the game id, now we will check for various errors.
    game_id = params[:game_id]

    if !Game.exists? game_id
      @error_msg = "The game ID you were looking for (#{game_id}) is invalid"
      redirect_to action: 'join'
      return
    end

    @game = Game.find(game_id)

    if @game.is_ended
      @error_msg = "The game ID you were looking for (#{game_id}) has already ended"
      redirect_to action: 'join'
    end

    if @game.is_cancelled
      @error_msg = "The game ID you were looking for (#{game_id}) was cancelled"
      redirect_to action: 'join'
      return
    end

    # Game is not ended nor cancelled. It could either be waiting
    # or ongoing.
    ActionCable.server.broadcast "wait_channel",
      content: "Hey from #{@participant.id}"

    # CASE 1: ONGOING
    # Say that the game has already started
    # TODO: for later, we should propose them whether they want to watch it
    if @game.is_ongoing
      @error_msg = "The game ID you were looking for (#{game_id}) has already started"
      redirect_to action: 'join'
      return
    end

    # CASE 2: WAITING: make this person join the game
    # CASE 2.1: MORE PLAYERS NEEDED: after they join, we still haven't
    #           reached 4 players
    # TODO: handle the case above

    # CASE 2.2: REACHED FOR PLAYER: after they join, we get to 4 players
    # TODO: handle the case above

    # CASE 2.3: ALREADY AT 4 PLAYER: if they join, we'd be at 5 players
    # TODO: print some error, we should never reach this case because
    #       CASE 2.2 will make the game ongoing
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
    return participant
  end
end
