'use strict'

import React from 'react'
import Promise from 'bluebird'
import {
  validated,
  withFancySubmit,
  initValidation,
  initField,
  validity,
  IsEmail,
  IsRequired,
  HasNumber,
  HasLength,
  AreSame} from '../lib/validation'
import {Input, Grid, Row, Col, Panel, Button} from 'react-bootstrap'
import {valid, invalid} from '../lib/Rules'
import R from 'ramda'
import {cloneDeep} from 'lodash'

function IsUnique({value, time}) {
  let isValid = value.indexOf('used') === -1
  let response = isValid ? valid() : invalid('The value is not unique.')
  return Promise.delay(time).then(() => response)
}

function time() {
  return new Date().getTime()
}

function style(validationData) {
  let {validationResult: {valid}, showValidation} = validationData
  if (showValidation && valid === true) return 'success'
  if (showValidation && valid === false) return 'error'
  return null
}

function validationMessage(validationData) {
  let {validationResult: {valid, error, rule}, showValidation} = validationData
  let message = {
    null: 'Validating...',
    true: 'Valid!',
    false: `Invalid (rule: ${rule}, error: ${error})`
  }[valid]

  return showValidation ? message : null
}

// Wrapper providing poor man's redux
export class App extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      appState: {
        lastSumbit: null,
        fields: {
          email: initField(true),
          password: initField(),
          rePassword: initField(),
        },
        validations: {
          email: initValidation(),
          password: initValidation(),
          passwordsMatch: initValidation(),
        }
      }
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
    return <Registration appState={this.state.appState} dispatch={this.dispatch} />
  }
}

function updateValidation(name, dispatch) {
  return (data) => {
    dispatch({
      fn: (state) => {
        // create new state with updated validation data, while keeping the old state the same
        return R.assocPath(['validations', name], {...state.validations[name], ...data}, state)
      },
      description: `Got data for ${name} validation: ${JSON.stringify(data)}`
    })
  }
}

// Define function describing what validations should be performed with the
// form data
function validations(props) {
  let {
    appState: {
      fields: {lastSubmit, email, password, rePassword}
    },
    dispatch
  } = props

  return {
    email: {
      rules: {
        // The `fn` argument associated with a given rule name has to be
        // constant (lambda functions are not allowed)
        isRequired: {fn: IsRequired, args: {value: email.value}},
        isEmail: {fn: IsEmail, args: {value: email.value}},
        isUnique: {fn: IsUnique, args: {time: 1000, value: email.value}}
      },
      fields: {email},
      onValidation: updateValidation('email', dispatch),
    },
    password: {
      rules: {
        isRequired: {fn: IsRequired, args: {value: password.value}},
        hasLength: {fn: HasLength, args: {value: password.value, min: 6, max: 10}},
        hasNumber: {fn: HasNumber, args: {value: password.value}}
      },
      fields: {password},
      onValidation: updateValidation('password', dispatch),
    },
    passwordsMatch: {
      rules: {
        areSame: {fn: AreSame, args: {value1: password.value, value2: rePassword.value}},
      },
      fields: {password, rePassword},
      onValidation: updateValidation('passwordsMatch', dispatch),
    },
    // Providing __lastSubmit here adds it to all field data
    __lastSubmit: lastSubmit
  }
}

@validated(validations)
// TODOMH rename to 'provideSubmit'
@withFancySubmit((props) => {
  // When user clicks on the submit button, wait until validity of the form is known (!= null) and
  // only then proceed with the onSubmit handler.
  let {appState: {fields: {lastSubmit}, validations}} = props
  return {
    formValid: validity(validations),
    lastSubmit,
    onSubmit: (valid) => {
      if (valid) {
        alert('Registration successful!') //eslint-disable-line no-alert
      } else {
        // do nothing
      }
    },
  }
})
export class Registration extends React.Component {

  static propTypes = {
    appState: React.PropTypes.object.isRequired,
    dispatch: React.PropTypes.func.isRequired,
  }

  renderField(name, label, style) {
    let update = (data) => {
      this.props.dispatch({
        fn: (state) => {
          // create new state with updated field data, while keeping the old state the same
          return R.assocPath(['fields', name], {...state.fields[name], ...data}, state)
        },
        description: `Updating field ${name} with data: ${JSON.stringify(data)}`
      })
    }

    return (
      <Input
        type="text"
        id={name}
        label={label}
        onChange={(e) => update({value: e.target.value, lastChange: time()})}
        onBlur={(e) => update({lastBlur: time()})}
        bsStyle={style}
        hasFeedback
        value={this.props.appState.fields[name].value}
      />
    )
  }

  render() {
    let vdata = this.props.appState.validations

    return (
      <div>
        <Panel header={"Registration"}>
          <form onSubmit={
            (e) => {
              e.preventDefault()
              this.props.dispatch({
                fn: (state) => {
                  // set info about lastSubmit to app state, the rest is taken care of by the
                  // withFancySubmit h.o.c. (see above)
                  //
                  // TODOMH: make submit work such as:
                  //this.props.onValidForm((valid, props) => {
                  //  if (valid) {
                  //    //...
                  //  }
                  //})
                  //
                  // create new state with updated lastSubmit, while keeping the old state the same
                  return R.assocPath(['fields', 'lastSubmit'], time(), state)
                },
                description: `Updating lastSubmit`
              })
            }
          }>
            <Grid>
              <Row>
                <Col md={4}>
                  {this.renderField('email', 'E-mail', style(vdata.email))}
                </Col>
                <Col md={4}>
                  {validationMessage(vdata.email)}
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  {this.renderField('password', 'Password', style(vdata.password))}
                </Col>
                <Col md={4}>
                  {validationMessage(vdata.password)}
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  {this.renderField('rePassword', 'Repeat password', style(vdata.passwordsMatch))}
                </Col>
                <Col md={4}>
                  {validationMessage(vdata.passwordsMatch)}
                </Col>
              </Row>

              <Row>
                <Col>
                  <Button bsStyle="primary" type="submit">
                    Register
                  </Button>
                </Col>
              </Row>
            </Grid>
          </form>
        </Panel>
      </div>
    )
  }
}
