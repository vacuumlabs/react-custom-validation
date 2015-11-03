'use strict'

import React from 'react'
import Promise from 'bluebird'
import {
  Validate,
  IsEmail,
  IsRequired,
  HasNumber,
  HasLength} from '../lib/validation'
import {Input, Grid, Row, Col, Panel, Button} from 'react-bootstrap'
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
    this.__validationData = []
  }

  setFieldState(field, newState) {
    this.setState({[field]: {...this.state[field], ...newState}})
  }

  handleValidation = (field) => ({validationResult, showValidation}) => {
    this.__validationData.unshift({validationResult, showValidation})
    let {message, showValidation: show, valid} = {...this.state[field]}

    if (validationResult != null) {
      valid = validationResult.valid
      let {error, rule} = validationResult
      if (valid == null) message = 'Validating...'
      if (valid === true) message = 'Valid!'
      if (valid === false) message = `Invalid (rule: ${rule}, error: ${error})`
    }

    show = showValidation != null ? showValidation : show

    this.setFieldState(field, {message, showValidation: show, valid})
  }

  showValidation = (field) => () => {
    this.setFieldState(field, {showValidation: true})
  }

  renderMessage(field) {
    let {showValidation, message} = this.state[field]
    return showValidation ? message : null
  }

  allValid() {
    for (let field of ['email', 'password', 'rePassword']) {
      if (this.state[field].valid === false) return false
    }
    return true
  }

  showAllValidations() {
    for (let field of ['email', 'password', 'rePassword']) {
      this.showValidation(field)
    }
  }

  renderField(name, label, data) {
    let {value, valid, message, showValidation} = data
    let style
    if (showValidation && valid === true) style = 'success'
    if (showValidation && valid === false) style = 'error'

    let handleChange = (e) => {
      this.setFieldState(name, {value: e.target.value})
    }

    return (
      <Row>
        <Col md={4}>
          <Input
                type="text"
                id={name}
                label={label}
                onChange={handleChange}
                onBlur={this.showValidation(name)}
                bsStyle={style}
                hasFeedback
                value={value} />
        </Col>
        <Col md={4}>
          <div>{showValidation ? message : null}</div>
        </Col>
      </Row>)
  }

  render() {
    let {
      email: {value: email},
      password: {value: password},
      rePassword: {value: rePassword}} = this.state

    return (
      <div>
        <Panel header={"Registration"}>
          <form onSubmit={this.onSubmit}>
            <Grid>
              {this.renderField('email', 'E-mail', this.state.email)}
              <Validate onValidation={this.handleValidation('email')} >
                <IsRequired key="is-required" value={email} />
                <IsEmail key="is-email" value={email} />
                <IsUnique time={1000} value={email} />
              </Validate>

              {this.renderField('password', 'Password', this.state.password)}
              <Validate
                onValidation={this.handleValidation('password')}
                args={{value: password}}
              >
                <IsRequired key='is-required' />
                <HasLength key='has-length' min={6} max={10} />
                <HasNumber key='has-number' />
              </Validate>

              {this.renderField(
                'rePassword', 'Repeat password', this.state.rePassword)}
              <Validate
                onValidation={this.handleValidation('rePassword')}
                needTouch={[['are-same', 'value1'], ['are-same', 'value2']]} >
                <AreSame key='are-same' value1={password} value2={rePassword} />
              </Validate>

              <Row>
                <Col>
                  <Button
                    bsStyle="primary"
                    onClick={() => this.showAllValidations()}
                    disabled={!this.allValid()}>
                    Register
                  </Button>
                </Col>
              </Row>
            </Grid>
          </form>
        </Panel>
        <Panel header={"Validation Data"}>
          {this.__validationData.map((data) => {
            return <div>{JSON.stringify(data)}</div>
          })}
        </Panel>
      </div>
    )
  }
}
