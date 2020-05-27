import React from "react"
import PropTypes from "prop-types"

import C from "utils/constants"

export default class GameArea extends React.Component {
  static propTypes = {
    color: PropTypes.oneOf(C.COLORS).isRequired,
    direction: PropTypes.oneOf(C.DIRECTIONS).isRequired,
    left_push: PropTypes.number.isRequired,
    top_push: PropTypes.number.isRequired,
    square_side_length: PropTypes.number.isRequired,
  }

  static defaultProps = {}

  constructor(props) {
    super(props)

    this.state = {}
  }

  render() {
    return <GameAreaView {...this.props} />
  }
}

function GameAreaView(props) {
  const numCellsInRow = isVertical(props.direction) ? 3 : 6
  const numCellsInColumn = isHorizontal(props.direction) ? 3 : 6
  const cells = makeCells(numCellsInRow, numCellsInColumn)
  return (
    <g>
      {
        cells.map(([r, c], index) => <rect
            key={index}
            x={props.left_push + (r * props.square_side_length)}
            y={props.top_push + (c * props.square_side_length)}
            width={props.square_side_length}
            height={props.square_side_length}
            stroke={C.stroke.COLOR}
            strokeWidth={C.stroke.WIDTH}
            fill={getCellColor(props.direction, r, c, props.color)}
        />)
      }
    </g>
  )
}

function isHorizontal(direction) {
  return C.HORIZONTAL_DIRECTIONS.includes(direction)
}

function isVertical(direction) {
  return C.VERTICAL_DIRECTIONS.includes(direction)
}

function makeCells(numCellsInRow, numCellsInColumn) {
  const cells = []
  for (let r = 0; r < numCellsInRow; r++) {
    for (let c = 0; c < numCellsInColumn; c++) {
      cells.push([r, c])
    }
  }
  return cells
}

function getCellColor(direction, row, column, color) {
  const numCellsInRow = isVertical(direction) ? 3 : 6
  const numCellsInColumn = isHorizontal(direction) ? 3 : 6

  // the following logic decides the color of the cell (either
  // the given color or a transparent color) based on the
  // direction
  if (isGraduationLane(direction, row, column)) {
    const pos = cellPositionTowardDirection(direction, row, column)
    return pos === 0 ? C.color.WHITE : color
  }
  return isArrowCell(direction, row, column) ? color : C.color.WHITE
}

function isGraduationLane(direction, row, column) {
  if (isVertical(direction)) {
    return row === 1
  }
  return column === 1
}

function isArrowCell(direction, row, column) {
  const pos = cellPositionTowardDirection(direction, row, column)
  return isStartLane(direction, row, column) && (pos === 1)
}

function isStartLane(direction, row, column) {
  if (isVertical(direction)) {
    return direction === C.direction.DOWN ? (row === 2) : (row === 0)
  }
    return direction === C.direction.LEFT ? (column === 2) : (column === 0)
}

function cellPositionTowardDirection(direction, row, column) {
  if (isVertical(direction)) {
    if (direction === C.direction.DOWN) {
      return column
    }
    return 5 - column
  }
  if (direction === C.direction.RIGHT) {
    return row
  }
  return 5 - row
}

