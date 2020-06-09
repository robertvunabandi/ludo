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
}


export default H
