import {isEqual, flatten, reduce} from "lodash"

const H = {
  isEqual,
  flatten,
  sum(array) {
    return reduce(array, (sum, num) => sum + num, 0)
  },
  keySorter(key, invert=false) {
    return function sorter(o1, o2) {
      if (o1[key] === o2[key]) {
        return 0
      }
      const negative = invert ? 1 : -1
      const positive = invert ? -1 : 1
      return o1[key] < o2[key] ? negative : positive
    }
  },
  allowsSquareDoubling(rules) {
    return rules["allow_square_doubling"]
  },
  capturesIntoPrison(rules) {
    return rules["capture_into_prison"]
  },
  allowsRollAfterSix(rules) {
    return rules["allow_square_doubling"]
  },
  shouldStopAtGraduationEntrance(rules) {
    return rules["graduation_lane_model"] === "strict"
  },
  strictAtGraduation(rules) {
    return rules["graduation_lane_model"] === "strict"
      || rules["graduation_lane_model"] === "strict-after-entry"
  },
  mustRollSixToGraduate(rules) {
    return rules["roll_six_to_graduate"]
  },
  playerWithId(players, participant_id) {
    if (!players) {
      return {}
    }
    for (const player of players) {
      if (player.participant_id === participant_id) {
        return player
      }
    }
    return {}
  },

  _addEventListener(type, func) {
    window._LUDO_EVENTS = window._LUDO_EVENTS || {}
    let for_type = window._LUDO_EVENTS[type]
    if (for_type) {
      window.removeEventListener(type, for_type)
    }
    window._LUDO_EVENTS[type] = func
    window.addEventListener(type, func)
  },

}

// event listeners
H.addEnterKeyEventListener = function addEnterKeyEventListener(func) {
  H._addEventListener("enter_pressed", func)
}

H.addLeftKeyEventListener = function addLeftKeyEventListener(func) {
  H._addEventListener("left_pressed", func)
}

H.addRightKeyEventListener = function addRightKeyEventListener(func) {
  H._addEventListener("right_pressed", func)
}


export default H
