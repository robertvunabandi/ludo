import {isEqual} from "lodash"

const H = {
  isEqual,
  keySorter(key) {
    return function sorter(o1, o2) {
      if (o1[key] === o2[key]) {
        return 0
      }
      return o1[key] < o2[key] ? -1 : 1
    }
  }
}


export default H
