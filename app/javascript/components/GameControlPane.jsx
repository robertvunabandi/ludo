import React from "react"
import PropTypes from "prop-types"

import C from "utils/constants"


export default class GameControlPane extends React.Component {
  static propTypes = {
    height: PropTypes.number.isRequired,
    side_length: PropTypes.number.isRequired,

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
    // TODO: make this required at some point
    viewRules: PropTypes.func,
  }

  static defaultProps = {
    turn_participant_id: null,
    remaining_rolls: null,
    turn: 0,
    selected_piece: null,
    chosen_action: null,

    viewRules: () => console.log("View rules clicked"),
  }

  constructor(props) {
    super(props)
  }

  render() {
    return <GameControlPaneView {...this.props} />
  }
}

/* TODO remove this comment block
Here are the different scenarios that could happen here (this would
help figure out how to display things):

A. we're in turn determination

1. it's my turn, and I am supposed to roll
   Here, I need to know how much everyone has rolled so that the
   result makes sense to me
2. it's not my turn, and they are rolling
   Here, I still need to know the above

B. we're not in turn determination

1. it's my turn, and:
   a. I am supposed to roll (first time rolling this turn)
   b. I am still rolling because I rolled a 6
   c. Now, I am completeting an action for one of my rolls
2. it's NOT my turn, so it's someone else's turn, and same subcases
   a, b, c above
*/

function GameControlPaneView(props) {
  const tp_text = props.is_my_turn
    ? "your"
    : playerWithId(props.players, props.turn_participant_id).username + "'s"
  const turn_person = (<b>{tp_text}</b>)

  const heightStyle = {height: props.height, maxHeight: props.height}
  const widthStyle = {
    width: props.side_length, maxWidth: props.side_length, ...heightStyle
  }

  return (
    <div id="game-control-pane" style={heightStyle}>
      <div id="gcp-inner" style={widthStyle}>
        <div id="gcp-round-and-rules" className="gcp-component">
          <div style={{fontSize: (props.height * 0.30) + 'px'}}>
            <div>ROUND {Math.floor(props.turn / props.players.length)}</div>
          </div>
          <div style={{fontSize: (props.height * 0.25) + 'px'}}>
            <span className="btn" onClick={props.viewRules}>view rules</span>
          </div>
        </div>
        <div id="gcp-player-indicators" className="gcp-component">
          PLAYER INDICATORS
        </div>
        <div id="gcp-instructions" className="gcp-component">
          It's {turn_person} turn!
        </div>
        <div id="gcp-action" className="gcp-component">
          ACTION
        </div>
        <div id="gcd-rolls" className="gcp-component">
          ROLLS
        </div>
      </div>
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
