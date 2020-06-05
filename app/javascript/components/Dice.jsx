import React from "react"
import PropTypes from "prop-types"
import C from "utils/constants"


// Dice functions. value is one of [1, 2, 3, 4, 5, 6] in all functions
const DF = {
  hasTopLeftPoint: value => value > 3,
  hasTopRightPoint: value => value !== 1,
  hasCenterLeftPoint: value => value === 6,
  hasCenterPoint: value => [1, 3, 5].includes(value),
  hasCenterRightPoint: value => value === 6,
  hasBottomLeftPoint: value => value !== 1,
  hasBottomRightPoint: value => value > 3,
}

// Dice multipliers, map from the functions above to a multiplier for
// x and y push for a circle dot. the output is a multiplier that we
// add to the inner width and height, output is [x, y]
const DM = {
  hasTopLeftPoint: [1 - 0.5 - 0.25, 1 - 0.5 - 0.25],
  hasTopRightPoint: [1 - 0.25, 1 - 0.5 - 0.25],
  hasCenterLeftPoint: [1 - 0.5 - 0.25, 1 - 0.5],
  hasCenterPoint: [1 - 0.5, 1 - 0.5],
  hasCenterRightPoint: [1 - 0.25, 1 - 0.5],
  hasBottomLeftPoint: [1 - 0.5 - 0.25, 1 - 0.25],
  hasBottomRightPoint: [1 - 0.25, 1 - 0.25],
}


export default class Dice extends React.Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    value: PropTypes.oneOf([1, 2, 3, 4, 5, 6]).isRequired,
    selected: PropTypes.bool,
    accent_color: PropTypes.oneOf(C.COLORS).isRequired,
    onClick: PropTypes.func,
    roll_id: PropTypes.any,
  }

  static defaultProps = {
    selected: false,
    onClick: () => null,
    roll_id: -1,
  }

  constructor(props) {
    super(props)
  }

  render() {
    return <DiceView {...this.props} />
  }
}

function DiceView(props) {
  const inner = props.width * 0.96
  const push = props.width * 0.02
  const rc = inner * 0.2

  const dot_radius = (inner / 5.5) / 2
  const s_class = props.selected ? " selected" : ""
  const fill_color = props.selected ? props.accent_color : C.color.WHITE
  return (
    <svg
      width={props.width}
      height={props.width}
      className={`dice dice-${props.value}` + s_class} >
      <g onClick={() => props.onClick(props.roll_id)}>
        <rect
          x={push}
          y={push}
          width={inner}
          height={inner}
          rx={rc}
          ry={rc}
          fill={fill_color}
          stroke={C.color.BLACK}
          style={{color: fill_color}}
        />
        {Object.keys(DF).map(dotResolver(inner, push, dot_radius, props.value))}
      </g>
    </svg>
  )
}

function dotResolver(inner, push, dot_radius, value) {
  return function dotResolve(fname, index) {
    if (!DF[fname](value)) {
      return null
    }
    const [xm, ym] = DM[fname]
    const x = inner * xm
    const y = inner * ym
    return <circle
      key={index}
      cx={push + x}
      cy={push + y}
      r={dot_radius}
      fill={C.color.BLACK}
    />
  }
}

