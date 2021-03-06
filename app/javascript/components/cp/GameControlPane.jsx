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
      // an array of the form [roll_id, index, roll]
      selected_roll: null,
    }

    this.selectRoll = this.selectRoll.bind(this)
    this.getActioning = this.getActioning.bind(this)
    this._getActioningNotMyTurn = this._getActioningNotMyTurn.bind(this)
    this._getTurnDeterminationActioning = this._getTurnDeterminationActioning.bind(this)
    this._getActioningRolling = this._getActioningRolling.bind(this)
    this._getActioningDoneWithTurn = this._getActioningDoneWithTurn.bind(this)
    this._getActioningAction = this._getActioningAction.bind(this)
    this._endTurn = this._endTurn.bind(this)

    this._hasValidActions = this._hasValidActions.bind(this)
    this._isValidSelectedRoll = this._isValidSelectedRoll.bind(this)
    this._getValidActions = this._getValidActions.bind(this)
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

    return this._getActioningAction()
  }

  _getActioningNotMyTurn() {
    const turn_player = H.playerWithId(
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
        It's your turn.{" "}
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

  _getActioningAction() {
    const my_color = H.playerWithId(this.props.players, this.props.my_id).color
    const can_still_perform_actions = positioning.hasPossibleMoves(
      this.props.pieces, my_color, this.props.remaining_rolls, this.props.rules
    )
    if (!can_still_perform_actions) {
      // if there are still rolls, clicking on OK will clear them
      // out in the server
      return this._getActioningDoneWithTurn()
    }

    let message = "It's your turn: "
    if (!this.state.selected_roll) {
      message += "(*) Select a roll. "
    }
    if (!this.props.selected_piece) {
      message += "(*) Select a piece. "
    }

    const has_valid_actions = this._hasValidActions()
    const ready_to_perform = this._isValidSelectedRoll() && this.props.selected_piece
    if (ready_to_perform && has_valid_actions) {
      message += (
        "Now press \"PERFORM\". There is at most one possible " +
        "action per piece and per roll."
      )
    }
    if (ready_to_perform && !has_valid_actions) {
      message += (
        "There are no valid moves for that selection... Try another one."
      )
    }
    const instruction = <span id="gcp-i-inner">{message}</span>
    const action_text = "PERFORM"
    const actionFunction = () => {
      if (!(ready_to_perform && has_valid_actions)) {
        return
      }
      const valid_actions = this._getValidActions()
      console.assert(valid_actions.length === 1)
      const {action} = valid_actions[0]
      this.props.sendAction(action)
      // deselect the roll that we just sent
      this.setState({selected_roll: null})
    }
    return {
      instruction, action_text, actionFunction,
      disabled_action: !(ready_to_perform && has_valid_actions),
    }
  }

  _hasValidActions() {
    if (!this.props.selected_piece || !this.state.selected_roll) {
      return false
    }
    return this._getValidActions().length > 0
  }

  _isValidSelectedRoll() {
    const my_rolls = getMyRolls(
      this.props.history, this.props.turn, this.state.selected_roll
    )
    return my_rolls.filter(r => r.selected).length > 0
  }

  _getValidActions() {
    const {color, id} = this.props.selected_piece
    const roll = this.state.selected_roll[2]
    return positioning.getValidActions(
      this.props.pieces, color, id, roll, this.props.rules
    )
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
    // used to deselect roll here, but that was causing problems
    // so now we just check if the roll selected is indeed valid
    // before doing stuffs with it
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
  const denominator = props.is_my_turn ? 6.5 : 5
  const height_style = {height: props.height, maxHeight: props.height}
  const width_style = {width: props.side_length, maxWidth: props.side_length}
  // INNER
  const inner_height = props.height * 4/denominator
  const inner_height_style = {height: inner_height, maxHeight: inner_height}

  // ROUNDS
  const round = Math.floor(props.turn / props.players.length)

  // PLAYERS INDICATOR: nothing to do here

  // INSTRUCTIONS & ACTION
  const {instruction, actionFunction, action_text, disabled_action} = props
  H.addEnterKeyEventListener(actionFunction)

  // ROLLS
  // TODO: this can really be cleaned up and moved to its own component
  const rolls_height = props.height * 1.5 / denominator
  const rolls_height_style = {height: rolls_height, maxHeight: rolls_height}
  const dice_width = rolls_height * 0.99
  const my_color = H.playerWithId(props.players, props.my_id).color
  const my_rolls = getMyRolls(props.history, props.turn, props.selected_roll)
  const gcp_rolls = my_rolls.filter(r => !r.used).map((r, i) => (
    <Dice
      key={i}
      width={dice_width}
      value={r.roll}
      accent_color={my_color}
      roll_id={[r.id, r.index, r.roll]}
      selected={r.selected}
      onClick={props.selectRoll} />
  ))
  const selection_rolls = my_rolls
    .filter(r => !r.used)
    .map(r => [r.id, r.index, r.roll])
  const selected_roll_index_obj = my_rolls
    .filter(r => !r.used)
    .map((r, i) => [r.selected, i])
    .filter(([selected, index]) => selected)
  const selected_roll_index = selected_roll_index_obj.length > 0
    ? selected_roll_index_obj[0][1]
    : -1
  H.addLeftKeyEventListener(() => {
    const max_index = selection_rolls.length - 1
    if (selected_roll_index === -1) {
      props.selectRoll(selection_rolls[max_index])
      return
    }
    const index = selected_roll_index === 0
      ? max_index
      : selected_roll_index - 1
    props.selectRoll(selection_rolls[index])
  })
  H.addRightKeyEventListener(() => {
    const max_index = selection_rolls.length - 1
    if (selected_roll_index === -1) {
      props.selectRoll(selection_rolls[0])
      return
    }
    const index = selected_roll_index === max_index
      ? 0
      : selected_roll_index + 1
    props.selectRoll(selection_rolls[index])
  })

  return (
    <div id="game-control-pane" style={height_style}>
      <GCPRoundAndRules
        height={props.height / denominator}
        width={props.side_length}
        style={{...width_style}}
        round={round}
        viewRules={props.viewRules} />

      <div id="gcp-inner" style={{...width_style, ...inner_height_style}}>
        <GCPPlayerIndicators
          is_turn_order_determination={props.is_turn_order_determination}
          height={inner_height}
          players={props.players}
          history={props.history}
          round={round} />
        <div id="gcp-instructions" className="gcp-component">
          {props.instruction}
        </div>
        {!props.is_my_turn ? null :(<>
        <div
          id="gcp-action"
          className={`gcp-component${disabled_action ? " disabled" : ""}`}
          onClick={actionFunction}
          style={{lineHeight: inner_height + "px"}}>
          {action_text}
        </div>
        </>)}
      </div>

      {!props.is_my_turn ? null :(<>
      <div
        id="gcp-rolls"
        className="gcp-component"
        style={{...width_style, ...rolls_height_style}}>
        <div style={{...rolls_height_style, lineHeight: rolls_height + "px"}}>
          {gcp_rolls}
        </div>
      </div>
      </>)}
    </div>
  )
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
  const actions = history[turn].actions
  const used_rolls = !!actions ? actions.map(a => a.roll) : []

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

