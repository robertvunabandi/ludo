class HomeController < ApplicationController
  def index
  end

  def new
  end

  def join
    @invalid_game_id = nil
    # @game = Game.new
  end

  def wait
    if !param.has_key?(:game_id)
      redirect_to 'join'
    end
    # @game = Game.find(params[:game_id])
    # if !@game.exists?
    #   @invalid_game_id = params[:game_id]
    #   redirect_to 'join'
    # end

    # TODO: this below is temporary
    @game_id = params[:game_id]
  end
end
