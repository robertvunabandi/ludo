require 'test_helper'

class ActionTest < ActiveSupport::TestCase
  test "Action#create: fails if there are no rolls" do
    g = Game.create
    assert g.valid?
    t = Turn.create_next_turn(g)
    assert t.valid?
    for roll in 1..6
      for piece in 1..4
        a = Action.create(
          turn: t, action: Action.for(Action::A_BEGIN), piece: piece, roll: roll
        )
        assert_not a.valid?
      end
    end
  end

  test "Action#create: fails if roll in action doesn't match rolls for turn" do
    g = Game.create
    assert g.valid?
    t = Turn.create_next_turn(g)
    assert t.valid?
    r = Roll.create(turn: t, roll_hint: 600)
    assert r.valid?
    for roll in 1..5
      for piece in 1..4
        a = Action.create(
          turn: t, action: Action.for(Action::A_BEGIN), piece: piece, roll: roll
        )
        assert_not a.valid?
      end
    end
  end

  test "Action#create: works for valid rolls" do
    g = Game.create
    assert g.valid?
    t = Turn.create_next_turn(g)
    assert t.valid?
    r = Roll.create(turn: t, roll_hint: 643)
    a = Action.create(
      turn: t, action: Action.for(Action::A_BEGIN), piece: 1, roll: 6
    )
    assert a.valid?
    a = Action.create(
      turn: t, action: Action.for(Action::A_MOVE), piece: 1, roll: 4
    )
    assert a.valid?
    a = Action.create(
      turn: t, action: Action.for(Action::A_MOVE), piece: 1, roll: 3
    )
    assert a.valid?
  end

  test "Action#create: fails after all rolls matched up" do
    g = Game.create
    assert g.valid?
    t = Turn.create_next_turn(g)
    assert t.valid?
    r = Roll.create(turn: t, roll_hint: 643)
    a = Action.create(
      turn: t, action: Action.for(Action::A_BEGIN), piece: 1, roll: 6
    )
    assert a.valid?
    a = Action.create(
      turn: t, action: Action.for(Action::A_MOVE), piece: 2, roll: 4
    )
    assert a.valid?
    a = Action.create(
      turn: t, action: Action.for(Action::A_MOVE), piece: 3, roll: 3
    )
    assert a.valid?
    for roll in [6, 4, 3]
      a = Action.create(
        turn: t, action: Action.for(Action::A_MOVE), piece: 1, roll: roll
      )
      assert_not a.valid?
    end
  end
end
