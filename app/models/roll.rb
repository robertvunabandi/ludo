class Roll < ApplicationRecord
  belongs_to :turn

  validates :turn, presence:true
  # NOTE: one must use Roll.hint_from_rolls for this
  validates :roll_hint, presence:true, :numericality => { :only_integer => true }

  MAX_DICE_COUNT = 3

  class HintValidator < ActiveModel::Validator
    def validate(record)
      valid_characters = "0123456"
      roll_hint_s = record.roll_hint.to_s
      if roll_hint_s.length != MAX_DICE_COUNT
        record.errors[:roll_hint] << (
          "The hint must be a 3 digit number (got: #{roll_hint_s})"
        )
      end
      roll_hint_s.each_char { |character|
        if !valid_characters.include? character
          record.errors[:roll_hint] << (
            "roll_hint contains invalid character that are not in "
            "the set {#{valid_characters}}"
          )
        end
      }
    end
  end

  validates_with HintValidator

  # The roll hint essentially tells us what the rolling was
  # it works the following way. If the rule says we have
  # only one dice, then rolling X would give us the
  # roll_hint "X00". If two dices and one rolls X and Y,
  # then we get "XY0". Finally, 3 dices of rolls X, Y, and
  # Z would give us "XYZ" integer with X <= Y <= Z.
  #
  # Examples:
  # - one dice, rolls a 5 => roll_hint: 500
  # - one dice, rolls a 3 => roll_hint: 300
  # - two dices, rolls [4, 1] => roll_hint: 410
  # - two dices, rolls [1, 6] => roll_hint: 160
  # - three dices, rolls [1, 4, 6] => roll_hint: 146
  # - three dices, rolls [6, 1, 4] => roll_hint: 614
  #
  # Note that while in the last 2 examples the roll_hint is
  # different, it still represents the same set of rolls.
  # order doesn't matter in this case.

  def self.hint_from_rolls(rolls)
    # rolls is an array of integers in the range [1..6]

    # append 7 twice to mitigate the maximum dice count
    # even though 7 is invalid, 7 represents zeros. when
    # sorting, we want the 7s at the end so that for
    # one or two dices, the zeros appear at the end
    for i in 1..2
      rolls << 7
    end
    valid_rolls = rolls[0..2].sort
    for i in 1..2
      if valid_rolls[i] == 7
        valid_rolls[i] = 0
      end
    end

    first = valid_rolls[0] * 100
    second = valid_rolls[1] * 10
    third = valid_rolls[2]
    return first + second + third
  end

  def self.rolls_from_hint(hint)
    # hint must be a string of length 3
    hints = hint.to_s
    first = hints[0].to_i
    second = hints[1].to_i
    if second == 0
      return [first]
    end
    third = hints[2].to_i
    return third == 0 ? [first, second] : [first, second, third]
  end
end
