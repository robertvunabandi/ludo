Rails.application.routes.draw do
  root 'home#index'
  post '/new', to: 'home#new'
  get '/join', to: 'home#join'
  get '/wait', to: 'home#wait'
  get '/wait/:game_id', to: 'home#wait'
end
