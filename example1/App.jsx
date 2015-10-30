'use strict'

import React from 'react'
import Promise from 'bluebird'
import {
  Validate,
  IsEmail,
  IsRequired,
  HasNumber,
  HasLength} from '../lib/validation'
import {valid, invalid} from '../lib/Rules'


function IsUnique({value, time}) {
  let isValid = value.indexOf('used') === -1
  let response = isValid ? valid() : invalid('The value is not unique.')
  return Promise.delay(time).then(() => response)
}

function AreSame({value1, value2}) {
  return value1 === value2 ?
    valid() : invalid('Values have to match.')
}

export class App extends React.Component {

  constructor(props) {
    super(props)
    let state = {}
    for (let field of ['email', 'password']) {
      state[field] = {value: '', message: '', showValidation: false}
    }
    this.state = state
  }

  setFieldState(field, newState) {
    this.setState({[field]: {...this.state[field], ...newState}})
  }

  handleChange = (field) => (e) => {
    this.setFieldState(field, {value: e.target.value})
  }

  handleValidation = (field) => ({validationResult, showValidation}) => {
    let {message: msg, showValidation: show} = {...this.state[field]}

    if (validationResult != null) {
      let {valid, error, rule} = validationResult
      if (valid == null) msg = 'Validating...'
      if (valid === true) msg = 'Valid!'
      if (valid === false) msg = `Invalid (rule: ${rule}, error: ${error})`
    }

    show = showValidation != null ? showValidation : show

    this.setFieldState(field, {message: msg, showValidation: show})
  }

  showValidation = (field) => () => {
    this.setFieldState(field, {showValidation: true})
  }

  renderMessage(field) {
    let {showValidation, message} = this.state[field]
    return showValidation ? message : null
  }

  render() {
    let {email: {value: email}, password: {value: password}} = this.state

    return (
      <div>
        <label htmlFor="email">Email: </label>
        <input
          id="email"
          onChange={this.handleChange('email')}
          onBlur={this.showValidation('email')}
          type="text"
          value={email} />
        <div>{this.renderMessage('email')}</div>
        <Validate onValidation={this.handleValidation('email')} >
          <IsRequired key="is-required" value={email} />
          <IsEmail key="is-email" value={email} />
          <IsUnique time={1000} value={email} />
        </Validate>

        <label htmlFor="password">Password: </label>
        <input
          id="password"
          onChange={this.handleChange('password')}
          type="text"
          value={password} />
        <div>{this.renderMessage('password')}</div>
        <Validate
          onValidation={this.handleValidation('password')}
          args={{value: password}}
        >
          <IsRequired key='is-required' />
          <HasLength min={6} max={10} />
          <HasNumber />
        </Validate>

        <Validate onValidation={this.handleValidation('slowValidation')} >
          {[1000, 2000, 3000].map((time) =>
            <IsUsed key={`is-used-${time}`} value='something' />)}
        </Validate>

      </div>
    )
  }
}
