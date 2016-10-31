import React from 'react'
import Promise from 'bluebird'
import update from 'immutability-helper'
import {validated} from '../../lib'

const add = (a, b) => a + b
const subtract = (a, b) => a - b
const multiply = (a, b) => a * b

const OPERATIONS = [
  {id: 'add', symbol: '+', fn: add, desc: 'Addition'},
  {id: 'multiply', symbol: '*', fn: multiply, desc: 'Multiplication'},
  {id: 'subtract', symbol: '-', fn: subtract, desc: 'Subtraction'},
]

update.extend('$delete', function(key, object) {
  let o = {...object}
  delete o[key]
  return o
})

class App extends React.Component {
  state = {
    problems: {
      id1: {number1: '', number2: '', result: ''}
    },
    operation: OPERATIONS[0],
    lastId: 1,
  }

  numberChange = (id, number, value) => {
    this.setState(update(this.state, {problems: {[id]: {[number]: {$set: value}}}}))
  }

  operationChange = (value) => {
    let operation = OPERATIONS.filter((o) => o.id === value)[0]
    this.setState({operation})
  }

  addProblem = () => {
    let nextId = this.state.lastId + 1
    this.setState(update(this.state, {
      problems: {[`id${nextId}`]: {$set: {number1: '', number2: '', result: ''}}},
      lastId: {$set: nextId}
    }))
  }

  removeProblem = (id) => {
    this.setState(update(this.state, {problems: {$delete: id}}))
  }

  render() {
    return (<Math
      problems={this.state.problems}
      operation={this.state.operation}
      operations={OPERATIONS}
      numberChange={this.numberChange}
      operationChange={this.operationChange}
      addProblem={this.addProblem}
      removeProblem={this.removeProblem}
      onValid={() => alert('Everything correct!')} // eslint-disable-line no-alert
      onInvalid={() => alert('Something is wrong.')} // eslint-disable-line no-alert
    />)
  }
}

class Math extends React.Component {

  renderSingle(id) {
    let {problems, validation, operation, numberChange, removeProblem, connectField} = this.props
    let {number1, number2, result} = problems[id]
    let {isValid, error: {reason}, show} = validation[id]

    let validationMessage = {
      true: 'Correct!',
      null: 'Computation in progress...',
      false: reason
    }[isValid]
    let style = {
      true: {color: 'green'},
      null: {},
      false: {color: 'red'}
    }[isValid]

    return (
      <div key={id}>
        <input
          type="text"
          value={number1}
          {...connectField(`${id}-number1`, (e) => numberChange(id, 'number1', e.target.value))}
        />
        {operation.symbol}
        <input
          type="text"
          value={number2}
          {...connectField(`${id}-number2`, (e) => numberChange(id, 'number2', e.target.value))}
        />
        =
        <input
          type="text"
          value={result}
          {...connectField(`${id}-result`, (e) => numberChange(id, 'result', e.target.value))}
        />
        <button type="button" onClick={(e) => removeProblem(id)}>X</button>
        {show && <span style={style}>{validationMessage}</span>}
      </div>
    )
  }

  render() {
    let {problems, operationChange, operation, operations, addProblem} = this.props
    let problemIds = Object.keys(problems)

    return (
      <form
        onSubmit={
          (e) => {
            e.preventDefault()
            let {onValid, onInvalid} = this.props
            this.props.fieldEvent('submit')
            this.props.submit(onValid, onInvalid)
          }
        }
      >
        <div>
          <label>Select operation</label>
          <select
            value={operation.id}
            onChange={(e) => operationChange(e.target.value)}
          >
            {operations.map((o) => <option key={o.id} value={o.id}>{o.desc}</option>)}
          </select>
        </div>
          {problemIds.map((id) => this.renderSingle(id))}
        <div>
          <button type="button" onClick={(e) => addProblem()}> Add another </button>
          <button type="submit"> Check </button>
        </div>
      </form>
    )
  }
}

function isNumber(value) {
  return (value === '' || isNaN(value)) ? 'All fields must be numbers!' : null
}

function isResultCorrect(number1, number2, result, operation) {
  let i = (n) => parseInt(n, 10)
  return Promise.delay(3000).then(() =>
    operation(i(number1), i(number2)) === i(result) ? null : 'Wrong!'
  )
}

function validationConfig(props) {
  let {problems, operation} = props
  let validations = {}
  let fields = []

  for (let id in problems) {
    let {number1, number2, result} = problems[id]
    let _fields = [`${id}-number1`, `${id}-number2`, `${id}-result`]
    validations[id] = {
      rules: {
        isNumber1: [isNumber, number1],
        isNumber2: [isNumber, number2],
        isNumberResult: [isNumber, result],
        isResultCorrect: [isResultCorrect, number1, number2, result, operation.fn]
      },
      fields: _fields
    }
    fields = [...fields, ..._fields]
  }

  return {fields, validations}
}

Math = validated(validationConfig)(Math)

export default () => <App />
