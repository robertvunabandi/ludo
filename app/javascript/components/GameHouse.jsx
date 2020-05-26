import React from "react"
import PropTypes from "prop-types"


export default class GameHouse extends React.Component {
  static propTypes = {
    color: PropTypes.string.isRequired,
    side_length: PropTypes.number.isRequired,
    left_push: PropTypes.number.isRequired,
    top_push: PropTypes.number.isRequired,
    // participant ID of the owner
    owner: PropTypes.number.isRequired,
  }

  static defaultProps = {
    color: null,
    side_length: null,
    left_push: null,
    top_push: null,
    owner: null,
  }

  constructor(props) {
    super(props)

    this.state = {}
  }

  render() {
    return <GameHouseView {...this.state} {...this.props} />
  }
}

function GameHouseView(props) {
  return (
    <g>
      <rect
        x={props.left_push}
        y={props.right_push}
        width={props.side_length}
        height={props.side_length}
        {/* todo: temporarily stylings */}
        stroke="black"
        strokeWidth="5"
        fill={props.color}
      />
    </g>
  )
}

