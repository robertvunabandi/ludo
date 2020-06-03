import React from "react"
import PropTypes from "prop-types"

import C from "utils/constants"
import H from "utils/helpers"
import positioning from "utils/positioning"
import GameBoard from "components/GameBoard"
import GamePiece from "components/GamePiece"


const ValidDiceCounts = [1, 2, 3]
const RollAfterSixCondition = {Any: "any", All: "all"}
const RollAfterSixConditions = Object.values(RollAfterSixCondition)
const GraduationLaneModel =  {
  NoRestriction: "no-restriction",
  Strict: "strict",
  StrictAfterEntry: "strict-after-entry",
}
const GraduationLaneModels = Object.values(GraduationLaneModel)


export default class Game extends React.Component {
  static propTypes = {
    // game rules
    rules: PropTypes.shape({
      dice_count: PropTypes.oneOf(ValidDiceCounts).isRequired,
      roll_after_six: PropTypes.bool.isRequired,
      roll_after_six_condition: PropTypes.oneOf(RollAfterSixConditions).isRequired,
      allow_square_doubling: PropTypes.bool.isRequired,
      capture_into_prison: PropTypes.bool.isRequired,
      graduation_lane_model: PropTypes.oneOf(GraduationLaneModels).isRequired,
      roll_six_to_graduate: PropTypes.bool.isRequired,
    }).isRequired,

    // the participant id of the player that is playing this
    // game in this instance
    my_id: PropTypes.number.isRequired,

    // This is a mapping from player color to player
    // participant id. Red is always the host, and there will
    // always be two available because we need at least two
    // players to play the game. If there's only two, the
    // opponent will be yellow. If there's 3, the 3 colors in
    // play will be red, green, and yellow. This also
    // implicitly gives us the number of players.
    players: PropTypes.arrayOf(PropTypes.shape({
      color: PropTypes.string.isRequired,
      is_host: PropTypes.bool.isRequired,
      participant_id: PropTypes.number.isRequired,
      username: PropTypes.string.isRequired,
    })).isRequired,

    // This function sends all the rolls to the server for this
    // player via socket. This takes a list of integers that
    // represents the rolls that this player has done. If the
    // roll contains sixes, based on the game rules, the player
    // may roll again through another sendRolls, function (the
    // player will know after rendering is over) the total
    // number of rolls is determined by the game rules
    sendRolls: PropTypes.func.isRequired,
    // This is a function that will send a given, nicely
    // formatted action back to the socket. This function takes
    // an object of the form {roll: R, action: A, piece: P}
    // where A is one of {begin, move, rescue, null, stop} and
    // R must be in the list of remaining_rolls and piece is
    // one of {1, 2, 3, 4} (this move accept a specific piece).
    // If the action is 'null' or 'stop', then the piece is
    // null.
    sendAction: PropTypes.func.isRequired,
    // This is a function that is done when one's performed is
    // done. it takes no parameters
    finishTurn: PropTypes.func.isRequired,
    // In order to prevent passing the entire socket over, we
    // use this function to set the history received function
    // handler. After all, any history change is mainly affected
    // within the game and not outside. So, this function is
    // called to set the history function handler to something
    // that the Game uses when we receive history. See
    // handleReceiveHistory
    setHistoryFunction: PropTypes.func.isRequired,
    // similar to setHistoryFunction, this function sets the
    // function that receives the turn information since those
    // two would be given at different times.
    setTurnInfoFunction: PropTypes.func.isRequired,
    // in some cases, we may be missing some history. This
    // function is used to request it. it only takes the index
    // of the requested history. Nothing will happen if the
    // index is above the max so far.
    requestHistory: PropTypes.func.isRequired,
    // similar to the above, this one asks for the last history.
    // This can be used to ensure that we're in sync.
    requestMaxHistory: PropTypes.func.isRequired,
    // in some cases, we may be missing the turn info or it may
    // not have arrived (such as at the begining of the game).
    // This function is used to request it
    requestTurnInfo: PropTypes.func.isRequired,
  }

  static defaultProps = {}

  static REQUEST_MAX_HISTORY_INTERVAL = 4000

