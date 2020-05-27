import React from "react"
import PropTypes from "prop-types"

import C from "utils/constants"


export default class GameHouse extends React.Component {
  static propTypes = {
    color: PropTypes.string.isRequired,
    side_length: PropTypes.number.isRequired,
    left_push: PropTypes.number.isRequired,
    top_push: PropTypes.number.isRequired,
    username: PropTypes.string,
    textPosition: PropTypes.oneOf([C.direction.UP, C.direction.DOWN]).isRequired,
  }

  static defaultProps = {
    username: null,
  }

  constructor(props) {
    super(props)

    this.state = {}
  }

  render() {
    return <GameHouseView {...this.props} />
  }
}

function GameHouseView(props) {
  const halfSL = props.side_length / 2
  const centerX = props.left_push + halfSL
  const centerY = props.top_push + halfSL
  const radius = halfSL - props.square_side_length

  // text stuffs
  const textPct = 0.60
  const textSize = props.square_side_length * textPct
  const minTopPush = textSize + (props.square_side_length * (1-textPct) * 0.05)
  const pushTextTop = props.side_length - props.square_side_length
  const textTop = minTopPush + (props.textPosition === C.direction.UP ? 0 : pushTextTop)
  const shadowColor = C.color.WHITE
  const shadowPixels = 2
  const textShadowArray = [[1, 1], [1, -1], [-1, 1], [-1, -1]]
  const textShadow = textShadowArray.map(([l, r]) => {
    return `${l * shadowPixels}px ${r * shadowPixels}px ${shadowColor}`
  }).join(", ")
  return (
    <g>
      <rect
        x={props.left_push}
        y={props.top_push}
        width={props.side_length}
        height={props.side_length}
        stroke={C.stroke.COLOR}
        strokeWidth={C.stroke.WIDTH}
        fill={props.color}
      />
      <circle
        cx={centerX}
        cy={centerY}
        r={radius}
        stroke={C.stroke.COLOR}
        strokeWidth={C.stroke.WIDTH}
        fill={C.color.WHITE}
      />
      {!props.username ? null : (
        <text
          textAnchor="middle"
          x={centerX}
          y={props.top_push + textTop}
          style={{
            fontSize: textSize,
            textShadow,
          }}
          >
          {props.username}
        </text>
      )}
    </g>
  )
}

