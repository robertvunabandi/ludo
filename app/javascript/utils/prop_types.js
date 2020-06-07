import PropTypes from "prop-types"

import C from "utils/constants"


const PT = {}

PT.color = PropTypes.oneOf(C.COLORS)
PT.action = PropTypes.oneOf(C.ACTIONS)
PT.piece = PropTypes.oneOf([1, 2, 3, 4])
PT.roll = PropTypes.oneOf([1, 2, 3, 4, 5, 6])

PT.players = PropTypes.arrayOf(PropTypes.shape({
  color: PT.color.isRequired,
  is_host: PropTypes.bool.isRequired,
  participant_id: PropTypes.number.isRequired,
  username: PropTypes.string.isRequired,
}))

PT.history = PropTypes.arrayOf(PropTypes.shape({
  turn: PropTypes.number.isRequired,
  rolls: PropTypes.arrayOf(PropTypes.shape({
    roll_id: PropTypes.number.isRequired,
    rolls: PropTypes.arrayOf(PT.roll).isRequired,
  })),
  actions: PropTypes.arrayOf(PropTypes.shape({
    action_id: PropTypes.number.isRequired,
    action: PT.action.isRequired,
    piece: PT.piece.isRequired,
    roll: PT.roll.isRequired,
  })),
}))

// for rules
const ValidDiceCounts = [1, 2, 3]
const RollAfterSixCondition = {Any: "any", All: "all"}
const RollAfterSixConditions = Object.values(RollAfterSixCondition)
const GraduationLaneModel =  {
  NoRestriction: "no-restriction",
  Strict: "strict",
  StrictAfterEntry: "strict-after-entry",
}
const GraduationLaneModels = Object.values(GraduationLaneModel)
PT.rules = PropTypes.shape({
  dice_count: PropTypes.oneOf(ValidDiceCounts).isRequired,
  roll_after_six: PropTypes.bool.isRequired,
  roll_after_six_condition: PropTypes.oneOf(RollAfterSixConditions).isRequired,
  allow_square_doubling: PropTypes.bool.isRequired,
  capture_into_prison: PropTypes.bool.isRequired,
  graduation_lane_model: PropTypes.oneOf(GraduationLaneModels).isRequired,
  roll_six_to_graduate: PropTypes.bool.isRequired,
}),

export default PT
