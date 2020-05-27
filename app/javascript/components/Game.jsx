import React from "react"
import PropTypes from "prop-types"

import C from "utils/constants"
import GameArea from "components/GameArea"
import GameCenter from "components/GameCenter"
import GameHouse from "components/GameHouse"


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

    // This is a mapping from player color to player
    // participant id. Red is always the host, and there will
    // always be two available because we need at least two
    // players to play the game. If there's only two, the
    // opponent will be yellow. If there's 3, the 3 colors in
    // play will be red, green, and yellow. This also
    // implicitly gives us the number of players.
    mappings: PropTypes.shape({
      red: PropTypes.number.isRequired,
      green: PropTypes.number,
      yellow: PropTypes.number,
      blue: PropTypes.number,
    }).isRequired,

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
  }

  static defaultProps = {}

  // OTHER STATIC FIELDS

  static BLUE = "blue"
  static RED = "red"
  static GREEN = "green"
  static YELLOW = "yellow"
  static COLORS = ["red", "green", "yellow", "blue"]

  constructor(props) {
    super(props)

    this.state = {
      // TODO: maybe it's better to pass the side length function
      // from the props
      side_length: Game._getSideLength(),
      num_players: Game._numPlayers(props.mappings),
    }

    this.resizeBasedOnWindow = this.resizeBasedOnWindow.bind(this)

    window.addEventListener("resize", this.resizeBasedOnWindow)
  }

  static _getSideLength() {
    const titleHeight = document.querySelector(".title").clientHeight
    const smallest_length = Math.min(window.innerHeight, window.innerWidth)
    return smallest_length - titleHeight - 50
  }

  static _numPlayers(mappings) {
    const filter = color => ((typeof mappings[color]) === "number")
    return Game.COLORS.filter(filter).length
  }

  resizeBasedOnWindow() {
    const side_length = Game._getSideLength()

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
      mappings={this.props.mappings}
    />
  }
}

function GameView(props) {
  const square_width = props.side_length / 15
  const house_side_length = square_width * 6
  const house_push = props.side_length - house_side_length
  return (
    <svg
      width={props.side_length} height={props.side_length} id="game-wrapper"
    >
      <GameHouse
        color={C.color.BLUE}
        side_length={house_side_length}
        square_side_length={square_width}
        left_push={0}
        top_push={0}
        username={"Anonymous"}
        textPosition={C.direction.UP}
      />
      <GameHouse
        color={C.color.RED}
        side_length={house_side_length}
        square_side_length={square_width}
        left_push={house_push}
        top_push={0}
        username={"Anonymous-923"}
        textPosition={C.direction.UP}
      />
      <GameHouse
        color={C.color.GREEN}
        side_length={house_side_length}
        square_side_length={square_width}
        left_push={house_push}
        top_push={house_push}
        username={"robertv-sample-user"}
        textPosition={C.direction.DOWN}
      />
      <GameHouse
        color={C.color.YELLOW}
        side_length={house_side_length}
        square_side_length={square_width}
        left_push={0}
        top_push={house_push}
        username={"JustTestingUsernamesL"}
        textPosition={C.direction.DOWN}
      />
      <GameArea
        color={C.color.RED}
        direction={C.direction.DOWN}
        left_push={house_side_length}
        top_push={0}
        square_side_length={square_width}
      />
      <GameArea
        color={C.color.GREEN}
        direction={C.direction.LEFT}
        left_push={house_push}
        top_push={house_side_length}
        square_side_length={square_width}
      />
      <GameArea
        color={C.color.YELLOW}
        direction={C.direction.UP}
        left_push={house_side_length}
        top_push={house_push}
        square_side_length={square_width}
      />
      <GameArea
        color={C.color.BLUE}
        direction={C.direction.RIGHT}
        left_push={0}
        top_push={house_side_length}
        square_side_length={square_width}
      />
      <GameCenter
        left_push={house_side_length}
        top_push={house_side_length}
        side_length={square_width * 3}
      />
    </svg>
  )
}

