require 'test_helper'

def same_elements?(array1, array2)
  array1.to_set == array2.to_set
end

class RollTest < ActiveSupport::TestCase
  test "Roll#hint_from_rolls" do
    assert [100].include? Roll.hint_from_rolls([1])
    assert [200].include? Roll.hint_from_rolls([2])
    assert [300].include? Roll.hint_from_rolls([3])
    assert [400].include? Roll.hint_from_rolls([4])
    assert [500].include? Roll.hint_from_rolls([5])
    assert [600].include? Roll.hint_from_rolls([6])
    assert [650, 560].include? Roll.hint_from_rolls([6, 5])
    assert [440].include? Roll.hint_from_rolls([4, 4])
    assert [344, 434, 443].include? Roll.hint_from_rolls([4, 3, 4])
    assert [135, 153, 315, 351, 513, 531].include? Roll.hint_from_rolls([5, 3, 1])
  end

  test "Roll#rolls_from_hint" do
    assert same_elements?([1], Roll.rolls_from_hint(100))
    assert same_elements?([1, 2], Roll.rolls_from_hint(120))
    assert same_elements?([1, 2], Roll.rolls_from_hint(210))
    assert same_elements?([1, 2, 3], Roll.rolls_from_hint(213))
    assert same_elements?([1, 2, 3], Roll.rolls_from_hint(231))
    assert same_elements?([1, 2, 3], Roll.rolls_from_hint(312))
    assert same_elements?([3, 6, 1], Roll.rolls_from_hint(316))
  end
end
