const C = {
  color: {
    BLUE: "blue",
    RED: "red",
    GREEN: "green",
    YELLOW: "yellow",
    WHITE: "white",
    NEUTRAL: "beige",
  },
  direction: {
    UP: "up",
    RIGHT: "right",
    DOWN: "down",
    LEFT: "left",
  },
  stroke: {
    COLOR: "black",
    WIDTH: 2,
  },
  action: {
    BEGIN: "begin",
    MOVE: "move",
    RESCUE: "rescue",
    NULL: "null",
    STOP: "stop",
  },
}

C.COLORS = Object.values(C.color)

C.DIRECTIONS = Object.values(C.direction)
C.HORIZONTAL_DIRECTIONS = [C.direction.LEFT, C.direction.RIGHT]
C.VERTICAL_DIRECTIONS = [C.direction.UP, C.direction.DOWN]

export default C