  constructor(props) {
    super(props)

    this.state = {
      side_length: this.props.getSideLength(),
      // GAME HISTORY
      // we maintain the game history in the history array
      // and the history_received array. history is ordered,
      // and will be what is used to display the pieces.
      // history_received is for caching for histories we've
      // already received that are above what is available in
      // history.
      history: [],
      history_received: {},

      // TURN INFO
      // We need to know whose turn it is in order to perform
      // moves. we keep track of it in the following sets of
      // variables.
      // - is_turn_order_determination (bool) represents whether
      //   we're determining the order of whose to play. we do
      //   this by rolling the dices at the beginning of the game
      //   and whoever gets highest win.
      // - is_my_turn (bool) is true when it's this player's turn
      // - is_rolling (bool) is true when it's time to roll first
      // - num_rolls (integer) represents the number of rolls the
      //   turn player has to do (at most 3)
      // - is_moving (bool) is true when it's time to perform an
      //   action for whoever's turn it is
      // - remaining_rolls (array[range(1..6)]) represents the
      //   rolls that are still left to play for whoever's turn it
      //   is
      is_turn_order_determination: false,
      is_my_turn: false,
      num_rolls: 0,
      is_rolling: false,
      is_moving: false,
      remaining_rolls: null,

      // GAME CONTROLS
      // For things pertaining to what's happening in the game
      // - last_roll: when it's time to roll, the roll that this
      //   player made last time
      // - selected_piece: after rolling, the player selects a piece
      //   and is presented with a set of actions. This is pertaining
      //   to that.
      // - chosen_action: an action that the player would like to do
      //   for the piece they selected and action they chose
      selected_piece: null,
      last_roll: null,
      chosen_action: null,
    }

    this.handleReceiveHistory = this.handleReceiveHistory.bind(this)
    this.props.setHistoryFunction(this.handleReceiveHistory)

    this.handleReceiveTurnInfo = this.handleReceiveTurnInfo.bind(this)
    this.props.setTurnInfoFunction(this.handleReceiveTurnInfo)

    this.handlePieceClick = this.handlePieceClick.bind(this)

    this.resizeBasedOnWindow = this.resizeBasedOnWindow.bind(this)
    window.addEventListener("resize", this.resizeBasedOnWindow)


    this.props.requestMaxHistory()
    this.props.requestTurnInfo()

    // to ensure we're up to date, we request this every this much
    // milliseconds intervals
    // TODO: this can be kind of dangerous because it'll just
    // bombard the server... maybe request only when unsure?
    // I'm keeping this commented out until I see a benefit from
    // it.
    // setInterval(this.props.requestMaxHistory, Game.REQUEST_MAX_HISTORY_INTERVAL)
  }

  handleReceiveHistory(received) {
    const history = this.state.history
    const history_received = this.state.history_received

    // Are we receiving something beyond the correctly formed
    // history? check if we already have it. if we don't, store
    // it. if we do, check if what we got is complete and
    // complete it if not.
    const new_turn = {
      turn: received.turn, rolls: received.rolls, actions: received.actions
    }
    // since the code inside this if block would be the same as
    // the one outside, we define this `source` variable to store
    // where we're grabbing the old_turn from.
    const source = received.turn >= history.length ? history_received : history

    // special case of when received.turn is beyond history.length
    if (received.turn >= history.length && (!(received.turn in history_received))) {
      history_received[received.turn] = new_turn
      this.updateHistory(history, history_received)
      return
    }

    const old_turn = source[received.turn]
    if (Game._sameHistory(old_turn, new_turn)) {
      return
    }
    source[received.turn] = Game._completedHistory(old_turn, new_turn)
    this.updateHistory(history, history_received)
  }

  updateHistory(history, history_received) {
    const fixed_state_update = Game._fixHistoryBoundary(
      history, history_received
    )

    // catch up on the history that we don't have by requesting it
    const max_turn = Math.max(...Object.keys(fixed_state_update.history_received))
    if (fixed_state_update.history.length < max_turn) {
      this.props.requestHistory(fixed_state_update.history.length)
    }
    this.setState(fixed_state_update)
  }

  static _sameHistory(old_turn, new_turn) {
    if (old_turn.turn !== new_turn.turn) {
      return false
    }
    old_turn.rolls.sort(H.keySorter("roll_id"))
    new_turn.rolls.sort(H.keySorter("roll_id"))
    if (!H.isEqual(old_turn.rolls, new_turn.rolls)) {
      return false
    }
    old_turn.actions.sort(H.keySorter("action_id"))
    new_turn.actions.sort(H.keySorter("action_id"))
    if (!H.isEqual(old_turn.actions, new_turn.actions)) {
      return false
    }
    return true
  }

