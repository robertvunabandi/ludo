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

  test "game#is_expired: newly created game should not be expired" do
    g = Game.create
    assert g.save
    assert_not g.is_expired
  end

  test "game#is_expired: old games in waiting status are expired" do
    g = Game.create
    assert g.save

    backtime = 10 * Game::MAX_WAIT_TIME_MIN * Game::SECONDS_IN_MINUTES
    g.created_at = g.created_at - backtime
    assert g.save

    assert g.is_expired
  end

  test "game#is_expired: expired games are also expired" do
    g = Game.create
    assert g.save

    g.status = Game::STATUS_CANCELLED_BY_EXPIRATION
    assert g.save

    assert g.is_expired
  end

  test "game#is_expired: game in other statuses can't be expired" do
    g = Game.create
    assert g.save

    backtime = 10 * Game::MAX_WAIT_TIME_MIN * Game::SECONDS_IN_MINUTES
    g.created_at = g.created_at - backtime
    assert g.save

    invalid_status_for_test = [
      Game::STATUS_CANCELLED_BY_EXPIRATION, Game::STATUS_WAITING
    ]

    for status in Game::VALID_STATUSES
      if invalid_status_for_test.include? status
        next
      end
      g.status = status
      g.save
      assert_not g.is_expired
    end
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
