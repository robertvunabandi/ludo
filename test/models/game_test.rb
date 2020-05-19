require 'test_helper'

class GameTest < ActiveSupport::TestCase
  test "game#save: should save empty game" do
    g = Game.create
    assert g.save
  end

  test "game#save: should set status to WAITING for new games" do
    g = Game.new
    assert g.save
    assert g.status == Game::STATUS_WAITING
  end

  test "game#set_ongoing: ongoing setter work" do
    g = Game.new
    assert g.save
    g.set_ongoing
    assert g.save
    assert g.status == Game::STATUS_ONGOING
  end

  test "game#set_cancelled: cancel setter work" do
    g = Game.new
    assert g.save
    g.set_cancelled
    assert g.save
    assert g.status == Game::STATUS_CANCELLED
  end

  test "game#set_ended(false): game ended before completion" do
    g = Game.new
    assert g.save
    g.set_ended
    assert g.save
    assert g.is_ended
    assert g.is_ended_before_completion
  end

  test "game#set_ended(true): game completed" do
    g = Game.new
    assert g.save
    g.set_ended(true)
    assert g.save
    assert g.is_ended
    assert_not g.is_ended_before_completion
  end

  test "game#readable_status" do
    g = Game.new
    assert g.save
    assert_equal g.readable_status, "waiting"

    g.set_cancelled
    assert g.save
    assert_equal g.readable_status, "cancelled"

    g.set_ongoing
    assert g.save
    assert_equal g.readable_status, "ongoing"

    g.set_ended
    assert g.save
    assert_equal g.readable_status, "ended-before-completion"

    g.set_ended(true)
    assert g.save
    assert_equal g.readable_status, "completed"
  end
end
