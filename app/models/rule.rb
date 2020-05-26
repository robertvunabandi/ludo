# Game can have multiple rules, but each rule has its own specifcation.
# This file will define the various rules: their names, valid values,
# default values, and specifications. The code below will ensure that
# the rules are respected. Note that the reason we have it as name +
# value is that this scales better in case we add new rules, and the
# values are integers, which allow all kinds of mapping from integer
# to values.
#
# Rules are defined in code below, inside the class.
#
# NOTES on the rules below:
# - We defined the rules in code because that's safer from bugs (if we
#   change the code, no need to change comments)
# - BOOLEAN, if it's not obvious enough, just means 0 is false
#   and 1 is true.
# - For non boolean valid values with only 2 possibilities, we used
#   numbers other than [0, 1] to not confuse them with booleans.
# - The 'select' field in the specs is used for displaying the
#   selection in the form. It's a mapping from something a human may
#   select to an actual value.

class Rule < ApplicationRecord
  belongs_to :game

  # DEFINING RULES AND HANDLING THEIR VALIDATIONS
  VALID_RULE_NAMES = [
    # This rule specifies the number of dices in the game.
    'dice_count',

    # This rule says whether one continues rolling if they get a 6
    'roll_after_six',

    # This rule specifies when to roll after six.
    'roll_after_six_condition',

    # This rules specifies whether to allow two of the same pieces
    # to be superimposed.
    'allow_square_doubling',

    # This rule specifies whether captures work by moving players into
    # prison first and then moving them into one's home back. To get out
    # of prison, one must roll a 6, which allows them to bring them back
    # into their home. They need to roll anotehr 6 to get out of home as
    # usual. If not given, captures simply work by moving the player
    # into their home.
    'capture_into_prison',

    # This rule specifies how graduation lane works. That is, the lane
    # colored in a player's color.
    'graduation_lane_model',

    # Once one is in the graduation section, this specifies whether they
    # must roll another six to actually graduate.
    'roll_six_to_graduate',
  ]
  BOOLEAN_SELECT = {'yes': 1, 'no': 0}
  # TODO: Maybe in the future, set the default value for each rule to be
  #       the most widely used variant?
  RULE_SPECS = {
    # each value represents the actual number of dices.
    'dice_count' => {
      'valid': [1, 2, 3],
      'default': 2,
      'select': {'1': 1, '2': 2, '3': 3},
      'description': 'Select number of dices to play with',
    },

    # BOOLEAN
    'roll_after_six' => {
      'valid': [0, 1],
      'default': 1,
      'select': BOOLEAN_SELECT,
      'description': 'Allow rolling after a player gets a 6',
    },

    # 1 means continue rolling for each six you get (i.e., you get 2
    # out of 3 sixes, then you roll 2 more dices, not all 3, in a 3
    # dices game).
    # 2 means you have to roll all sixes to continue rolling.
    'roll_after_six_condition' => {
      'valid': [1, 2],
      'default': 1,
      'select': {'any': 1, 'all': 2},
      'description': 'Select how rolling after getting a 6 roll. \'all\' means all your rolls must be a six to roll again. \'any\' means for each six, you roll that dice again',
    },

    # BOOLEAN
    'allow_square_doubling' => {
      'valid': [0, 1],
      'default': 1,
      'select': BOOLEAN_SELECT,
      'description': 'Select whether to allow two pieces from the same player to be superimposed',
    },

    # BOOLEAN
    'capture_into_prison' => {
      'valid': [0, 1],
      'default': 0,
      'select': BOOLEAN_SELECT,
      'description': 'Make it such that if you capture someone, they go to prison first, from which you must roll a 6 in order to bring them out into your home.',
    },

    # 1 means players can just move up the lane without restriction,
    # the same way they've been moving all along.
    # 2 means to move to square 1, you must roll a 1. To square 2, you
    # must roll a 2. To square 3, you must roll a 3. In addition, you
    # must get to square zero first.
    # 3 means same as 2 except you don't have to get to square 0. I.e.,
    # if you're 3 squares from square 1 and you roll a 3, you can
    # automatically enter square 1.
    'graduation_lane_model' => {
      'valid': [1, 2, 3],
      'default': 3,
      'select': {'no-restriction': 1, 'strict': 2, 'strict-after-entry': 3},
      'description': 'Select how graduation works. With no restriction, you can roll anything to move up the graduation late. With \'strict\', one must roll a 1 to move to the first cell, then 2 for the second cell, and so on. In addition, they must first get to the zero-th cell. \'strict-after-entry\' is the same as strict except you can get directly into the first cell from any roll',
    },

    # BOOLEAN
    'roll_six_to_graduate' => {
      'valid': [0, 1],
      'default': 1,
      'select': BOOLEAN_SELECT,
      'description': 'Select whether you want players to roll a 6 in order to actually graduate (as opposed to just reaching the top of the graduation lane)',
    },
  }
  validates :game, presence: true
  validates :name, presence: true, :inclusion => {:in => VALID_RULE_NAMES}

  class ValueValidator < ActiveModel::Validator
    def validate(record)
      if !VALID_RULE_NAMES.include? record.name
        record.errors[:value] << (
          "invalid rule value (#{record.value}) due to invalid rule " \
          "name (#{record.name})"
        )
        return
      end
      if !RULE_SPECS[record.name][:valid].include? record.value
        record.errors[:value] << "invalid value for #{record.name}"
      end
    end
  end
  validates_with ValueValidator

  # 'dice_count'
  # 'roll_after_six'
  # 'roll_after_six_condition'
  # 'allow_square_doubling'
  # 'capture_into_prison'
  # 'graduation_lane_model'
  # 'roll_six_to_graduate'
end
