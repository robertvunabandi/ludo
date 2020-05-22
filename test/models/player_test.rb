require 'test_helper'

class PlayerTest < ActiveSupport::TestCase
  test "player#save: should save up to 4 players" do
    g = Game.create
    pc1 = Participant.create
    pc2 = Participant.create
    pc3 = Participant.create
    pc4 = Participant.create

    p1 = Player.create(game: g, participant: pc1)
    assert p1.valid?
    p2 = Player.create(game: g, participant: pc2)
    assert p2.valid?
    p3 = Player.create(game: g, participant: pc3)
    assert p3.valid?
    p4 = Player.create(game: g, participant: pc4)
    assert p4.valid?
  end

  test "player#save: fails to save on more than 4 players" do
    g = Game.create
    pc1 = Participant.create
    pc2 = Participant.create
    pc3 = Participant.create
    pc4 = Participant.create
    pc5 = Participant.create
    pc6 = Participant.create
    p1 = Player.create(game: g, participant: pc1)
    assert p1.valid?
    p2 = Player.create(game: g, participant: pc2)
    assert p2.valid?
    p3 = Player.create(game: g, participant: pc3)
    assert p3.valid?
    p4 = Player.create(game: g, participant: pc4)
    assert p4.valid?

    p5 = Player.create(game: g, participant: pc5)
    assert_not p5.valid?
    p6 = Player.create(game: g, participant: pc6)
    assert_not p6.valid?
  end

  test "player#is_host: first player should be host" do
    g = Game.create
    pc1 = Participant.create
    pc2 = Participant.create
    pc3 = Participant.create
    p1 = Player.create(game: g, participant: pc1)
    p2 = Player.create(game: g, participant: pc2)
    p3 = Player.create(game: g, participant: pc3)

    assert p1.is_host
  end

  test "player#is_host: non-first players aren't host" do
    g = Game.create
    pc1 = Participant.create
    pc2 = Participant.create
    pc3 = Participant.create
    pc4 = Participant.create
    p1 = Player.create(game: g, participant: pc1)
    p2 = Player.create(game: g, participant: pc2)
    p3 = Player.create(game: g, participant: pc3)
    p4 = Player.create(game: g, participant: pc4)
    assert_not p2.is_host
    assert_not p3.is_host
    assert_not p4.is_host
  end
end
