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

  test "ongoing setter work" do
    g = Game.new
    assert g.save
    g.set_ongoing
    assert g.save
    assert g.status == Game::STATUS_ONGOING
  end

  test "cancel setter work" do
    g = Game.new
    assert g.save
    g.set_cancelled
    assert g.save
    assert g.status == Game::STATUS_CANCELLED
  end

  test "ending before completion setter work" do
    g = Game.new
    assert g.save
    g.set_ended
    assert g.save
    assert g.is_ended
    assert g.is_ended_before_completion
  end

  test "ending setter work" do
    g = Game.new
    assert g.save
    g.set_ended(true)
    assert g.save
    assert g.is_ended
    assert_not g.is_ended_before_completion
  end
end
