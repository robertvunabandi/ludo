import React from "react"
import PropTypes from "prop-types"


export default class GCPRoundAndRules extends React.Component {
  static propTypes = {
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    round: PropTypes.number.isRequired,
    viewRules: PropTypes.func.isRequired,
  }

  static defaultProps = {}

  render() {
    return <GCPRoundAndRulesView {...this.props} />
  }
}

function GCPRoundAndRulesView(props) {
  const style = {
    width: props.width,
    maxWidth: props.width,
    height: props.height,
    maxheight: props.height,
  }
  return (
    <div id="gcp-round-and-rules" className="gcp-component" style={style}>
      <div>
        <div>ROUND {props.round}</div>
      </div>
      <div id="view-rules-btn" onClick={props.viewRules}>
          Game Rules
      </div>
    </div>
  )
}

