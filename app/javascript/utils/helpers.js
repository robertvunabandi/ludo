import {isEqual, flatten, reduce} from "lodash"

const H = {
  isEqual,
  flatten,
  sum(array) {
    return reduce(array, (sum, num) => sum + num, 0)
  },
  keySorter(key) {
    return function sorter(o1, o2) {
      if (o1[key] === o2[key]) {
        return 0
      }
      return o1[key] < o2[key] ? -1 : 1
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
}


export default H
