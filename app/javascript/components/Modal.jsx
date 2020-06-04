import React from "react"
import PropTypes from "prop-types"


export default class Modal extends React.Component {
  static propTypes = {
    // the state when launching
    visible: PropTypes.bool,
    // what to do when closing the modal
    onClose: PropTypes.func.isRequired,
    // in rems
    padding: PropTypes.number,
  }

  static defaultProps = {
    visible: true,
    padding: 5,
  }

  constructor(props) {
    super(props)

    this.close = this.close.bind(this)
  }

  close() {
    this.props.onClose()
  }

  componentDidMount() {
    const self = this
    const app_modal = document.querySelector("#app-modal")
    const app_modal_inner = document.querySelector("#app-modal-inner")
    const app_modal_close_btn = document.querySelector("#app-modal-close-btn")
    app_modal.addEventListener("click", (event) => {
      if (event.target === app_modal) {
        self.close()
      }
    })
    app_modal.style.minWidth = window.innerWidth + "px"
    app_modal.style.maxWidth = window.innerWidth + "px"
    app_modal.style.minHeight = window.innerHeight + "px"
    app_modal.addEventListener("resize", () => {
      app_modal.style.minWidth = window.innerWidth + "px"
      app_modal.style.maxWidth = window.innerWidth + "px"
      app_modal.style.minHeight = window.innerHeight + "px"
    })

    app_modal_close_btn.addEventListener("click", self.close)
  }

  render() {
    return <ModalView
      {...this.state}
      padding={this.props.padding}
      children={this.props.children}
    />
  }
}

function ModalView(props) {
  return (
    <div id="app-modal" style={{padding: props.padding + "rem"}}>
      <div id="app-modal-inner">
      {props.children}
      </div>
      <div id="app-modal-close">
        <div id="app-modal-close-btn">Close</div>
      </div>
    </div>
  )
}

