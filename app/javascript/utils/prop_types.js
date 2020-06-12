import PropTypes from "prop-types"

import C from "utils/constants"
import PieceState from "utils/piece_state"


const PT = {}

PT.color = PropTypes.oneOf(C.COLORS)
PT.action = PropTypes.oneOf(C.ACTIONS)
PT.piece = PropTypes.oneOf([1, 2, 3, 4])
PT.roll = PropTypes.oneOf([1, 2, 3, 4, 5, 6])

PT.player = PropTypes.shape({
  color: PT.color.isRequired,
  is_host: PropTypes.bool.isRequired,
  participant_id: PropTypes.number.isRequired,
  username: PropTypes.string.isRequired,
})
// This is a mapping from player color to player
// participant id. Red is always the host, and there will
// always be two available because we need at least two
// players to play the game. If there's only two, the
// opponent will be yellow. If there's 3, the 3 colors in
// play will be red, green, and yellow. This also
// implicitly gives us the number of players.
PT.players = PropTypes.arrayOf(PT.player)

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
})

PT.subpieces = PropTypes.shape({
  1: PropTypes.instanceOf(PieceState).isRequired,
  2: PropTypes.instanceOf(PieceState).isRequired,
  3: PropTypes.instanceOf(PieceState).isRequired,
  4: PropTypes.instanceOf(PieceState).isRequired,
})
PT.pieces = PropTypes.shape({
  [C.color.RED]: PT.subpieces.isRequired,
  [C.color.GREEN]: PT.subpieces,
  [C.color.YELLOW]: PT.subpieces,
  [C.color.BLUE]: PT.subpieces,
})

export default PT
