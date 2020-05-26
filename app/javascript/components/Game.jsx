import React from "react"
import PropTypes from "prop-types"


export default class Game extends React.Component {
  static propTypes = {
    side_length: PropTypes.number.isRequired,
  }

  static defaultProps = {
    side_length: null,
  }

  render () {
    return <GameView {...this.state} />
  }
}

function GameView(props) {
  return (
    <span>
    </span>
  )
}

