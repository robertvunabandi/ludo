def is_array_subset?(array1, array2)
  if array2.length < array1.length
    return false
  end
  as1 = array1.sort
  as2 = array2.sort
  i = 0
  j = 0
  while true
    # in this case, all elements of array1 are accounted for
    if i >= as1.length
      return true
    end
    # not all elements are accounted for and we exhausted array2
    if j >= as2.length
      return false
    end
    # if account for the element at i, we just continue by incrementing both
    if as1[i] == as2[j]
      i += 1
      j += 1
      next
    end
    # short circuiting: we must account for element at i, so
    # if we don't find it, we're screwed. Since things are in
    # order, if the j's element is higher, then we can't find
    # the i's element
    if as1[i] < as2[j]
      return false
    end
    # we didn't account for element at i, move j up
    j += 1
  end
end

class Action < ApplicationRecord
  belongs_to :turn

  A_BEGIN = 'begin'
  A_MOVE = 'move'
  A_RESCUE = 'rescue'
  A_NULL = 'null'
  A_STOP = 'stop'
  ACTION_TO_NAME = {
    1 => A_BEGIN,
    2 => A_MOVE,
    3 => A_RESCUE,
    4 => A_NULL,
    5 => A_STOP,
  }
  NAME_TO_ACTION = ACTION_TO_NAME.invert
  def self.for(action_name)
    if !NAME_TO_ACTION.key? action_name
      return -1
    end
    return NAME_TO_ACTION[action_name]
  end

  VALID_ACTIONS = ACTION_TO_NAME.keys
  VALID_PIECES = [1, 2, 3, 4]
  VALID_ROLLS = [1, 2, 3, 4, 5, 6]

  validates :turn, presence:true
  validates(
    :action,
    presence: true,
    :numericality => { :only_integer => true},
    :inclusion => { :in => VALID_ACTIONS },
  )
  validates(
    :piece,
    presence: true,
    :numericality => { :only_integer => true},
    :inclusion => { :in => VALID_PIECES },
  )
  validates(
    :roll,
    presence:true,
    :numericality => { :only_integer => true},
    :inclusion => { :in => VALID_ROLLS },
  )

  class RollValidator < ActiveModel::Validator
    def validate(record)
      # a roll must exist in order to be able to store an action
      turn = record.turn
      rolls = turn.rolls

      if rolls.count == 0
        record.errors[:roll] << "there are no rolls for this action!"
      end

      # now, each action must have a corresponding, real roll,
      # including after adding this action
      actual_rolls = rolls.collect{ |r| Roll.rolls_from_hint(r.roll_hint) }.flatten
      # for some reason I have to select(:roll) in order for this
      # to work. I can't just collect it right away. Also, the
      # selection will include this record's roll, which is why
      # we don't add it to the actions_rolls
      actions_rolls = turn.actions.select(:roll).collect{ |a| a[:roll] }
      if !is_array_subset?(actions_rolls, actual_rolls)
        record.errors[:roll] << (
          "the roll for this record is invalid. it doesn't match the "
          "available rolls"
        )
      end
    end
  end

  validates_with RollValidator

  def action_name
    ACTION_TO_NAME[self.action]
  end
end
