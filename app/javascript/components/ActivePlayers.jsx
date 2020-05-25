import React from 'react'
import PropTypes from 'prop-types'

import TextInput from 'components/TextInput'


export default class ActivePlayers extends React.Component {
  static propTypes = {
    players: PropTypes.arrayOf(PropTypes.shape({
      participant_id: PropTypes.number.isRequired,
      username: PropTypes.string.isRequired,
      is_host: PropTypes.bool.isRequired,
    })).isRequired,
    Socket: PropTypes.object.isRequired,
  }

  static defaultProps = {
    players: []
  }

  render() {
    return <ActivePlayersView players={this.props.players}
      Socket={this.props.Socket} />
  }
}

function ActivePlayersView(props) {
  return (
    <span id="inner-active-players">
      {props.players.map((player, index) => getPlayerItem(
        player, index, props.Socket
      ))}
    </span>
  )
}

function getPlayerItem(player, index, Socket) {
  let usernameSection = null
  if (player.participant_id === Socket.data.myId) {
    usernameSection = (
      <TextInput
        className="player-username-input"
        maxLength={Socket.const.MAX_USERNAME_LENGTH}
        minLength={Socket.const.MIN_USERNAME_LENGTH}
        onChange={Socket.funcs.changeUsername}
        value={player.username}
      />
    )
  } else {
    usernameSection = (
      <span className="player-username">{player.username}</span>
    )
  }

  const hostIndicator = player.is_host
    ? (<span className="player-host-indicator">host</span>)
    : null

  const youIndicator = player.participant_id === Socket.data.myId
    ? (<span className="player-you-indicator">you</span>)
    : null

  console.log(TextInput.propTypes)
  return (
    <span className="player" key={index}>
      <span className="player-index">{index + 1}</span>
      { usernameSection }
      { hostIndicator }
      { youIndicator }
    </span>
  )
}

