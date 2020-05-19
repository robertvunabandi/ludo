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
    @invalid_game_id = nil
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
    if !Game.exists? params[:game_id]
      puts "INVALID GAME ID #{params[:game_id]}"
      @invalid_game_id = params[:game_id]
      redirect_to action: 'join'
      return
    end
    @game = Game.find(params[:game_id])
    if @game.is_ended || @game.is_cancelled
      @invalid_game_id = params[:game_id]
      redirect_to action: 'join'
      return
    end
  end

  private

  def get_participant
    if (!cookies.has_key?(:participant)) || (!Participant.exists?(cookies[:participant]))
      participant = Participant.new
      participant.save
      cookies[:participant] = participant.id
    else
      participant = Participant.find(cookies[:participant])
    end
    return participant
  end
end
