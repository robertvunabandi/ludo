class ApplicationController < ActionController::Base
  before_action :set_hostname

  private

  def set_hostname
    @hostname = request.host
  end
end
