import React from "react"
import PropTypes from "prop-types"

import C from "utils/constants"
import H from "utils/helpers"
import PT from "utils/prop_types"
import positioning from "utils/positioning"

import PieceState from "utils/piece_state"

import Dice from "components/Dice"

import GCPRoundAndRules from "./GCPRoundAndRules"
import GCPPlayerIndicators from "./GCPPlayerIndicators"


export default class GameControlPane extends React.Component {
  static propTypes = {
    height: PropTypes.number.isRequired,
    side_length: PropTypes.number.isRequired,
    my_id: PropTypes.number.isRequired,

    // same as in Game.jsx for those that are in props
    players: PT.players.isRequired,
    pieces: PT.pieces.isRequired,
    rules: PT.rules.isRequired,
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
    selected_piece: PropTypes.shape({
      color: PT.color.isRequired,
      id: PropTypes.number.isRequired,
    }),
    last_roll: PropTypes.arrayOf(PropTypes.number),
    chosen_action: PropTypes.shape({
      action: PT.action, piece: PT.piece, roll: PT.roll.isRequired
    }),

    viewRules: PropTypes.func.isRequired,
    // same as in Game.jsx
    sendRolls: PropTypes.func.isRequired,
    sendAction: PropTypes.func.isRequired,
    finishTurn: PropTypes.func.isRequired,
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

    this.state = {
      // an array of the form [roll_id, index]
      selected_roll: null,
    }

    this.selectRoll = this.selectRoll.bind(this)
    this.getActioning = this.getActioning.bind(this)
    this._getActioningNotMyTurn = this._getActioningNotMyTurn.bind(this)
    this._getTurnDeterminationActioning = this._getTurnDeterminationActioning.bind(this)
    this._getActioningRolling = this._getActioningRolling.bind(this)
    this._getActioningDoneWithTurn = this._getActioningDoneWithTurn.bind(this)
    this._endTurn = this._endTurn.bind(this)
  }

  selectRoll(roll_selection) {
    this.setState({selected_roll: roll_selection})
  }

  getActioning() {
    if (!this.props.is_my_turn) {
      return this._getActioningNotMyTurn()
    }

    // now it's my turn
    if (this.props.is_turn_order_determination) {
      return this._getTurnDeterminationActioning()
    }
    if (this.props.is_rolling) {
      return this._getActioningRolling()
    }


    const my_color = playerWithId(this.props.players, this.props.my_id).color
    const can_still_perform_actions = positioning.hasPossibleMoves(
      this.props.pieces, my_color, this.props.remaining_rolls, this.props.rules
    )
    if (!can_still_perform_actions) {
      // TODO: we still have to send STOP actions
      console.log("NO POSSIBLE MOVES!!! DIDN'T SENT NULL ACTIONS")
      return this._getActioningDoneWithTurn()
    }

    const instruction = (
      <span id="gcp-i-inner">
        It's your turn. Now, select a roll, then select a piece, to perform
        an action with it. There is at most one possible action per piece per
        roll.
      </span>
    )
    const action_text = "PERFORM"
    // TODO: implement this function
    const actionFunction = () => console.log(
      "Action", this.props.selected_piece, this.state.selected_roll
    )
    return {instruction, action_text, actionFunction}
  }

  _getActioningNotMyTurn() {
    const turn_player = playerWithId(
      this.props.players, this.props.turn_participant_id
    )
    const instruction = (
      <span id="gcp-i-inner">
        It's {turn_player.username}'s turn. WAIT until it's your turn.
      </span>
    )
    const action_text = ""
    const actionFunction = () => null
    return {instruction, action_text, actionFunction}
  }

  _getTurnDeterminationActioning() {
    // assume it's my turn
    // if it's time to roll, let the player roll
    if (this.props.is_rolling) {
      const instruction = (
        <span id="gcp-i-inner">
          <b>Turn Order Determination:</b> It's your turn! Right now
          we're just determining turn order. The order of playing will be
          based on how much you roll this round. Roll when you're ready!
        </span>
      )
      const action_text = "ROLL"

      let rolled = false
      const actionFunction = (function roll() {
        if (rolled) {
          return
        }
        rolled = true
        // rolling will happen in the server
        this.props.sendRolls()
      }).bind(this)
      return {instruction, action_text, actionFunction}
    }

    // we have rolled, have a button to click on to finish the turn
    const instruction = (
      <span id="gcp-i-inner">
        <b>Turn Order Determination:</b> there are your rolls. Press OK
        to finish your turn.
      </span>
    )
    const action_text = "OK"
    const actionFunction = this._endTurn
    return {instruction, action_text, actionFunction}
  }

