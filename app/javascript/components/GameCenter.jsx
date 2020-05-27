import React from "react"
import PropTypes from "prop-types"

import C from "utils/constants"


export default class GameCenter extends React.Component {
  static propTypes = {
    left_push: PropTypes.number.isRequired,
    top_push: PropTypes.number.isRequired,
    side_length: PropTypes.number.isRequired,
  }

  static defaultProps = {}

  constructor(props) {
    super(props)
  }

  render() {
    return <GameCenterView {...this.props} />
  }
}

function GameCenterView(props) {
  const left =  props.left_push
  const right =  left + props.side_length
  const top =  props.top_push
  const bottom =  top + props.side_length

  const halfSL = props.side_length / 2

  const center = `${left + halfSL},${top + halfSL}`
  const redPoints = `${left},${top} ${right},${top} ${center}`
  const greenPoints = `${right},${top} ${right},${bottom} ${center}`
  const yellowPoints = `${right},${bottom} ${left},${bottom} ${center}`
  const bluePoints = `${left},${bottom} ${left},${top} ${center}`
  return (
    <g>
      <polygon
        points={redPoints}
        fill={C.color.RED}
        stroke={C.stroke.COLOR}
        strokeWidth={C.stroke.WIDTH}
      />
      <polygon
        points={greenPoints}
        fill={C.color.GREEN}
        stroke={C.stroke.COLOR}
        strokeWidth={C.stroke.WIDTH}
      />
      <polygon
        points={yellowPoints}
        fill={C.color.YELLOW}
        stroke={C.stroke.COLOR}
        strokeWidth={C.stroke.WIDTH}
      />
      <polygon
        points={bluePoints}
        fill={C.color.BLUE}
        stroke={C.stroke.COLOR}
        strokeWidth={C.stroke.WIDTH}
      />
    </g>
  )
}

