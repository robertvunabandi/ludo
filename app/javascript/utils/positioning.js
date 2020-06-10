import C from "utils/constants"
import H from "utils/helpers"
import PieceState from "utils/piece_state"


const INVALID_WITH_RULES = (
  "new position would not be valid with current game rules"
)
const MOVE_ACTIONS = [C.action.BEGIN, C.action.MOVE, C.action.RESCUE]

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
  return turn < num_players
}

P.getStartingPositions = function getStartingPositions(available_colors) {
  const positions = {}
  available_colors.forEach(color => {
    positions[color] = {
      1: new PieceState(color, 1),
      2: new PieceState(color, 2),
      3: new PieceState(color, 3),
      4: new PieceState(color, 4),
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
  const action_outcome = P.getActionOutcome(pieces, color, action, rules)
  if (action_outcome.errors) {
    throw new {errors: action_outcome.erros}
  }
  for (const piece of action_outcome.outcomes) {
    pieces[piece.color][piece.id] = piece
  }
  return
}

P.hasPossibleMoves = function hasPossibleMoves(pieces, color, rolls, rules) {
  for (const roll of rolls) {
    for (const piece_id in pieces[color]) {
      const outcomes = P.getValidActions(pieces, color, piece_id, roll, rules)
      if (outcomes.length > 0) {
        return true
      }
    }
  }
  return false
}

P.getValidActions = function getValidActions(
  pieces, color, piece_id, roll, rules
) {
  const outcomes = []
  for (const action_name of MOVE_ACTIONS) {
    const action = {action: action_name, roll, piece: piece_id}

    if (action.action === C.action.MOVE && piece_id < 3) {
    }
    const current_outcome = P.getActionOutcome(pieces, color, action, rules)
    if (current_outcome.errors && current_outcome.errors.length > 0) {
      continue
    }
    outcomes.push(current_outcome)
  }
  return outcomes
}

P.getActionOutcome = function getActionOutcome(
  pieces, color, action, rules
) {
  // the given color has just performed the given action.
  // now, we update the pieces accordingly
  let piece = pieces[color][action.piece]
  const allows_square_doubling = H.allowsSquareDoubling(rules)
  switch (action.action) {
    // ========================================================================
    case C.action.BEGIN:
      if (!piece.isHome()) {
        return {errors: ["piece is not home"]}
      }
      if (action.roll !== 6) {
        return {errors: ["roll is not a 6"]}
      }

      piece = piece.moveOut()

      if (!P.newPositionValidWithRules(piece, pieces, rules)) {
        return {errors: [INVALID_WITH_RULES]}
      }

      return {
        action,
        outcomes: [piece, ...P.handleCapturesFromPiece(piece, pieces, rules)]
      }

    // ========================================================================
    case C.action.MOVE:
      if (!piece.isOut()) {
        return {errors: ["piece is not out"]}
      }

      const previous_loc = piece.location()
      // extract rules
      const should_stop_at_grad_entry = H.shouldStopAtGraduationEntrance(rules)
      const strict_at_graduation = H.strictAtGraduation(rules)
      const roll_six_to_graduate = H.mustRollSixToGraduate(rules)

      if (strict_at_graduation && piece.isAboutToEnterGraduationLane()) {
        if (action.roll !== 1) {
          return {errors: [
            "because it's strict at graduation, piece must roll a 1 to enter"
          ]}
        }
        piece = piece.forward(1, should_stop_at_grad_entry)

        if (!P.newPositionValidWithRules(piece, pieces, rules)) {
          return {errors: [INVALID_WITH_RULES]}
        }
        return {action, outcomes: [piece]}
      }

      if (piece.isGraduating()) {
        if (previous_loc.position === 6 && action.roll === 6) {
          console.assert(roll_six_to_graduate)
          return {action, outcomes: [piece.makeGraduated()]}
        }

        if (strict_at_graduation) {
          // the following if condition is that of strict graduation
          if (action.roll !== previous_loc.position + 1) {
            return {errors: ["Roll is invalid with current game rules"]}
          }
          piece = piece.forward(1)
          if (piece.location().position === 6 && !roll_six_to_graduate) {
            piece = piece.makeGraduated()
          }
          if (!P.newPositionValidWithRules(piece, pieces, rules)) {
            return {errors: ["Roll is invalid with current game rules"]}
          }
          return {action, outcomes: [piece]}
        }

        try {
          piece = piece.forward(action.roll, should_stop_at_grad_entry)
        } catch (e) {
          // CANCEL
          // invalid move, exceeds graduation
          return {errors: ["invalid moves makes piece exceeds graduation"]}
        }
        if (piece.location().position === 6 && !roll_six_to_graduate) {
          piece = piece.makeGraduated()
        }
        if (!P.newPositionValidWithRules(piece, pieces, rules)) {
          return {errors: [INVALID_WITH_RULES]}
        }
        return {action, outcomes: [piece]}
      }

      // NOW the piece is not graduating
      try {
        piece = piece.forward(action.roll, should_stop_at_grad_entry)
      } catch (e) {
        // due to overflowing into graduation or other grad lane issues
        return {errors: ["invalid moves makes piece exceed graduation entrance"]}
      }

      if (!P.newPositionValidWithRules(piece, pieces, rules)) {
        return {errors: [INVALID_WITH_RULES]}
      }
      const outcomes = [piece]
      if (!piece.isGraduating()) {
        outcomes.push(...P.handleCapturesFromPiece(piece, pieces, rules))
      }
      return {action, outcomes}
    // ========================================================================
    case C.action.RESCUE:
      if (!piece.isCaptured()) {
        return {errors: ["piece isn't captured"]}
      }
      if (action.roll !== 6) {
        return {errors: ["didn't roll a 6"]}
      }

      return {action, outcomes: [piece.makeReleased()]}
    // ========================================================================
    case C.action.NULL:
      // null action, don't do anything
      return {action, outcomes: []}
    // ========================================================================
    case C.action.STOP:
      // stop action, don't do anything, TODO but somewhere outside the
      // game we should check for stop action and end the game
      return {action, outcomes: []}
  }
}

P.newPositionValidWithRules = function newPositionValidWithRules(
  piece, pieces, rules
) {
  if (piece.isGraduated()) {
    return true
  }
  const allows_square_doubling = H.allowsSquareDoubling(rules)
  if (P.overlapsWithOtherPieces(piece, pieces) && !allows_square_doubling) {
    return false
  }
  return true
}

P.handleCapturesFromPiece = function handleCapturesFromPiece(
  piece, pieces, rules
) {
  const pieces_at_location = P.piecesAtLocation(pieces, piece.location())
  const other_pieces = pieces_at_location.filter(p => !piece.sameColor(p))
  if (other_pieces.length === 0) {
    return []
  }

  // capture the other pieces, put the updated into outcomes
  const captures_into_prison = H.capturesIntoPrison(rules)
  const outcomes = []
  other_pieces.forEach(p => {
    let np = p.makeCaptured(piece.color)
    if (!captures_into_prison) {
      np = np.makeReleased()
    }
    outcomes.push(np)
  })
  return outcomes
}

P.piecesAtLocation = function piecesAtLocation(pieces, location) {
  const {track, position} = location
  const pieces_at_location = []
  Object.keys(pieces).forEach(color => {
    Object.keys(pieces[color]).forEach(piece_id => {
      const piece = pieces[color][piece_id]
      if (!piece.isOut()) {
        return
      }
      const ploc = piece.location()
      if (ploc.track === track && ploc.position === position) {
        pieces_at_location.push(piece)
      }
    })
  })
  return pieces_at_location
}

P.overlapsWithOtherPieces = function overlapsWithOtherPieces(piece, pieces) {
  // assumes that piece is not in the set of pieces
  const pieces_at_location = P.piecesAtLocation(pieces, piece.location())
  return pieces_at_location.filter(p => piece.sameColor(p)).length > 0
}

P._piecesCollide = function _piecesCollide(piece1, piece2) {
  return ([piece1, piece2].every(p => p.isOut()))
    && H.isEqual(...([piece1, piece2].map(p => p.location())))
}


const positioning = P
export default positioning
