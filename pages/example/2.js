import React from 'react'
import {validated} from '../../lib'
import style from './style2'

class App extends React.Component {
  state = {isOther: false, color: null}

  onChange = (data) => {
    this.setState(data)
  }

  render() {
    return (<Form
      color={this.state.color}
      isOther={this.state.isOther}
      onChange={this.onChange}
      onValid={() => alert('Good choice!')} // eslint-disable-line no-alert
      onInvalid={() => alert('Pick a color!')} // eslint-disable-line no-alert
    />)
  }
}

const COLORS = ['White', 'Yellow', 'Fuchsia', 'Red', 'Silver', 'Gray', 'Olive',
  'Purple', 'Maroon', 'Aqua', 'Lime', 'Teal', 'Green', 'Blue', 'Navy', 'Black']

const OPTIONS = ['White', 'Good', 'Yellow', 'Big', 'Red', 'Blue', 'Dense', 'Pretty']

const isColor = (value) =>
  COLORS.indexOf(value) >= 0 ? null : `"${value}" is not a color. Hint: ${COLORS.join(', ')}`

function validationConfig(props) {
  const {color} = props

  return {
    fields: ['color'],
    validations: {
      color: [[isColor, color]],
    },
  }
}

class Form extends React.Component {

  render() {
    const {color, isOther, onChange, onValid, onInvalid, $fieldEvent, $field, $validation} = this.props
    return (
      <form className={style}>
        <h1>What is your favorite color?</h1>
        <div>
          {
            OPTIONS.map((o) => (
              <label key={o}>
                <input
                  type="radio"
                  onChange={() => {
                    onChange({color: o, isOther: false})
                    $fieldEvent('blur', 'color')
                  }}
                  checked={!isOther && color === o}
                />
                {o}
              </label>
            ))
          }
          <label>
            <input
              type="radio"
              onChange={() => {
                onChange({color: '', isOther: true})
                $fieldEvent('reset', 'color')
              }}
              checked={isOther}
            />
            Other
          </label>
          {
            isOther && <input type="text" value={color}
            {...$field('color', (e) => onChange({color: e.target.value}))} />
          }
        </div>
        {$validation.color.show && <div className="error">{$validation.color.error.reason}</div>}
        <div>
          <button onClick={(e) => {
            e.preventDefault()
            this.props.$submit(onValid, onInvalid)
          }}>Submit</button>
        </div>
      </form>
    )
  }
}
Form = validated(validationConfig)(Form)

export default () => <App />
