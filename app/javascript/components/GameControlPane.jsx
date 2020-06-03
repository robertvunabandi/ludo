import React from "react"
import PropTypes from "prop-types"


export default class GameControlPane extends React.Component {
  static propTypes = {
    height: PropTypes.number.isRequired,
  }

  static defaultProps = {}

  constructor(props) {
    super(props)
  }

  render() {
    return <GameControlPaneView height={this.props.height} />
  }
}

function GameControlPaneView(props) {
  return (
    <div
      id="game-control-pane"
      style={{height: props.height, maxHeight: props.height}}>
      ControlPane!
    </div>
  )
}

