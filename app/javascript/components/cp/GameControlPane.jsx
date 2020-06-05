import React from "react"
import PropTypes from "prop-types"

import C from "utils/constants"
import H from "utils/helpers"
import PT from "utils/prop_types"

import Dice from "components/Dice"

import GCPRoundAndRules from "./GCPRoundAndRules"
import GCPPlayerIndicators from "./GCPPlayerIndicators"


export default class GameControlPane extends React.Component {
  static propTypes = {
    height: PropTypes.number.isRequired,
    side_length: PropTypes.number.isRequired,
    my_id: PropTypes.number.isRequired,

    // same as in Game.jsx
    players: PT.players.isRequired,
    history: PT.history.isRequired,

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
      action: PT.action, piece: PT.piece, roll: PT.roll.isRequired
    }),

    // TODO: we need methods to send last roll and chosen actions up the chain
    viewRules: PropTypes.func.isRequired,
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

    this.state = {
      // an array of the form [roll_id, index]
      selected_roll: null,
    }

    this.selectRoll = this.selectRoll.bind(this)
  }

  selectRoll(roll_selection) {
    this.setState({selected_roll: roll_selection})
  }

  render() {
    return <GameControlPaneView
      {...this.props}
      {...this.state}
      selectRoll={this.selectRoll} />
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
  //
  // OVERALL
  //
  const heightStyle = {height: props.height, maxHeight: props.height}
  const widthStyle = {
    width: props.side_length, maxWidth: props.side_length, ...heightStyle
  }

  // ROUNDS
  const round = Math.floor(props.turn / props.players.length)

  // PLAYERS INDICATOR: nothing to do here

  //
  // INSTRUCTIONS
  //
  const tp_text = props.is_my_turn
    ? "your"
    : playerWithId(props.players, props.turn_participant_id).username + "'s"
  const turn_person = (<b>{tp_text}</b>)
  // TODO: adjust instructions based on what it's supposed to be
  const instruction = props.is_my_turn
    ? <span id="gcp-i-inner">It's {turn_person} turn!</span>
    : <span id="gcp-i-inner">It's {turn_person} turn! WAIT until they are done.</span>

  //
  // ACTION
  //
  // TODO: make this action adjust to whatever we are doing
  // TODO: also, when it's not my turn, the action stuff shouldn't show up
  function actionClick() {
    console.log("clicked on action!")
  }

  //
  // ROLLS
  //
  const gcp_dice_width = props.height / 2.6
  const my_color = playerWithId(props.players, props.my_id).color
  // const [s_id, s_index] = props.selected_roll
  const my_rolls = getMyRolls(props.history, props.selected_roll)
  const gcp_rolls = my_rolls.map((r, i) => (
    <Dice
      key={i}
      width={props.height / 2.6}
      value={r.roll}
      accent_color={my_color}
      roll_id={[r.id, r.index]}
      selected={r.selected}
      onClick={props.selectRoll} />
  ))

  return (
    <div id="game-control-pane" style={heightStyle}>
      <div id="gcp-inner" style={widthStyle}>
        <GCPRoundAndRules
          height={props.height}
          round={round}
          viewRules={props.viewRules} />
        <GCPPlayerIndicators
          is_turn_order_termination={props.is_turn_order_determination}
          height={props.height}
          players={props.players}
          history={props.history}
          round={round} />
        <div id="gcp-instructions" className="gcp-component">
          {instruction}
        </div>
        {!props.is_my_turn ? null : <>
          <div
            id="gcp-action"
            className="gcp-component"
            onClick={actionClick}
            style={{lineHeight: props.height + "px"}}>
            ACTION
          </div>
          <div id="gcd-rolls" className="gcp-component">
            {gcp_rolls}
          </div>
        </>
        }
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

function getMyRolls(history, selected_roll) {
  if (history.length === 0) {
    return []
  }
  const rolls = history[history.length - 1].rolls
  if (rolls.length === 0) {
    return []
  }
  const actual_rolls = []
  const [s_id, s_index] = !!selected_roll ? selected_roll : [-1, -1]
  rolls.forEach(rs => {
    rs.rolls.forEach((r, i) => {
      actual_rolls.push({
        roll: r,
        id: rs.roll_id,
        index: i,
        selected: (s_id === rs.roll_id) && (s_index === i),
      })
    })
  })
  return actual_rolls
}

