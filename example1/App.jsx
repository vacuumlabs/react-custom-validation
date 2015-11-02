'use strict'

import React from 'react'
import {
  Validate,
  IsEmail,
  IsRequired,
  HasNumber,
  HasLength} from '../lib/validation'

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

  handleValidation = (field) => (validity) => {
    let {valid, error, rule, showValidation} = validity
    let message
    if (valid === null) message = 'Validating...'
    if (valid === true) message = 'Valid!'
    if (valid === false) message = `Invalid (rule: ${rule}, error: ${error})`

    this.setFieldState(field, {message, showValidation})
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
          type="text"
          value={email} />
        <div>{this.renderMessage('email')}</div>
        <Validate onValidation={this.handleValidation('email')} >
          <IsRequired key="is-required" value={email} />
          <IsEmail key="is-email" value={email} />
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
      </div>
    )
  }
}
