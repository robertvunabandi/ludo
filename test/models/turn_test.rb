require 'test_helper'

class TurnTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
  test "Turn#next_turn: should be 0 when there are no turns" do
    g = Game.create
    assert g.save
    assert_equal 0, Turn.next_turn(g)
  end

  test "Turn#next_turn: should be 1 more than the max turn" do
    g = Game.create
    assert g.save
    t = Turn.create(game: g, turn: 10)
    assert t.save
    assert_equal 11, Turn.next_turn(g)
  end

  test "Turn#create_next_turn: turn creations are in order starting from 0" do
    g = Game.create
    assert g.save
    t0 = Turn.create_next_turn(g)
    assert t0.save
    assert_equal 0, t0.turn
    t1 = Turn.create_next_turn(g)
    assert t1.save
    assert_equal 1, t1.turn
    t2 = Turn.create_next_turn(g)
    assert t2.save
    assert_equal 2, t2.turn
    t3 = Turn.create_next_turn(g)
    assert t3.save
    assert_equal 3, t3.turn
  end
end
