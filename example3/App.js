'use strict'

import React from 'react'
import Promise from 'bluebird'
import {
  valid,
  invalid,
  validated,
  initValidation,
  isRequired,
} from '../lib'
import {
  FormGroup,
  FormControl,
  ControlLabel,
  Panel,
  Button
} from 'react-bootstrap'
import R from 'ramda'
import {cloneDeep} from 'lodash'

export function style(validationData) {
  let {isValid, show} = validationData
  if (show && isValid === true) return 'success'
  if (show && isValid === false) return 'error'
  return null
}

export function validationMessage(validationData) {
  let {isValid, show, error: {rule = ''}} = validationData

  if (!show) return null
  if (isValid == null) return 'Computing...'
  if (isValid === true) return 'Correct!'

  if (rule.startsWith('isRequired')) return 'All fields are required!'
  if (rule.startsWith('isNumber')) return 'All fields have to be numbers!'
  return 'Wrong result!'
}

const add = (a, b) => a + b
const subtract = (a, b) => a - b
const multiply = (a, b) => a * b
const OPERATIONS = {add, subtract, multiply}
const SYMBOLS = {add: '+', subtract: '-', multiply: '*'}

function initProblem() {
  return {number1: '', number2: '', result: ''}
}

const initialState = {
  problems: {
    id1: initProblem()
  },
  validations: {
    id1: initValidation(),
  },
  operation: 'add',
  lastId: 1,
}

function isResultCorrect(number1, number2, result, operation) {
  let i = (n) => parseInt(n, 10)
  return Promise.delay(1000).then(() =>
    operation(i(number1), i(number2)) === i(result) ? valid() : invalid('wrong')
  )
}

function isNumber(value) {
  return isNaN(value) ? invalid('NaN') : valid()
}

// Wrapper providing poor man's redux
export class App extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      appState: initialState
    }
  }

  dispatch = ({fn, description}) => {
    this.setState((state) => {
      console.log(description) //eslint-disable-line no-console
      console.log(//eslint-disable-line no-console
        'New app state:', cloneDeep(fn(state.appState)))
      return {appState: fn(state.appState)}
    })
  }

  render() {
    return <ValidatedMathProblems appState={this.state.appState} dispatch={this.dispatch} />
  }
}

function updateValidation(dispatch, name, data) {
  dispatch({
    fn: (state) => {
      return R.assocPath(['validations', name], {...state.validations[name], ...data}, state)
    },
    description: `Got data for ${name} validation: ${JSON.stringify(data)}`
  })
}

function validationConfig(props) {
  let {
    appState: {problems, operation},
    dispatch
  } = props

  let validations = {}
  let fields = []
  for (let id in problems) {
    let {number1, number2, result} = problems[id]
    let _fields = [`${id}-number1`, `${id}-number2`, `${id}-result`]
    validations[id] = {
      rules: {
        isRequired1: [isRequired, number1],
        isRequired2: [isRequired, number2],
        isRequiredResult: [isRequired, result],
        isNumber1: [isNumber, number1],
        isNumber2: [isNumber, number2],
        isNumberResult: [isNumber, result],
        isResultCorrect: [isResultCorrect, number1, number2, result, OPERATIONS[operation]]
      },
      fields: _fields
    }
    fields = [...fields, ..._fields]
  }

  return {
    fields,
    onValidation: (name, data) => updateValidation(dispatch, name, data),
    validations,
  }
}

class MathProblems extends React.Component {

  static propTypes = {
    appState: React.PropTypes.object.isRequired,
    dispatch: React.PropTypes.func.isRequired,
    onFormValid: React.PropTypes.func.isRequired,
    fieldEvent: React.PropTypes.func.isRequired,
  }

  reset() {
    this.props.dispatch({
      fn: (state) => initialState,
      description: 'Reset form'
    })
  }

  remove(id) {
    this.props.dispatch({
      fn: (state) => {
        let s = R.dissocPath(['problems', id], state)
        s = R.dissocPath(['validations', id], s)
        return s
      },
      description: `Remove problem for id=${id}`
    })
  }

