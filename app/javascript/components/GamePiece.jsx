import React from "react"
import PropTypes from "prop-types"

import C from "utils/constants"
import PieceState from "utils/piece_state"


const PIECE_RADIUS_PCT = 0.80


export default class GamePiece extends React.Component {
  static propTypes = {
    side_length: PropTypes.number.isRequired,
    piece: PropTypes.instanceOf(PieceState).isRequired,
    // a function that takes in the piece's color and piece's id
    handleOnClick: PropTypes.func,
  }

  static defaultProps = {
    handleOnClick: (color, piece_id) => console.log(color, piece_id),
  }

  constructor(props) {
    super(props)

    this.handleClick = this.handleClick.bind(this)
  }

  handleClick(event) {
    // cannot selected graduated pieces
    if (this.props.piece.isGraduated()) {
      return
    }
    const piece_id = event.target.parentNode.id
    const [_, color, id] = piece_id.split("-")
    this.props.handleOnClick(color, parseInt(id))
  }

  render() {
    return <GamePieceView {...this.props} handleClick={this.handleClick}/>
  }
}

function GamePieceView(props) {
  const [x, y, radius] = pieceLocation(props.piece, props.side_length)
  // TODO: I gotta do the whole onclick event thing
  // this is temporary, I wanna do a square instead
  const grad_radius = radius * 0.60
  const grad_circle = <circle
    cx={x}
    cy={y}
    r={grad_radius}
    stroke={C.color.WHITE}
    strokeWidth={C.stroke.width}
    fill={C.color.GRADUATION}
  />

  return (
    <g
      id={`piece-${props.piece.color}-${props.piece.id}`}
      className={"piece" + (props.piece.selected ? " selected" : "")}
      onClick={props.handleClick}
    >
      <circle
        cx={x}
        cy={y}
        r={radius}
        stroke={C.stroke.COLOR}
        strokeWidth={C.stroke.width}
        fill={props.piece.color}
      />
      {props.piece.isGraduated() ? grad_circle : null}
    </g>
  )
}

