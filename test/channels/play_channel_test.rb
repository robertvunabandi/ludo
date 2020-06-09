require "test_helper"

class PlayChannelTest < ActionCable::Channel::TestCase
  test "PlayChannel#get_unaccounted_rolls (1)" do
    unaccounted_rolls = PlayChannel.get_unaccounted_rolls(
      [], [6]
    )
    e_count = 1
    e_value = [6]
    assert_equal e_count, unaccounted_rolls.count
    assert_equal e_value, unaccounted_rolls.sort
  end

  test "PlayChannel#get_unaccounted_rolls (2)" do
    unaccounted_rolls = PlayChannel.get_unaccounted_rolls(
      [6], [6]
    )
    e_count = 0
    e_value = []
    assert_equal e_count, unaccounted_rolls.count
    assert_equal e_value, unaccounted_rolls.sort
  end

  test "PlayChannel#get_unaccounted_rolls (3)" do
    unaccounted_rolls = PlayChannel.get_unaccounted_rolls(
      [1], [1, 4, 6]
    )
    e_count = 2
    e_value = [4, 6]
    assert_equal e_count, unaccounted_rolls.count
    assert_equal e_value, unaccounted_rolls.sort
  end

  test "PlayChannel#get_unaccounted_rolls (4)" do
    unaccounted_rolls = PlayChannel.get_unaccounted_rolls(
      [], [3, 3, 5, 6]
    )
    e_count = 4
    e_value = [3, 3, 5, 6]
    assert_equal e_count, unaccounted_rolls.count
    assert_equal e_value, unaccounted_rolls.sort
  end

  test "PlayChannel#get_unaccounted_rolls (5)" do
    unaccounted_rolls = PlayChannel.get_unaccounted_rolls(
      [1, 2, 3, 4], [1, 2, 3, 4]
    )
    e_count = 0
    e_value = []
    assert_equal e_count, unaccounted_rolls.count
    assert_equal e_value, unaccounted_rolls.sort
  end

  test "PlayChannel#get_unaccounted_rolls (6)" do
    unaccounted_rolls = PlayChannel.get_unaccounted_rolls(
      [1, 3, 4], [1, 2, 3, 4]
    )
    e_count = 1
    e_value = [2]
    assert_equal e_count, unaccounted_rolls.count
    assert_equal e_value, unaccounted_rolls.sort
  end

  test "PlayChannel#get_unaccounted_rolls (7)" do
    unaccounted_rolls = PlayChannel.get_unaccounted_rolls(
      [3, 4, 6, 6], [1, 2, 3, 4, 6, 6, 6, 6]
    )
    e_count = 4
    e_value = [1, 2, 6, 6]
    assert_equal e_count, unaccounted_rolls.count
    assert_equal e_value, unaccounted_rolls.sort
  end

  test "PlayChannel#get_unaccounted_rolls (8)" do
    unaccounted_rolls = PlayChannel.get_unaccounted_rolls(
      [], [5, 6]
    )
    e_count = 2
    e_value = [5, 6]
    assert_equal e_count, unaccounted_rolls.count
    assert_equal e_value, unaccounted_rolls.sort
  end

  test "PlayChannel#get_unaccounted_rolls (9)" do
    unaccounted_rolls = PlayChannel.get_unaccounted_rolls(
      [], []
    )
    e_count = 0
    e_value = []
    assert_equal e_count, unaccounted_rolls.count
    assert_equal e_value, unaccounted_rolls.sort
  end

  test "PlayChannel#get_unaccounted_rolls (10)" do
    unaccounted_rolls = PlayChannel.get_unaccounted_rolls(
      [], [1, 5]
    )
    e_count = 2
    e_value = [1, 5]
    assert_equal e_count, unaccounted_rolls.count
    assert_equal e_value, unaccounted_rolls.sort
  end

  test "PlayChannel#get_unaccounted_rolls raises exception (1)" do
    assert_raise(Exception) {
      unaccounted_rolls = PlayChannel.get_unaccounted_rolls(
        [1, 2, 2], [4, 5, 6]
      )
    }
  end

  test "PlayChannel#get_unaccounted_rolls raises exception (2)" do
    assert_raise(Exception) {
      unaccounted_rolls = PlayChannel.get_unaccounted_rolls(
        [1, 2, 2], [1, 2, 3]
      )
    }
  end
end
