require 'test_helper'

class ParticipantTest < ActiveSupport::TestCase
  test "participant#create: Username start is default if not set" do
    p = Participant.create
    puts p.errors.full_messages
    assert p.save
    assert p.valid?
    assert p.username.start_with?(Participant::DEFAULT_USERNAME_START)
  end

  test "participant#create: Username is what is given" do
    p = Participant.create(username: "AppleJUice")
    assert p.save
    assert p.valid?
    assert_equal "AppleJUice", p.username
  end

  test "participant#create: Username must have minimum length" do
    p = Participant.create(username: "a")
    assert_not p.save
    assert_not p.valid?
  end
end
