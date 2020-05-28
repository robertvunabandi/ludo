import React from "react"
import PropTypes from "prop-types"

import C from "utils/constants"
import GameArea from "components/GameArea"
import GameCenter from "components/GameCenter"
import GameHouse from "components/GameHouse"


/**
 * This component will simply represent the board. It just displays
 * things and nothing else. It does contain the name of the users
 * that are playing the game.
 */
export default class GameBoard extends React.Component {
  static propTypes = {
    side_length: PropTypes.number.isRequired,
    color_to_username: PropTypes.shape({
      [C.color.RED]: PropTypes.string,
      [C.color.GREEN]: PropTypes.string,
      [C.color.YELLOW]: PropTypes.string,
      [C.color.BLUE]: PropTypes.string,
    }).isRequired,
  }

  static defaultProps = {}

  render() {
    return <GameBoardView {...this.props} />
  }
}

function GameBoardView(props) {
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
        username={props.color_to_username[C.color.BLUE]}
        textPosition={C.direction.UP}
      />
      <GameHouse
        color={C.color.RED}
        side_length={house_side_length}
        square_side_length={square_width}
        left_push={house_push}
        top_push={0}
        username={props.color_to_username[C.color.RED]}
        textPosition={C.direction.UP}
      />
      <GameHouse
        color={C.color.GREEN}
        side_length={house_side_length}
        square_side_length={square_width}
        left_push={house_push}
        top_push={house_push}
        username={props.color_to_username[C.color.GREEN]}
        textPosition={C.direction.DOWN}
      />
      <GameHouse
        color={C.color.YELLOW}
        side_length={house_side_length}
        square_side_length={square_width}
        left_push={0}
        top_push={house_push}
        username={props.color_to_username[C.color.YELLOW]}
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

