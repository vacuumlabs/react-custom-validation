'use strict'

import React from 'react'
import Promise from 'bluebird'
import {
  Validate,
  IsEmail,
  IsRequired,
  HasNumber,
  HasLength,
  AreSame} from '../lib/validation'
import {Input, Image, Grid, Row, Col, Panel, Button} from 'react-bootstrap'


function IsUnique({value, time}) {
  let isValid = value.indexOf('used') === -1
  let response = isValid ? {valid: true} : {valid: false, reason: 'The value is not unique.'}
  return Promise.delay(time).then(() => response)
}

export class App extends React.Component {

  fields = ['email', 'password', 'rePassword']

  constructor(props) {
    super(props)
    let state = {}
    for (let field of this.fields) {
      state[field] = {value: '', message: '', showValidation: false}
    }

    this.state = state
    this.__validationData = []
  }

  static propTypes = {
    checkTime: React.PropTypes.any,
    typingPace: React.PropTypes.any,
  }

  setFieldState(field, newState) {
    this.setState({[field]: {...this.state[field], ...newState}})
  }

  handleValidation = (field) => ({validationResult, showValidation}) => {
    if (field === 'email') {
      this.__validationData.unshift({validationResult, showValidation})
    }
    let {message, showValidation: show, valid} = {...this.state[field]}

    if (validationResult != null) {
      valid = validationResult.valid
      if (valid == null) message = <Image src="./spinning-wheel.gif" width={30} />
      if (valid === true) message = 'Valid!'
      if (valid === false) message = `Invalid: ${validationResult.error}`
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
    for (let field of this.fields) {
      if (!this.state[field].valid) return false
    }
    return true
  }

  showAllValidations() {
    for (let field of this.fields) {
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
                value={value} />
        </Col>
        <Col md={8}>
          <div style={{paddingTop: 30}}>{showValidation ? message : null}</div>
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
              <Validate
                onValidation={this.handleValidation('email')}
                maxTypingPace={this.props.typingPace}
              >
                <IsRequired key="is-required" value={email} />
                <IsEmail key="is-email" value={email} />
                <IsUnique key="is-unique"
                  time={this.props.checkTime} value={email} />
              </Validate>

              {this.renderField('password', 'Password', this.state.password)}
              <Validate
                onValidation={this.handleValidation('password')}
                args={{value: password}}
              >
                <IsRequired key='is-required' />
                <HasLength key='has-length' min={6} />
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
                <Col md={4}>
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
        <Panel collapsible header={"Validation Data"}>
          {this.__validationData.map((data, i) => {
            return <div key={i}>{JSON.stringify(data)}</div>
          })}
        </Panel>
      </div>
    )
  }
}
