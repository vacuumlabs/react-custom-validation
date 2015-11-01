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
    for (let field of ['email', 'password', 'rePassword']) {
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
    let {
      email: {value: email},
      password: {value: password},
      rePassword: {value: rePassword}} = this.state

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
          onBlur={this.showValidation('password')}
          type="text"
          value={password} />
        <div>{this.renderMessage('password')}</div>
        <Validate
          onValidation={this.handleValidation('password')}
          args={{value: password}}
        >
          <IsRequired key='is-required' />
          <HasLength key='has-length' min={6} max={10} />
          <HasNumber key='has-number' />
        </Validate>

        <label htmlFor="re-password">Repeat password: </label>
        <input
          id="re-password"
          onChange={this.handleChange('rePassword')}
          onBlur={this.showValidation('rePassword')}
          type="text"
          value={rePassword} />
        <div>{this.renderMessage('rePassword')}</div>
        <Validate
          onValidation={this.handleValidation('rePassword')}
          needTouch={[['are-same', 'value1'], ['are-same', 'value2']]} >
          <AreSame key='are-same' value1={password} value2={rePassword} />
        </Validate>
      </div>
    )
  }
}
