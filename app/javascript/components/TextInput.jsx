import React from 'react'
import PropTypes from 'prop-types'


export default class TextInput extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    maxLength: PropTypes.number,
    minLength: PropTypes.number,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.string,
  }

  static defaultProps = {
    value: '',
    className: null,
    minLength: 0,
    maxLength: null,
    onChange: () => null,
  }

  constructor(props) {
    super(props)
    this.state = {
      value: props.value
    }

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(event) {
    this.setState({value: event.target.value})
    this.props.onChange(event.target.value)
  }

  render() {
    return <input
      type="text"
      className={this.props.className}
      minLength={this.props.minLength}
      maxLength={this.props.maxLength}
      value={this.state.value}
      onChange={this.handleChange}
    />
  }
}

