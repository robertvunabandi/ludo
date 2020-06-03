import React from "react"
import PropTypes from "prop-types"

import C from "utils/constants"


export default class GameControlPane extends React.Component {
  static propTypes = {
    height: PropTypes.number.isRequired,

    // same as in Game.jsx
    players: PropTypes.arrayOf(PropTypes.shape({
      color: PropTypes.string.isRequired,
      is_host: PropTypes.bool.isRequired,
      participant_id: PropTypes.number.isRequired,
      username: PropTypes.string.isRequired,
    })).isRequired,

    // all of these are state fields of Game.jsx, see there for info
    is_my_turn: PropTypes.bool.isRequired,
    turn_participant_id: PropTypes.number,
    is_turn_order_determination: PropTypes.bool.isRequired,
    is_rolling: PropTypes.bool.isRequired,
    num_rolls: PropTypes.number.isRequired,
    is_moving: PropTypes.bool.isRequired,
    remaining_rolls: PropTypes.arrayOf(PropTypes.number),
    turn: PropTypes.number,
    selected_piece: PropTypes.arrayOf(PropTypes.number),
    last_roll: PropTypes.arrayOf(PropTypes.number),
    chosen_action: PropTypes.shape({
      action: PropTypes.oneOf(C.ACTIONS),
      piece: PropTypes.oneOf([1, 2, 3, 4]),
      roll: PropTypes.number.isRequired,
    }),

    // TODO: we need methods to send last roll and chosen actions up the chain
  }

  static defaultProps = {
    turn_participant_id: null,
    remaining_rolls: null,
    turn: 0,
    selected_piece: null,
    chosen_action: null,
  }

  constructor(props) {
    super(props)
  }

  render() {
    return <GameControlPaneView {...this.props} />
  }
}

function GameControlPaneView(props) {
  const tp_text = props.is_my_turn
    ? "your"
    : playerWithId(props.players, props.turn_participant_id).username + "'s"
  const turn_person = <b>{tp_text}</b>

  return (
    <div
      id="game-control-pane"
      style={{height: props.height, maxHeight: props.height}}>
      It's {turn_person} turn!
    </div>
  )
}

function playerWithId(players, participant_id) {
  if (!players) {
    return {}
  }
  for (const player of players) {
    if (player.participant_id === participant_id) {
      return player
    }
  }
  return {}
}
