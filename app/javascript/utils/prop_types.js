import PropTypes from "prop-types"

import C from "utils/constants"


const PT = {}

PT.action = PropTypes.oneOf(C.ACTIONS)
PT.piece = PropTypes.oneOf([1, 2, 3, 4])
PT.roll = PropTypes.oneOf([1, 2, 3, 4, 5, 6])

PT.players = PropTypes.arrayOf(PropTypes.shape({
  color: PropTypes.string.isRequired,
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
    piece: PropTypes.number.isRequired,
    roll: PropTypes.number.isRequired,
  })),
}))

export default PT