  _getActioningRolling() {
    // assume my turn and we're rolling
    const turn = this.props.history[this.props.turn]
    const rolling_again = GameControlPane._rollingAgain(turn)
    const instruction = (
      <span id="gcp-i-inner">
        It's your turn.
        {rolling_again ? "You rolled a six! " : ""}
        Time to roll {rolling_again ? "again" : ""}!
      </span>
    )
    const action_text = "ROLL"
    const actionFunction = this.props.sendRolls
    return {instruction, action_text, actionFunction}
  }

  static _rollingAgain(turn) {
    // assumes we're rolling
    if ((!turn) || (!turn.rolls)) {
      return false
    }
    // since we're already rolling, we got to roll again by
    // virtue of having rolled a 6
    return H.flatten(turn.rolls.map(r => r.rolls)).includes(6)
  }

  _getActioningDoneWithTurn() {
    const instruction = (
      <span id="gcp-i-inner">
        There's no more possible actions to do. Press OK
        to finish your turn.
      </span>
    )
    const action_text = "OK"
    const actionFunction = this._endTurn
    return {instruction, action_text, actionFunction}
  }

  _endTurn() {
    this.props.finishTurn()
  }

  render() {
    return <GameControlPaneView
      {...this.props}
      {...this.state}
      {...this.getActioning()}
      selectRoll={this.selectRoll} />
  }
}

function GameControlPaneView(props) {
  // OVERALL
  const heightStyle = {height: props.height, maxHeight: props.height}
  const widthStyle = {
    width: props.side_length, maxWidth: props.side_length, ...heightStyle
  }

  // ROUNDS
  const round = Math.floor(props.turn / props.players.length)

  // PLAYERS INDICATOR: nothing to do here

  // INSTRUCTIONS & ACTION
  const {instruction, actionFunction, action_text} = props

  // ROLLS
  const gcp_dice_width = props.height / 2.6
  const my_color = playerWithId(props.players, props.my_id).color
  const my_rolls = getMyRolls(props.history, props.turn, props.selected_roll)
  const gcp_rolls = my_rolls.filter(r => !r.used).map((r, i) => (
    <Dice
      key={i}
      width={props.height / 2.6}
      value={r.roll}
      accent_color={my_color}
      roll_id={[r.id, r.index, r.roll]}
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
          {props.instruction}
        </div>
        {!props.is_my_turn ? null :(<>
          <div
            id="gcp-action"
            className="gcp-component"
            onClick={actionFunction}
            style={{lineHeight: props.height + "px"}}>
            {action_text}
          </div>
          <div id="gcd-rolls" className="gcp-component">
            {gcp_rolls}
          </div>
        </>)}
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

function getMyRolls(history, turn, selected_roll) {
  if (history.length === 0 || !history[turn]) {
    return []
  }
  const rolls = history[turn].rolls
  if (rolls.length === 0) {
    return []
  }
  const actual_rolls = []
  const [s_id, s_index] = !!selected_roll ? selected_roll : [-1, -1]

  // we want to make use that we remove rolls that we mark rolls that
  // we have already used, but we don't want to mark duplicates twice
  // so, the isRollUsed will check against a list of rolls that are
  // used and remove from there.
  const used_rolls = !!turn.actions ? turn.actions.map(a => a.roll) : []

  rolls.forEach(rs => {
    rs.rolls.forEach((r, i) => {
      actual_rolls.push({
        roll: r,
        id: rs.roll_id,
        index: i,
        selected: (s_id === rs.roll_id) && (s_index === i),
        used: isRollUsed(r, used_rolls),
      })
    })
  })
  return actual_rolls
}

function isRollUsed(r, used_rolls) {
  if (used_rolls.includes(r)) {
    used_rolls.splice(used_rolls.indexOf(r), 1)
    return true
  }
  return false
}

