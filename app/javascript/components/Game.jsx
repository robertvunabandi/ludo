import React from "react"
import PropTypes from "prop-types"

import C from "utils/constants"
import H from "utils/helpers"
import PT from "utils/prop_types"
import positioning from "utils/positioning"
import GameBoard from "components/GameBoard"
import GameControlPane from "components/cp/GameControlPane"
import GamePiece from "components/GamePiece"
import Modal from "components/Modal"


export default class Game extends React.Component {
  static propTypes = {
    // game rules
    rules: PT.rules.isRequired,

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

    // This function tells the server to roll via player socket.
    // it takes no parameter since the actual rolling will be
    // performed in the server (to prevent cheating)
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
      display_rules: false,
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
      // - turn_participant_id (integer) is the id of the player
      //   whose turn it is
      // - is_my_turn (bool) is true when it's this player's turn
      // - is_rolling (bool) is true when it's time to roll first
      // - num_rolls (integer) represents the number of rolls the
      //   turn player has to do (at most 3)
      // - is_moving (bool) is true when it's time to perform an
      //   action for whoever's turn it is
      // - remaining_rolls (array[range(1..6)]) represents the
      //   rolls that are still left to play for whoever's turn it
      //   is
      is_turn_order_determination: true,
      turn_participant_id: null,
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
      //   to that. It's an object that has a color and an ID.
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
    this.viewRules = this.viewRules.bind(this)
    this.closeRules = this.closeRules.bind(this)

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
    const copies = Game._makeHistoryCopies(history, history_received)
    const fixed_state_update = Game._fixHistoryBoundary(
      copies.history, copies.history_received, this.props.players.length
    )

    // catch up on the history that we don't have by requesting it
    const max_turn = Math.max(...Object.keys(fixed_state_update.history_received))
    if (fixed_state_update.history.length < max_turn) {
      this.props.requestHistory(fixed_state_update.history.length)
    }
    this.setState(fixed_state_update)
  }

  static _makeHistoryCopies(history, history_received) {
    return {
      history: JSON.parse(JSON.stringify(history)),
      history_received: JSON.parse(JSON.stringify(history_received)),
    }
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

  static _fixHistoryBoundary(history, history_received, num_players) {
    // recursive case: if there is 0 in history_received, that has to move
    const r_turns = Object.keys(history_received).map(v => parseInt(v))
    if (r_turns.includes(0)) {
      const old_turn = history.length === 0
        ? {turn: 0, rolls: [], actions: []}
        : history[0]
      const new_turn = history_received[0]
      const h_zero = Game._completedHistory(old_turn, new_turn)
      // make sure there's a slot for zero
      history.length === 0 ? history.push(null) : null
      history[0] = h_zero
      delete history_received[0]
      return Game._fixHistoryBoundary(history, history_received, num_players)
    }

    // base case: no boundary elements, so nothing to do here
    const max_hist = history.length - 1
    if (!(r_turns.includes(max_hist) || r_turns.includes(max_hist + 1))) {
      return {history, history_received}
    }

    // recursive case: if we contain the boundary element, fix it
    if (r_turns.includes(max_hist)) {
      const old_turn = history[max_hist]
      const new_turn = history_received[max_hist]
      const completed = Game._completedHistory(old_turn, new_turn)
      history[max_hist] = completed
      delete history_received[max_hist]
      return Game._fixHistoryBoundary(history, history_received, num_players)
    }

    // check whether the boundary element seems satisfactory,
    // base case: if it's not, that means we're still waiting
    // on stuffs for its turn so we'd leave it at that
    if (!Game._isTurnSatisfactory(history[max_hist], num_players)) {
      return {history, history_received}
    }

    // now, it's good, check if we have received the next turn.
    // base case: if not, we stop here
    if (!r_turns.includes(max_hist + 1)) {
      return {history, history_received}
    }

    // recursive case: we have the next turn, fix it and i
    // add it to the history
    const old_turn = {turn: max_hist + 1, rolls: [], actions: []}
    const new_turn = history_received[max_hist + 1]
    const completed = Game._completedHistory(old_turn, new_turn)
    history.push(completed)
    delete history_received[max_hist + 1]
    return Game._fixHistoryBoundary(history, history_received, num_players)
  }

  static _isTurnSatisfactory(turn, num_players) {
    // check that each roll has a corresponding action basically
    if (turn.rolls.length === 0) {
      return false
    }
    // for turn order determination, this there are no actions
    if (turn.rolls.length > 0 && turn.turn < num_players) {
      return true
    }
    // no actions means not satisfactory otherwise
    if (turn.actions.length === 0) {
      return false
    }

    const rolls = H.flatten(turn.rolls.map(r => r.rolls))
    rolls.sort()
    const action_rolls = turn.actions.map(a => a.roll)
    action_rolls.sort()
    return H.isEqual(rolls, action_rolls)
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
    const my_color = H.playerWithId(this.props.players, this.props.my_id).color
    // can't select other piece's colors
    if (color !== my_color) {
      return
    }
    this.setState((state, props) => {
      if (!state.selected_piece) {
        return {selected_piece: {color, id: piece_id}}
      }
      const old_color = state.selected_piece.color
      const old_piece_id = state.selected_piece.id
      if (old_color === color && old_piece_id === piece_id) {
        return {selected_piece: null}
      }
      return {selected_piece: {color, id: piece_id}}
    })
  }

  viewRules() {
    this.setState({display_rules: true})
  }

  closeRules() {
    this.setState({display_rules: false})
  }

  render() {
    return <GameView
      side_length={this.state.side_length}
      my_id={this.props.my_id}
      players={this.props.players}
      history={this.state.history}
      rules={this.props.rules}
      {...getTurnFields(this.state)}
      handlePieceClick={this.handlePieceClick}
      display_rules={this.state.display_rules}
      viewRules={this.viewRules}
      closeRules={this.closeRules}
      sendRolls={this.props.sendRolls}
      sendAction={this.props.sendAction}
      finishTurn={this.props.finishTurn}
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
    const s_color = props.selected_piece.color
    const s_id = props.selected_piece.id
    pieces[s_color][s_id].selected = true
  }

  const top_height = props.side_length * 0.15
  const side_length = props.side_length * 0.85

  const rules_modal = props.display_rules
    ? makeRulesModal(props.rules, props.closeRules)
    : null

  return (
    <div>
      <GameControlPane
        height={top_height}
        my_id={props.my_id}
        side_length={side_length}
        players={props.players}
        pieces={pieces}
        rules={props.rules}
        history={props.history}
        {...getTurnFields(props)}
        viewRules={props.viewRules}
        sendRolls={props.sendRolls}
        sendAction={props.sendAction}
        finishTurn={props.finishTurn}
      />
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
      {rules_modal}
    </div>
  )
}

function getTurnFields(obj) {
  return {
    is_my_turn: obj.is_my_turn,
    turn_participant_id: obj.turn_participant_id,
    is_turn_order_determination: obj.is_turn_order_determination,
    is_rolling: obj.is_rolling,
    num_rolls: obj.num_rolls,
    is_moving: obj.is_moving,
    remaining_rolls: obj.remaining_rolls,
    turn: obj.turn,
    selected_piece: obj.selected_piece,
    last_roll: obj.last_roll,
    chosen_action: obj.chosen_action,
  }
}

function makeRulesModal(rules, closeRules) {
  // TODO: display the rules in a nice way... probably move this
  // into its own file.
  return (
    <Modal onClose={closeRules} padding={5} >
      {JSON.stringify(rules).replace(/,/g, ", ").replace(/:/g, ": ")}
    </Modal>
  )
}

