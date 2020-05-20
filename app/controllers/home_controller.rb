class HomeController < ApplicationController
  def index
    @participant = get_participant
  end

  def new
    @participant = get_participant
    @game = Game.create
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
    if !params.has_key?(:game_id)
      redirect_to action: 'join'
      return
    end

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
