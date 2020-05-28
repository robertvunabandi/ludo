import React from "react"
import PropTypes from "prop-types"

import C from "utils/constants"
import GameBoard from "components/GameBoard"


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

    // when true, it means we're trying to determine who goes
    // first at the beginning of the game. the server will
    // determine the order based on rules (these will be
    // communicated to the front end).
    is_turn_order_determination: PropTypes.bool.isRequired,
    // Whether it's this player's turn. If it is, they get
    // to roll first and then they can send their moves to
    // the socket
    turn_info: PropTypes.shape({
      // if this is false, all other fields are null
      is_my_turn: PropTypes.bool.isRequired,
      // if this is true, is_my_turn is true and the
      // other fields are false and null respectively.
      // note that if `is_turn_order_determination` is true,
      // then it means we're in the beginning of the game
      // and thus these rolls aren't used for moving.
      is_rolling: PropTypes.bool,
      // if this is true, is_my_turn is true, is_rolling
      // is false, and there must be at least one element
      // in the remaining_rolls array
      is_moving: PropTypes.bool,
      // This contains the rolls that this player has yet
      // to move. If it's not null, it has the same condition
      // as is_moving when it's true.
      remaining_rolls: PropTypes.arrayOf(PropTypes.number),
    }).isRequired,

    // This function sends all the rolls to the server for
    // this player via socket. This takes a list of integers
    // that represents the rolls that this player has done.
    // If the roll contains sixes, based on the game rules,
    // the player may roll again through another sendRolls,
    // function (the player will know after rendering is over)
    // the total number of rolls is determined by the game rules
    sendRolls: PropTypes.func.isRequired,
    // This is a function that will send a given, nicely
    // formatted action back to the socket. This function takes
    // an object of the form {roll: R, action: A, piece: P}
    // where A is one of {begin, move, rescue, null, stop} and
    // R must be in the list of remaining_rolls and piece is one
    // of {1, 2, 3, 4} (this move accept a specific piece).
    // If the action is 'null' or 'stop', then the piece is null.
    sendAction: PropTypes.func.isRequired,
    // In order to prevent passing the entire socket over, we use
    // this function to set the history received function handler.
    // After all, any history change is mainly affected within the
    // game and not outside. So, this function is called to set
    // the history function handler to something that the Game uses
    // when we receive history. See handleReceiveHistory
    setHistoryFunction: PropTypes.func.isRequired,
    // in some cases, we may be missing some history. This function
    // is used to request it. it only takes the index of the
    // requested history. Nothing will happen if the index is above
    // the max so far.
    requestHistory: PropTypes.func.isRequired,
    // similar to the above, this one asks for the last history. This
    // can be used to ensure that we're in sync.
    requestMaxHistory: PropTypes.func.isRequired,
  }

  static defaultProps = {}

  static REQUEST_MAX_HISTORY_INTERVAL = 4000

  constructor(props) {
    super(props)

    this.state = {
      side_length: this.props.getSideLength(),
      // The game history is maintained by this
      history: [],
      history_received: {},
      max_index: -1,
    }

    this.handleReceiveHistory = this.handleReceiveHistory.bind(this)
    this.props.setHistoryFunction(this.handleReceiveHistory)

    this.resizeBasedOnWindow = this.resizeBasedOnWindow.bind(this)
    window.addEventListener("resize", this.resizeBasedOnWindow)

    // to ensure we're up to date, we request this every this much
    // milliseconds intervals
    // TODO: this can be kind of dangerous because it'll just
    // bombard the server... maybe request only when unsure?
    // I commented this out for now while we're in development
    // setInterval(this.props.requestMaxHistory, Game.REQUEST_MAX_HISTORY_INTERVAL)
  }

  handleReceiveHistory(history) {
    // TODO: implement this based on the logic above
    // if we receive something we already have, we ignore it
    // if we receive something that's next of what we have, we
    //   store it and update view (done automatically)
    // if we receive something that's more than what is next of
    //   what we have, we request all the missing histories but
    //   still store it. We use history_received as the source
    //   of truth for all we have. history instead will be
    //   nicely ordered. then, we use that to display the game.
    console.log(history)
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

  render() {
    return <GameView
      side_length={this.state.side_length}
      players={this.props.players}
      history={this.state.history}
      rules={this.props.rules}
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
  const pieces = getPiecesPositionsFromHistory(
    props.history, props.rules, Object.keys(color_to_username)
  )

  return (
    <>
      <GameBoard
        side_length={props.side_length}
        color_to_username={color_to_username}
      />
    </>
  )
}

function getPiecesPositionsFromHistory(history, rules, available_colors) {
  const pieces = getStartingPositions(available_colors)
  // TODO: do something with rules and history
  return pieces
}

function getStartingPositions(available_colors) {
  // TODO: implement this function
  return {}
}

