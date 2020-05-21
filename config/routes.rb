Rails.application.routes.draw do
  root 'home#index'
  get '/new', to: 'home#new'
  post '/create', to: 'home#create'
  get '/join', to: 'home#join'
  post '/join', to: "home#join_game"
  get '/wait', to: 'home#wait'
  get '/wait/:game_id', to: 'home#wait'
end