  add() {
    this.props.dispatch({
      fn: (state) => {
        let {lastId: id} = state
        let s = R.assocPath(['problems', `id${id + 1}`], initProblem(), state)
        s = R.assocPath(['validations', `id${id + 1}`], initValidation(), s)
        s = R.assoc('lastId', id + 1, s)
        return s
      },
      description: 'Add new problem'
    })
  }

  dispatchValue(id, label, value) {
    this.props.dispatch({
      fn: (state) => R.assocPath(['problems', id, label], value, state),
      description: `Update value for id=${id} label=${label} to value=${value}`
    })
  }

  dispatchOperation(value) {
    this.props.dispatch({
      fn: (state) => R.assoc('operation', value, state),
      description: `Update operation to ${value}`
    })
  }

  renderField(id, name, placeholder) {
    let {fieldEvent} = this.props
    let field = `${id}-${name}`
    let {appState: {problems, validations}} = this.props

    let value = problems[id][name]
    let _style = style(validations[id])

    return (
      <FormGroup controlId={name} validationState={_style}>
        <FormControl
          type="text"
          placeholder={placeholder}
          onChange={(e) => {
            this.dispatchValue(id, name, e.target.value)
            fieldEvent('change', field)
          }}
          onBlur={(e) => fieldEvent('blur', field)}
          value={value}
        />
        <FormControl.Feedback />
      </FormGroup>
    )
  }

  render() {
    let {
      appState: {
        problems,
        operation,
        validations,
      },
    } = this.props

    let problemIds = Object.keys(problems)

    return (
      <div>
        <Panel>
          <form onSubmit={
            (e) => {
              e.preventDefault()
              this.props.fieldEvent('submit')
              this.props.onFormValid((valid) => {
                if (valid) {
                  alert('Everything correct!') //eslint-disable-line no-alert
                  this.props.fieldEvent('reset')
                  this.reset()
                } else {
                  alert('Something is wrong.') //eslint-disable-line no-alert
                }
              })
            }
          }
          style={{display: 'flex', flexDirection: 'column'}}
          >
            <FormGroup style={{alignSelf: 'flex-start', flex: '0 0'}} controlId="formControlsSelect">
              <ControlLabel>Select operation</ControlLabel>
              <FormControl
                componentClass="select"
                placeholder="select"
                value={operation}
                onChange={(e) => this.dispatchOperation(e.target.value)}
              >
                <option value="add">Addition</option>
                <option value="multiply">Multiplication</option>
                <option value="subtract">Subtraction</option>
              </FormControl>
            </FormGroup>
            {problemIds.map((id) =>
              <div key={id} style={
                {display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'stretch'}
              }>
                {this.renderField(id, 'number1', '')}
                <Button style={{height: '35px', margin: '0 10px'}}> {SYMBOLS[operation]} </Button>
                {this.renderField(id, 'number2', '')}
              <Button style={{height: '35px', margin: '0 10px'}}> = </Button>
                {this.renderField(id, 'result', 'Result')}
                <Button style={{height: '35px', margin: '0 10px'}} onClick={() => this.remove(id)}> X </Button>
                <div style={
                  {display: 'flex', alignItems: 'center', justifyContent:
                    'center', textAlign: 'center', height: '35px'}
                }>
                  {validationMessage(validations[id])}
                </div>
              </div>
            )}
            <div style={
              {display: 'flex', flexDirection: 'row', alignItems: 'center',
                justifyContent: 'flex-start', height: '35px'}
            }>
              <Button style={{marginRight: '20px'}} bsStyle="success" onClick={() => this.add()}>
                Add another
              </Button>
              <Button bsStyle="primary" type="submit"> Submit </Button>
            </div>
          </form>
        </Panel>
      </div>
    )
  }
}

const ValidatedMathProblems = validated(validationConfig)(MathProblems)
