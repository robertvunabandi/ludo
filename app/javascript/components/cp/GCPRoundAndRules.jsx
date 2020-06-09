import React from "react"
import PropTypes from "prop-types"


export default class GCPRoundAndRules extends React.Component {
  static propTypes = {
    height: PropTypes.number.isRequired,
    round: PropTypes.number.isRequired,
    viewRules: PropTypes.func.isRequired,
  }

  static defaultProps = {}

  render() {
    return <GCPRoundAndRulesView {...this.props} />
  }
}

function GCPRoundAndRulesView(props) {
  return (
    <div id="gcp-round-and-rules" className="gcp-component">
      <div style={{fontSize: (props.height * 0.20) + 'px'}}>
        <div>ROUND {props.round}</div>
      </div>
      <div style={{fontSize: (props.height * 0.17) + 'px'}}>
        <span className="btn" onClick={props.viewRules}>view rules</span>
      </div>
    </div>
  )
}

