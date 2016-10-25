'use strict'

import React from 'react'
import Promise from 'bluebird'
import {
  valid,
  invalid,
  validated,
  initValidation,
} from '../lib'
import {
  FormGroup,
  FormControl,
  ControlLabel,
  Grid,
  Row,
  Col,
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
  let {isValid, show} = validationData
  let message = {
    null: 'Computing...',
    true: 'Correct!',
    false: 'Wrong!'
  }[isValid]

  return show ? message : null
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
  return Promise.delay(1000).then(() =>
    operation(number1, number2) === result ? valid() : invalid('wrong')
  )
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
          type="number"
          placeholder={placeholder}
          onChange={(e) => {
            this.dispatchValue(id, name, parseInt(e.target.value, 10))
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
          }>
            <Grid>
              <Row>
                <Col md={6}>
                  <FormGroup controlId="formControlsSelect">
                    <ControlLabel>Select operation</ControlLabel>
                    <FormControl
                      componentClass="select"
                      placeholder="select"
                      onChange={(e) => this.dispatchOperation(e.target.value)}
                    >
                      <option value="add">Addition</option>
                      <option value="multiply">Multiplication</option>
                      <option value="subtract">Subtraction</option>
                    </FormControl>
                  </FormGroup>
                </Col>
              </Row>
              {problemIds.map((id) =>
                <Row key={id}>
                  <Col md={2}>
                    {this.renderField(id, 'number1', '')}
                  </Col>
                  <Col md={1}> <Button> {SYMBOLS[operation]} </Button> </Col>
                  <Col md={2}>
                    {this.renderField(id, 'number2', '')}
                  </Col>
                  <Col md={1}> <Button> = </Button> </Col>
                  <Col md={2}>
                    {this.renderField(id, 'result', 'Result')}
                  </Col>
                  <Col md={1}>
                    <Button onClick={() => this.props.remove(id)}> X </Button>
                  </Col>
                  <Col md={5}>
                    {validationMessage(validations[id])}
                  </Col>
                </Row>
              )}
              <Row>
                <Col md={2}>
                  <Button bsStyle="success" onClick={() => this.add()}> Add another </Button>
                </Col>
                <Col md={2}>
                  <Button bsStyle="primary" type="submit"> Submit </Button>
                </Col>
              </Row>
            </Grid>
          </form>
        </Panel>
      </div>
    )
  }
}

const ValidatedMathProblems = validated(validationConfig)(MathProblems)
