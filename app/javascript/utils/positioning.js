import H from "utils/helpers"
import PieceState from "utils/piece_state"

const P = {}

P.getPiecesPositionsFromHistory = function getPiecesPositionsFromHistory(
  history, rules, available_colors
) {
  const pieces = P.getStartingPositions(available_colors)
  const num_players = available_colors.length
  const turn_order_points = available_colors.map(() => 0)
  const player_order = available_colors.map(c => c)
  // for each turn, move the pieces according to their
  // respective turns
  for (const turn of history) {
    if (P.isTurnOrderDetermination(turn.turn, num_players)) {
      turn_order_points[turn.turn] = H.sum(
        turn.rolls.map(roll => H.sum(roll.rolls))
      )
      if (turn.turn === num_players - 1) {
        player_order.sort(P.turnSorter(available_colors, turn_order_points))
      }
      continue
    }
    const color = player_order[turn.turn % num_players]
    const actions = turn.actions.sort(H.keySorter("action_id"))
    for (const action of actions) {
      P.updatePiecesPositionsOnAction(pieces, color, action, rules)
    }
  }
  return pieces
}

P.isTurnOrderDetermination = function isTurnOrderDetermination(
  turn, num_players
) {
  return i < num_players
}

P.getStartingPositions = function getStartingPositions(available_colors) {
  const positions = {}
  available_colors.forEach(color => {
    positions[color] = {
      1: PieceState(color, 1),
      2: PieceState(color, 2),
      3: PieceState(color, 3),
      4: PieceState(color, 4),
    }
  })
  return positions
}

P.turnSorter = function turnSorter(available_colors, turn_order_points) {
  const indices = {}
  available_colors.map((c, i) => {
    indices[c] = i
  })
  return function (color1, color2) {
    const p1 = turn_order_points[indices[color1]]
    const p2 = turn_order_points[indices[color2]]
    if (p1 === p2) {
      return 0
    }
    // if returning -1, then 1 is before 2
    // if returning  1, then 1 is after  2
    // if 1 has less points, then return 1 because 1 is after 2
    // because we want to sort from larger to smaller
    // See Array.prototype.sort() on MDN
    return p1 < p2 ? 1 : -1
  }
}

P.updatePiecesPositionsOnAction = function updatePiecesPositionsOnAction(
  pieces, color, action, rules
) {
  // the given color has just performed the given action.
  // now, we update the pieces accordingly
  // TODO: do this
}


const positioning = P
export default positioning