  static _completedHistory(old_turn, new_turn) {
    // Precondition: the turns are the same
    const rolls = []
    const found_rolls = new Set()
    old_turn.rolls.push(...new_turn.rolls)
    old_turn.rolls.forEach(roll => {
      if (found_rolls.has(roll.roll_id)) {
        return
      }
      rolls.push(roll)
      found_rolls.add(roll.roll_id)
    })

    const actions = []
    const found_actions = new Set()
    old_turn.actions.push(...new_turn.actions)
    old_turn.actions.forEach(action => {
      if (found_actions.has(action.action_id)) {
        return
      }
      actions.push(action)
      found_actions.add(action.action_id)
    })
    return {turn: old_turn.turn, rolls, actions}
  }

  static _fixHistoryBoundary(history, history_received) {
    // TODO: fix history recursively!
    return {history, history_received}
  }

  handleReceiveTurnInfo(turn_info) {
    const turn_participant_id = parseInt(turn_info.turn_participant_id)
    this.setState({
      is_my_turn: turn_participant_id === this.props.my_id,
      turn_participant_id,
      is_turn_order_determination: turn_info.is_turn_order_determination,
      is_rolling: turn_info.is_rolling,
      num_rolls: turn_info.num_rolls,
      is_moving: turn_info.is_moving,
      remaining_rolls: turn_info.remaining_rolls,
      turn: turn_info.turn,
    })
  }

  resizeBasedOnWindow() {
    const side_length = this.props.getSideLength()

    // update the state only if the side length has changed
    this.setState((state, props) => {
      if (state.side_length !== side_length) {
        return {side_length}
      }
      return {}
    })
  }

  handlePieceClick(color, piece_id) {
    this.setState((state, props) => {
      if (!state.selected_piece) {
        return {selected_piece: [color, piece_id]}
      }
      const [old_color, old_piece_id] = state.selected_piece
      if (old_color === color && old_piece_id === piece_id) {
        return {selected_piece: null}
      }
      return {selected_piece: [color, piece_id]}
    })
  }

  render() {
    const turn_fields = {
      is_my_turn: this.state.is_my_turn,
      turn_participant_id: this.state.turn_participant_id,
      is_turn_order_determination: this.state.is_turn_order_determination,
      is_rolling: this.state.is_rolling,
      num_rolls: this.state.num_rolls,
      is_moving: this.state.is_moving,
      remaining_rolls: this.state.remaining_rolls,
      turn: this.state.turn,
      selected_piece: this.state.selected_piece,
      last_roll: this.state.last_roll,
      chosen_action: this.state.chosen_action,
    }
    return <GameView
      side_length={this.state.side_length}
      players={this.props.players}
      history={this.state.history}
      rules={this.props.rules}
      {...turn_fields}
      handlePieceClick={this.handlePieceClick}
    />
  }
}

function GameView(props) {
  const color_to_username = {}
  props.players.forEach(p => {
    color_to_username[p.color] = p.username
  })
  // for now, naive strategy, based on the history, we figure out
  // where the pieces currently are.
  const pieces = positioning.getPiecesPositionsFromHistory(
    props.history, props.rules, Object.keys(color_to_username)
  )
  const pieces_array = []
  Object.keys(pieces).forEach(color => {
    [1, 2, 3, 4].forEach(piece_id => {
      pieces_array.push(pieces[color][piece_id])
    })
  })
  // if a piece is selected, make it selected
  if (props.selected_piece) {
    const [s_color, s_id] = props.selected_piece
    pieces[s_color][s_id].selected = true
  }

  const top_height = props.side_length * 0.08
  const side_length = props.side_length * 0.92

  // TODO: we should just create a ControlPane component
  return (
    <div>
      <div
        id="game-control-pane"
        style={{height: top_height, maxHeight: top_height}}>
        Control Pane!
      </div>
      <svg
        width={side_length} height={side_length} id="game-wrapper"
      >
        <GameBoard
          side_length={side_length}
          color_to_username={color_to_username}
        />
        {pieces_array.map((piece, index) => <GamePiece
          key={index}
          side_length={side_length}
          piece={piece}
          handleOnClick={props.handlePieceClick}
        />)}
      </svg>
    </div>
  )
}

