Rails.application.routes.draw do
  root 'home#index'
  get '/new', to: 'home#new'
  get '/join', to: 'home#join'
end
