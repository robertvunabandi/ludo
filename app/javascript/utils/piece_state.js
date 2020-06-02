import C from "utils/constants"

const State = {
  HOME: "home",
  OUT: "out",
  CAPTURED: "captured",
  GRADUATED: "graduated",
}

const KEY_POSITION = {
  // the position right before you enter the graduation lane
  GRADUATE: 6,
  // the position where you start the game from
  START: 8,
  // the last position
  LAST: 12,
}


/**
 * This is an immutable class that represents the state of a
 * given piece within the game. It tells us whether the piece
 * is on the board, is still at home, has graduated, or has
 * been captured. If on the board, it will tells us where
 * exactly
 */
export default class PieceState {
  static GRAD_TRACK = "graduation_lane"

  // creates a new piece with a given color and id
  constructor(color, id) {
    this._color = color
    this._id = id
    this._state = State.HOME
    this._location = null
    this._capturer = null
  }

  get color() {
    return this._color
  }

  get id() {
    return this._id
  }

  isHome() {
    return this._state === State.HOME
  }

  isOut() {
    retun this._state === State.OUT
  }

  moveOut() {
    const new_piece = PieceState(this._color, this._id)
    new_piece._state = State.OUT
    new_piece._location = {
      track: this._color,
      position: KEY_POSITION.START,
    }
    return new_piece
  }

  isCaptured() {
    return this._state === State.CAPTURED
  }

  makeCaptured(capturerColor) {
    if (this._state !== State.OUT) {
      throw new Error("a piece can only be captured if out")
    }
    const new_piece = PieceState(this._color, this._id)
    new_piece._state = State.CAPTURED
    new_piece._capturer = capturerColor
    return new_piece
  }

  makeReleased() {
    if (this._state !== State.CAPTURED) {
      throw new Error("a piece can only be released if captured")
    }
    return PieceState(this._color, this._id)
  }

  isGraduating() {
    if (this._state !== State.OUT) {
      return false
    }
    return this._location.track === 'graduation_lane'
  }

  isGraduated() {
    return this._state === State.GRADUATED
  }

  makeGraduated() {
    if (!this.isGraduating()) {
      throw new Error("a piece can only graduate if it's graduating")
    }
    const new_piece = PieceState(this._color, this._id)
    new_piece._state = State.GRADUATED
    return new_piece
  }

  /**
   * Return an object with fields "track" which is either
   * 'graduation_lane' or <color>. If 'graduation_lane'
   * 'position' is one of 1 through 5 or 6 (depending on the
   * rules) and it will be located on its color's track. if
   * <color> (which is one of our four colors), position
   * represents the cell they are in. cell 0 represents the
   * most counterclockwise position of that color. (e.g.,
   * for RED that positon is the color that is connected to
   * the BLUE HOME and the RED graduation triangle).
   */
  location() {
    if (this._state !== State.OUT) {
      throw new Error("This piece is not out, so it doesn't have a location")
    }
    return {
      track: this._location.track,
      position: this._location.position,
    }
  }

  forward(count, stop_at_graduation_entrance=false) {
    if (this._state !== State.OUT) {
      throw new Error("This piece can't move forward because it's not out")
    }
    const new_piece = PieceState(this._color, this._id)
    new_piece._state = State.OUT

    const new_position = this._location.position + count

    if (this.isGraduating()) {
      new_piece._location = {
        track: PieceState.GRAD_TRACK,
        position: new_position
      }
      return new_piece
    }

    if (this._location.track === this._color) {
      let maybe_grad_track = this._location.track
      let maybe_grad_position = new_position
      if (new_count > KEY_POSITION.GRADUATE) {
        if (stop_at_graduation_entrance) {
          throw new Error("The new position would exceed the graduation")
        }
        maybe_grad_track = PieceState.GRAD_TRACK
        maybe_grad_position = new_position - KEY_POSITION.GRADUATE
      }
      new_piece._location = {
        track: maybe_grad_track,
        position: maybe_grad_position,
      }
      return new_piece
    }

    new_piece._location = PieceState._nextLocation(
      this._location.track, new_position
    )
    return new_piece
  }

  static _nextLocation(color, position) {
    let new_color = color
    let new_position = position
    while (position > KEY_POSITION.LAST) {
      new_color = PieceState._nextTrackColor(new_color)
      new_position = new_position - (KEY_POSITION.LAST + 1)
    }
    return {track: new_color, position: new_position}
  }

  static _nextTrackColor(color) {
    switch (color) {
      case C.color.RED:
        return C.color.GREEN
      case C.color.GREEN:
        return C.color.YELLOW
      case C.color.YELLOW:
        return C.color.BLUE
      case C.color.BLUE:
        return C.color.RED
      default:
        throw new Error(`invalid color ${color}`)
    }
  }
}