function pieceLocation(piece, side_length) {
  const square_width = side_length / 15
  const house_side_length = square_width * 6
  const house_push = side_length - house_side_length
  const piece_radius = getPieceRadius(square_width)
  const house_radius = square_width * 2

  if (piece.isHome() || piece.isGraduated()) {
    const x_base = square_width * 2.15
    const y_base = square_width * 2.15
    const x_house_push = C.RIGHT_HOUSE_COLORS.includes(piece.color) ? house_push : 0
    const y_house_push = C.BOTTOM_HOUSE_COLORS.includes(piece.color) ? house_push : 0
    const x_push = C.RIGHT_PIECE_IDS.includes(piece.id) ? square_width * 1.8 : 0
    const y_push = C.BOTTOM_PIECE_IDS.includes(piece.id) ? square_width * 1.8 : 0
    return [
      x_base + x_house_push + x_push,
      y_base + y_house_push + y_push,
      piece_radius,
    ]
  }

  // when captured, the pieces are placed around the home of
  // the capturer. this is gonna be very mathematical to figure
  // out the position. so, the following is just trying to find
  // the position around the piece.
  if (piece.isCaptured()) {
    const capturing_index = getCapturingIndex(piece)
    const angle = capturing_index * 22.5
    const hyp = piece_radius + house_radius
    const x_from_house_center = hyp * Math.abs(Math.sin(angle * Math.PI / 180))
    const y_from_house_center = hyp * Math.abs(Math.cos(angle * Math.PI / 180))
    const x_base = (house_side_length / 2) - x_from_house_center
    const y_base = (house_side_length / 2) - y_from_house_center

    const is_right = C.RIGHT_HOUSE_COLORS.includes(piece.capturerColor())
    const x_house_push = is_right ? house_push : 0
    const is_bottom = C.BOTTOM_HOUSE_COLORS.includes(piece.capturerColor())
    const y_house_push = is_bottom ? house_push : 0
    return [x_base + x_house_push, y_base + y_house_push, piece_radius]
  }

  // finally, if the piece is out, we're gonna, find where it is
  // and place it in the appropriate square
  const location = piece.location()
  let x_base, y_base, x_house_push, y_house_push, x_push, y_push;
  if (piece.isGraduating()) {
    switch (piece.color) {
      case C.color.RED:
        x_base = square_width + (square_width / 2)
        y_base = square_width / 2
        x_house_push = house_side_length
        y_house_push = 0
        x_push = 0
        y_push = location.position * square_width
        return [
          x_base + x_house_push + x_push,
          y_base + y_house_push + y_push,
          piece_radius
        ]
      case C.color.GREEN:
        x_base = -square_width / 2
        y_base = square_width + (square_width / 2)
        x_house_push = house_push
        y_house_push = house_side_length
        x_push = (6 - location.position) * square_width
        y_push = 0
        return [
          x_base + x_house_push + x_push,
          y_base + y_house_push + y_push,
          piece_radius
        ]
      case C.color.YELLOW:
        x_base = square_width + (square_width / 2)
        y_base = -square_width / 2
        x_house_push = house_side_length
        y_house_push = house_push
        x_push = 0
        y_push = (6 - location.position) * square_width
        return [
          x_base + x_house_push + x_push,
          y_base + y_house_push + y_push,
          piece_radius
        ]
      case C.color.BLUE:
        x_base = square_width / 2
        y_base = square_width + (square_width / 2)
        x_house_push = 0
        y_house_push = house_side_length
        x_push = location.position * square_width
        y_push = 0
        return [
          x_base + x_house_push + x_push,
          y_base + y_house_push + y_push,
          piece_radius
        ]
      default:
        throw new Error("invalid color")
    }
  }

  // now the piece is out and it's not graduating
  let x_special_push_1, x_special_push_2, y_special_push_1, y_special_push_2
  let position
  x_base = square_width / 2
  y_base = square_width / 2
  switch(location.track) {
    case C.color.RED:
      x_house_push = house_side_length
      y_house_push = 0
      position = locationOutResolver(location.position, C.color.RED)
      x_push = 0
      y_push = position * square_width
      x_special_push_1 = location.position === 6 ? square_width : 0
      x_special_push_2 = location.position > 6 ? square_width * 2 : 0
      return [
        x_base + x_house_push + x_push + x_special_push_1 + x_special_push_2,
        y_base + y_house_push + y_push,
        piece_radius
      ]
    case C.color.GREEN:
      x_house_push = house_push
      y_house_push = house_side_length
      position = locationOutResolver(location.position, C.color.GREEN)
      x_push = position * square_width
      y_push = 0
      y_special_push_1 = location.position === 6 ? square_width : 0
      y_special_push_2 = location.position > 6 ? square_width * 2 : 0
      return [
        x_base + x_house_push + x_push,
        y_base + y_house_push + y_push + y_special_push_1 + y_special_push_2,
        piece_radius
      ]
    case C.color.YELLOW:
      x_house_push = house_side_length
      y_house_push = house_push
      position = locationOutResolver(location.position, C.color.YELLOW)
      x_push = 0
      y_push = position * square_width
      x_special_push_1 = location.position === 6 ? square_width : 0
      x_special_push_2 = location.position < 6 ? square_width * 2 : 0
      return [
        x_base + x_house_push + x_push + x_special_push_1 + x_special_push_2,
        y_base + y_house_push + y_push,
        piece_radius
      ]
    case C.color.BLUE:
      x_house_push = 0
      y_house_push = house_side_length
      position = locationOutResolver(location.position, C.color.BLUE)
      x_push = position * square_width
      y_push = 0
      y_special_push_1 = location.position === 6 ? square_width : 0
      y_special_push_2 = location.position < 6 ? square_width * 2 : 0
      return [
        x_base + x_house_push + x_push,
        y_base + y_house_push + y_push + y_special_push_1 + y_special_push_2,
        piece_radius
      ]
    default:
      throw new Error("invalid track")
  }
}

function getPieceRadius(square_width) {
  return square_width * PIECE_RADIUS_PCT * 0.5
}

function getCapturingIndex(piece) {
  // think of a house as a circle. We're looking at 16 equi-distant
  // points around this circle. The final output gives us one of
  // those points. We think of the bottom most points as point 0.
  // For each color, we take out the top or bottom 3 most points
  // to leave space for the name (depending on the color of the
  // piece), and we also leave the one point in the opposite end
  // of the latter. Leaving us with 12 points (also, a piece can
  // caputre at most 12 pieces so that checks out). So, the index
  // below gives us an order for the 12, but we also need to map
  // it back into the 16 and filter out the points for each colors.
  const capturing_order = C.COLORS.filter(c => c !== piece.capturerColor)
  const index_in_order = capturing_order.indexOf(piece.color)
  const index = (index_in_order * C.COLORS.length) + piece.id
  const at_bottom = C.BOTTOM_HOUSE_COLORS.includes(piece.capturerColor)
  if (at_bottom) {
    return index + (index < 7 ? 1 : 2)
  }
  return index + (index < 7 ? 0 : 3)
}

function locationOutResolver(og_position, color) {
  switch (color) {
    case C.color.RED:
    case C.color.BLUE:
      if (og_position === 6) {
        return 0
      }
      if (og_position > 6) {
        return og_position - 7
      }
      return 5 - og_position
    case C.color.GREEN:
    case C.color.YELLOW:
      if (og_position === 6) {
        return 5
      }
      if (og_position > 6) {
        return 12 - og_position
      }
      return og_position
    default:
      throw new Error("invalid color")
  }
}
