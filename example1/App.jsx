'use strict'

import React from 'react'
import Promise from 'bluebird'
import {
  validated,
  withFancySubmit,
  initial,
  IsEmail,
  IsRequired,
  HasNumber,
  HasLength,
  AreSame} from '../lib/validation'
import {Input, Grid, Row, Col, Panel, Button} from 'react-bootstrap'
import {valid, invalid} from '../lib/Rules'
import {cloneDeep} from 'lodash'

function IsUnique({value, time}) {
  let isValid = value.indexOf('used') === -1
  let response = isValid ? valid() : invalid('The value is not unique.')
  return Promise.delay(time).then(() => response)
}

function time() {
  return new Date().getTime()
}

// TODOMH move to the correct place
function validity(validationData) {
  let result = true
  for (let name in validationData) {
    let v = validationData[name].validationResult.valid
    if (v === false) {
      return false
    }
    if (v == null) {
      result = null
    }
  }
  return result
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

// TODOMH retext flux -> redux
// Wrapper providing poor man's flux
export class App extends React.Component {

  constructor(props) {
    super(props)
    // TODOMH why not take this also from the validation library? Also, I'd rename it to:
    // initField() and initValidation()
    let init = {value: '', lastBlur: null, lastChange: null}
    this.state = {
      appState: {
        lastSumbit: null,
        fields: {
          email: {...init},
          password: {...init},
          rePassword: {...init},
        },
        validations: {
          email: initial(),
          password: initial(),
          passwordsMatch: initial(),
        }
      }
    }
  }

  dispatch = ({fn, description}) => {
    this.setState((state) => {
      console.log(description) //eslint-disable-line no-console
      console.log(//eslint-disable-line no-console
        `New app state: ${JSON.stringify(fn(this.state.appState))}`
      )
      return {appState: fn(state.appState)}
    })
  }

  render() {
    return <Registration appState={this.state.appState} dispatch={this.dispatch} />
  }
}

/* TODOMH: structure the code such as:

   const validations = (props) => long factory for validation config

   @validated(validations)
   class Component { ... }
*/

@validated((props) => {
  let {
    appState: {
      fields,
      fields: {
        lastSubmit,
        email: {value: email},
        password: {value: password},
        rePassword: {value: rePassword},
      }
    },
    dispatch
  } = props

  // TODOMH: put to outer scope
  function updateValidationData(name) {
    return (data) => {
      dispatch({
        fn: (state) => {
          // TODOMH what about:
          // newState = {...state, validations: {...state.validations, [name]: {...state.validations[name], ...data}}}
          // or:
          // newState = R.assocPath(['validations', name], {...state.validations[name], ...data}, state)
          // R being 'ramda' module

          // poor man's immutability
          let newState = cloneDeep(state)
          newState.validations[name] = {...state.validations[name], ...data}
          return newState
        },
        description: `Got data for ${name} validation: ${JSON.stringify(data)}`
      })
    }
  }

  return {
    // TODOMH make 'lastsubmit' global, as we discussed
    email: {
      rules: {
        // TODOMH is this 'very bad' already explicitely checked for?
        //isRequired: {fn: () => IsRequired({value: email})}, // very bad
        isRequired: {fn: IsRequired, args: {value: email}},
        isEmail: {fn: IsEmail, args: {value: email}},
        isUnique: {fn: IsUnique, args: {time: 1000, value: email}}
      },
      fields: {email: {...fields.email, lastSubmit}},
      // TODOMH rename updateValidationData -> updateValidation
      onValidation: updateValidationData('email'),
    },
    password: {
      rules: {
        isRequired: {fn: IsRequired, args: {value: password}},
        hasLength: {fn: HasLength, args: {value: password, min: 6, max: 10}},
        hasNumber: {fn: HasNumber, args: {value: password}}
      },
      fields: {password: {...fields.password, lastSubmit}},
      onValidation: updateValidationData('password'),
    },
    passwordsMatch: {
      rules: {
        areSame: {fn: AreSame, args: {value1: password, value2: rePassword}},
      },
      fields: {
        password: {...fields.password, lastSubmit},
        rePassword: {...fields.rePassword, lastSubmit}
      },
      onValidation: updateValidationData('passwordsMatch'),
    },
  }
})
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
          // poor man's immutability
          let newState = cloneDeep(state)
          newState.fields[name] = {...state.fields[name], ...data}
          return newState
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
    // TODOMH vs -> validations ?
    let vs = this.props.appState.validations

    return (
      <div>
        <Panel header={"Registration"}>
          <form onSubmit={
            (e) => {
              e.preventDefault()
              this.props.dispatch({
                fn: (state) => {
                  // poor man's immutability
                  let newState = cloneDeep(state)
                  // set info about lastSubmit to app state, the rest is taken care of by the
                  // withFancySubmit h.o.c. (see above)
                  newState.fields.lastSubmit = time()
                  // TODOMH: make submit work such as:
                  //this.props.onValidForm((valid, props) => {
                  //  if (valid) {
                  //    //...
                  //  }
                  //})
                  return newState
                },
                description: `Updating lastSubmit`
              })
            }
          }>
            <Grid>
              <Row>
                <Col md={4}>
                  {this.renderField('email', 'E-mail', style(vs.email))}
                </Col>
                <Col md={4}>
                  {validationMessage(vs.email)}
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  {this.renderField('password', 'Password', style(vs.password))}
                </Col>
                <Col md={4}>
                  {validationMessage(vs.password)}
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  {this.renderField('rePassword', 'Repeat password', style(vs.passwordsMatch))}
                </Col>
                <Col md={4}>
                  {validationMessage(vs.passwordsMatch)}
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
