Rails.application.routes.draw do
  root 'home#index'
  get '/new', to: 'home#new'
  post '/create', to: 'home#create'
  get '/join', to: 'home#join'
  post '/join', to: "home#join_game"
  get '/wait', to: 'home#wait'
  get '/wait/:game_id', to: 'home#wait'
  post '/cancel/:game_id', to: 'home#cancel', as: 'cancel'
  get 'play/:game_id', to: 'home#play', as: 'play'
  get '/watch', to: 'home#watch_find'
  get '/watch/:game_id', to: 'home#watch'
end
