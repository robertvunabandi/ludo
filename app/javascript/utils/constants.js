const C = {
  color: {
    BLUE: "blue",
    RED: "red",
    GREEN: "green",
    YELLOW: "yellow",
    GRADUATION: "orange",
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

C.COLORS = [C.color.RED, C.color.GREEN, C.color.YELLOW, C.color.BLUE]

C.DIRECTIONS = Object.values(C.direction)
C.HORIZONTAL_DIRECTIONS = [C.direction.LEFT, C.direction.RIGHT]
C.VERTICAL_DIRECTIONS = [C.direction.UP, C.direction.DOWN]

C.RIGHT_HOUSE_COLORS  = [C.color.RED, C.color.GREEN]
C.BOTTOM_HOUSE_COLORS = [C.color.YELLOW, C.color.GREEN]
C.RIGHT_PIECE_IDS = [2, 4]
C.BOTTOM_PIECE_IDS = [3, 4]
C.VERTICAL_HOUSE_COLORS = [C.color.RED, C.color.YELLOW]
C.HORIZONTAL_HOUSE_COLORS = [C.color.BLUE, C.color.GREEN]
C.graduation_direction = {
  [C.color.RED]: C.direction.DOWN,
  [C.color.GREEN]: C.direction.LEFT,
  [C.color.YELLOW]: C.direction.UP,
  [C.color.BLUE]: C.direction.RIGHT,
}

C.ACTIONS = Object.values([C.action])

export default C
