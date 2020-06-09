import React from "react"
import PropTypes from "prop-types"

import C from "utils/constants"
import H from "utils/helpers"
import PT from "utils/prop_types"

import Dice from "components/Dice"

const sortByInvertedPoints = H.keySorter("points", true)


export default class GCPPlayerIndicators extends React.Component {
  static propTypes = {
    is_turn_order_determination: PropTypes.bool,
    round: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    // same as in Game.jsx
    players: PT.players.isRequired,
    history: PT.history.isRequired,
  }

  static defaultProps = {
    is_turn_order_determination: true,
  }

  constructor(props) {
    super(props)
  }

  render() {
    return <GCPPlayerIndicatorsView {...this.props} />
  }
}

function GCPPlayerIndicatorsView(props) {
  const height_height = {height: props.height, maxHeight: props.height}
  const players_order = props.is_turn_order_determination
    ? props.players.map(p => p.participant_id)
    : getOrderFromHistory(props.players, props.history)
  const relevant_history = getRelevantHistory(
    props.history, props.round, props.players.length
  )
  const small_height = props.height / 4
  const pi_height_style = {height: small_height, maxHeight: small_height}

  return (
    <div id="gcp-player-indicators" className="gcp-component">
      <div id="gcp-pi-inner" style={height_height}>
      {players_order.map((player_id, index) => {
        const hist = relevant_history[index]
        return (
        <PlayerIndicator
          key={index}
          height={props.height / 4}
          player={playerWithId(props.players, player_id)}
          rolls={!!hist ? H.flatten(hist.rolls.map(r => r.rolls)) : []} />
      )})}
      </div>
    </div>
  )
}

function getOrderFromHistory(players, history) {
  const player_ids = players.map(p => ({id: p.participant_id, points: -1}))
  const relevant = history.slice(0, players.length)

  // temporary fix. Sometimes we're in intermediate states,and
  // in those the history isn't updated yet. That results in
  // the relevant history not having enough to do the sorting,
  // which prevents updates down the chain and prevents
  // reaching a state of correct history. So, if this next
  // condition passes, we certainly will be waiting for an
  // update to fix it.
  if (relevant.length < players.length) {
    return players.map(p => p.participant_id)
  }

  player_ids.forEach((p, i) => {
    const rolls = relevant[i].rolls[0].rolls
    p.points = H.sum(rolls)
  })
  player_ids.sort(sortByInvertedPoints)
  return player_ids.map(p => p.id)
}

function getRelevantHistory(history, round, num_players) {
  const start = num_players * round
  const end = num_players * (round + 1)
  return history.slice(start, end)
}

function PlayerIndicator(props) {
  const player = props.player
  const height_style = {height: props.height, maxHeight: props.height}

  const common = {accent_color: props.player.color, width: props.height}
  const rolls = props.rolls.length === 0 ? "" : (
    props.rolls.map((r, i) => {
      return <Dice key={i} width={props.height} value={r} {...common} />
    })
  )
  return (
    <div className="player-indicator" style={height_style}>
      <span
        className="pi-color"
        style={{backgroundColor: props.player.color, ...height_style}}>
      </span>
      <span className="pi-rolls">{rolls}</span>
    </div>
  )
}

function playerWithId(players, participant_id) {
  if (!players) {
    return {}
  }
  for (const player of players) {
    if (player.participant_id === participant_id) {
      return player
    }
  }
  return {}
}

