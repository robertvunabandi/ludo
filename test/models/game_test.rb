require 'test_helper'

class GameTest < ActiveSupport::TestCase
  test "should save empty game" do
    g = Game.create
    assert g.save
  end

  test "should set status to WAITING for new games" do
    g = Game.new
    assert g.save
    assert g.status == Game::STATUS_WAITING
  end

  test "ongoing setters work" do
    g = Game.new
    assert g.save
    g.set_ongoing
    assert g.save
    assert g.status == Game::STATUS_ONGOING
  end

  test "completed setters work" do
    g = Game.new
    assert g.save
    g.set_completed
    assert g.save
    assert g.status == Game::STATUS_COMPLETED
  end
end
