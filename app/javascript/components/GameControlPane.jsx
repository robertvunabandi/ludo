import React from "react"
import PropTypes from "prop-types"

import Dice from "components/Dice"
import C from "utils/constants"
import H from "utils/helpers"


export default class GameControlPane extends React.Component {
  static propTypes = {
    height: PropTypes.number.isRequired,
    side_length: PropTypes.number.isRequired,
    my_id: PropTypes.number.isRequired,

    // same as in Game.jsx
    players: PropTypes.arrayOf(PropTypes.shape({
      color: PropTypes.string.isRequired,
      is_host: PropTypes.bool.isRequired,
      participant_id: PropTypes.number.isRequired,
      username: PropTypes.string.isRequired,
    })).isRequired,
    history: PropTypes.arrayOf(PropTypes.shape({
      turn: PropTypes.number.isRequired,
      rolls: PropTypes.arrayOf(PropTypes.shape({
        roll_id: PropTypes.number.isRequired,
        rolls: PropTypes.arrayOf(PropTypes.number).isRequired,
      })),
      actions: PropTypes.arrayOf(PropTypes.shape({
        action_id: PropTypes.number.isRequired,
        action: PropTypes.oneOf(C.ACTIONS).isRequired,
        piece: PropTypes.number.isRequired,
        roll: PropTypes.number.isRequired,
      })),
    })).isRequired,

    // all of these are state fields of Game.jsx, see there for info
    is_my_turn: PropTypes.bool.isRequired,
    turn_participant_id: PropTypes.number,
    is_turn_order_determination: PropTypes.bool.isRequired,
    is_rolling: PropTypes.bool.isRequired,
    num_rolls: PropTypes.number.isRequired,
    is_moving: PropTypes.bool.isRequired,
    remaining_rolls: PropTypes.arrayOf(PropTypes.number),
    turn: PropTypes.number,
    selected_piece: PropTypes.arrayOf(PropTypes.number),
    last_roll: PropTypes.arrayOf(PropTypes.number),
    chosen_action: PropTypes.shape({
      action: PropTypes.oneOf(C.ACTIONS),
      piece: PropTypes.oneOf([1, 2, 3, 4]),
      roll: PropTypes.number.isRequired,
    }),

    // TODO: we need methods to send last roll and chosen actions up the chain
    // TODO: make this required at some point
    viewRules: PropTypes.func,
  }

  static defaultProps = {
    turn_participant_id: null,
    remaining_rolls: null,
    turn: 0,
    selected_piece: null,
    chosen_action: null,

    viewRules: () => console.log("View rules clicked"),
  }

  constructor(props) {
    super(props)
  }

  render() {
    return <GameControlPaneView {...this.props} />
  }
}

/* TODO remove this comment block
Here are the different scenarios that could happen here (this would
help figure out how to display things):

A. we're in turn determination

1. it's my turn, and I am supposed to roll
   Here, I need to know how much everyone has rolled so that the
   result makes sense to me
2. it's not my turn, and they are rolling
   Here, I still need to know the above

B. we're not in turn determination

1. it's my turn, and:
   a. I am supposed to roll (first time rolling this turn)
   b. I am still rolling because I rolled a 6
   c. Now, I am completeting an action for one of my rolls
2. it's NOT my turn, so it's someone else's turn, and same subcases
   a, b, c above
*/

function GameControlPaneView(props) {
  //
  // OVERALL
  //
  const heightStyle = {height: props.height, maxHeight: props.height}
  const widthStyle = {
    width: props.side_length, maxWidth: props.side_length, ...heightStyle
  }

  //
  // ROUNDS
  //
  const round = Math.floor(props.turn / props.players.length)

  //
  // PLAYERS INDICATOR
  //
  const players_order = props.is_turn_order_determination
    ? props.players.map(p => p.participant_id)
    : getOrderFromHistory(props.players, props.history)
  const relevant_history = props.history.slice(round, round + props.players.length)
  const pi_height_style = {height: props.height / 4, maxHeight: props.height / 4}
  const gcp_pi_inner = <div id="gcp-pi-inner" style={heightStyle}>
    {players_order.map((player_id, index) => {
      const hist = relevant_history[index]
      const player = playerWithId(props.players, player_id)
      const rolls = !!hist ? H.flatten(hist.rolls.map(r => r.rolls)) : []
      return <div key={index} className="player-indicator" style={pi_height_style}>
        <span
          className="pi-color"
          style={{backgroundColor: player.color, ...pi_height_style}}>
        </span>
        <span className="pi-rolls">
        {rolls.map((r, i) => (
          <Dice
            key={i}
            width={props.height / 4}
            value={r}
            accent_color={player.color} />
        ))}
        </span>
      </div>
    })}
  </div>

  //
  // INSTRUCTIONS
  //
  const tp_text = props.is_my_turn
    ? "your"
    : playerWithId(props.players, props.turn_participant_id).username + "'s"
  const turn_person = (<b>{tp_text}</b>)
  // TODO: adjust instructions based on what it's supposed to be
  const instruction = props.is_my_turn
    ? <span id="gcp-i-inner">It's {turn_person} turn!</span>
    : <span id="gcp-i-inner">It's {turn_person} turn! WAIT until they are done.</span>

  //
  // ACTION
  //
  // TODO: make this action adjust to whatever we are doing
  // TODO: also, when it's not my turn, the action stuff shouldn't show up
  function actionClick() {
    console.log("clicked on action!")
  }

  //
  // ROLLS
  //
  const gcp_rolls_width = props.height / 2.6
  const my_color = props.players
    .filter(p => p.participant_id === props.my_id)[0].color


  return (
    <div id="game-control-pane" style={heightStyle}>
      <div id="gcp-inner" style={widthStyle}>
        <div id="gcp-round-and-rules" className="gcp-component">
          <div style={{fontSize: (props.height * 0.30) + 'px'}}>
            <div>ROUND {round}</div>
          </div>
          <div style={{fontSize: (props.height * 0.25) + 'px'}}>
            <span className="btn" onClick={props.viewRules}>view rules</span>
          </div>
        </div>
        <div id="gcp-player-indicators" className="gcp-component">
          {gcp_pi_inner}
        </div>
        <div id="gcp-instructions" className="gcp-component">
          {instruction}
        </div>
        {!props.is_my_turn ? null : <>
          <div
            id="gcp-action"
            className="gcp-component"
            onClick={actionClick}
            style={{lineHeight: props.height + "px"}}>
            ACTION
          </div>
          <div id="gcd-rolls" className="gcp-component">
            ROLLS <br/>
            <Dice width={gcp_rolls_width} value={1} accent_color={my_color} />
            <Dice width={gcp_rolls_width} value={2} accent_color={my_color} />
            <Dice width={gcp_rolls_width} value={3} accent_color={my_color} />
            <Dice width={gcp_rolls_width} value={4} accent_color={my_color} />
            <Dice width={gcp_rolls_width} value={5} accent_color={my_color} selected={true} />
            <Dice width={gcp_rolls_width} value={6} accent_color={my_color} />
          </div>
        </>
        }
      </div>
    </div>
  )
}

function getOrderFromHistory(players, history) {
  const player_ids = players.map(p => ({id: p.participant_id, points: -1}))
  const relevant = history.slice(0, players.length)
  player_ids.forEach((p, i) => {
    const rolls = relevant[i].rolls[0].rolls
    p.points = H.sum(rolls)
  })
  player_ids.sort(H.keySorter("points"))
  return player_ids.map(p => p.id)
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

