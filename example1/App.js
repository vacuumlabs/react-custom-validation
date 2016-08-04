'use strict'

import React from 'react'
import Promise from 'bluebird'
import {
  validated,
  initValidation,
  isFormValid,
  isEmail,
  isRequired,
  hasNumber,
  hasLength,
  areSame,
  valid,
  invalid
} from '../lib/validation'
import {
  ControlLabel,
  FormGroup,
  FormControl,
  HelpBlock,
  Grid,
  Row,
  Col,
  Panel,
  Button
} from 'react-bootstrap'
import R from 'ramda'
import {cloneDeep} from 'lodash'

function IsUnique({value, time}) {
  let isValid = value.indexOf('used') === -1
  let response = isValid ? valid() : invalid('The value is not unique.')
  return Promise.delay(time).then(() => response)
}

function style(validationData) {
  let {result: {valid}, show} = validationData
  if (show && valid === true) return 'success'
  if (show && valid === false) return 'error'
  return null
}

function validationMessage(validationData) {
  let {result: {valid, error, rule}, show} = validationData
  let message = {
    null: 'Validating...',
    true: 'Valid!',
    false: `Invalid (rule: ${rule}, error: ${error})`
  }[valid]

  return show ? message : null
}

// Wrapper providing poor man's redux
export class App extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      appState: {
        fields: {email: '', password: '', rePassword: ''},
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
    return <ValidatedRegistration appState={this.state.appState} dispatch={this.dispatch} />
  }
}

function updateValidation(dispatch, name, data) {
  dispatch({
    fn: (state) => {
      // create new state with updated validation data, while keeping the old state the same
      return R.assocPath(['validations', name], {...state.validations[name], ...data}, state)
    },
    description: `Got data for ${name} validation: ${JSON.stringify(data)}`
  })
}

function removeValidation(dispatch, name) {
  dispatch({
    // remove validation data with given name
    fn: (state) => R.dissocPath(['validations', name], state),
    description: `Remove validation ${name}`
  })
}

function validationConfig(props) {
  let {
    appState: {
      fields,
      fields: {email, password, rePassword},
      validations,
    },
    dispatch
  } = props

  return {
    fields, // key-value pairs for all fields that require validation
    formValid: isFormValid(validations),
    // specify what should happen when new validation data is available
    onValidation: (name, data) => updateValidation(dispatch, name, data),
    // onDestroy is optional, default implementation will be used if not provided
    // specify what should happen when validation `name` is no longer present
    onDestroy: (name) => removeValidation(dispatch, name),
    debounce: 100, // throttle validity computations; optional; default = 100
    validations: {
      email: {
        rules: {
          // The `fn` argument associated with a given rule name has to be
          // constant (lambda functions are not allowed)
          isRequired: {fn: isRequired, args: {value: email}},
          isEmail: {fn: isEmail, args: {value: email}},
          isUnique: {fn: IsUnique, args: {time: 1000, value: email}}
        },
        fields: 'email', // field(s) validated by this set of rules
      },
      password: {
        rules: {
          isRequired: {fn: isRequired, args: {value: password}},
          hasLength: {fn: hasLength, args: {value: password, min: 6, max: 10}},
          hasNumber: {fn: hasNumber, args: {value: password}}
        },
        fields: 'password',
      },
      passwordsMatch: {
        rules: {
          areSame: {fn: areSame, args: {value1: password, value2: rePassword}},
        },
        fields: ['password', 'rePassword'],
      },
    },
  }
}

class Registration extends React.Component {

  static propTypes = {
    appState: React.PropTypes.object.isRequired,
    dispatch: React.PropTypes.func.isRequired,
    onFormValid: React.PropTypes.func.isRequired,
    handleEvent: React.PropTypes.func.isRequired,
  }

  renderField(name, label, style, helpMsg) {
    let {handleEvent} = this.props

    let update = (value) => {
      this.props.dispatch({
        fn: (state) => {
          // create new state with updated field value, while keeping the old state the same
          return R.assocPath(['fields', name], value, state)
        },
        description: `Update field ${name} to value ${value}`
      })
    }

    return (
      <FormGroup controlId={name} validationState={style}>
        <ControlLabel>{label}</ControlLabel>
        <FormControl
          type="text"
          onChange={(e) => {
            update(e.target.value)
            handleEvent('change', name)
          }}
          onBlur={(e) => handleEvent('blur', name)}
          value={this.props.appState.fields[name]}
        />
        <FormControl.Feedback />
        <HelpBlock>{helpMsg}</HelpBlock>
      </FormGroup>
    )
  }

  render() {
    let vdata = this.props.appState.validations

    return (
      <Panel header={"Registration"}>
        <form onSubmit={
          (e) => {
            e.preventDefault()
            this.props.handleEvent('submit')
            // When user clicks on the submit button, wait until validity of
            // the form is known (!= null) and only then proceed with the
            // onSubmit handler.
            this.props.onFormValid((valid, props) => {
              if (valid) {
                // It is recommended to use props provided to the handler
                // rather than this.props, as this.props might not be up-to
                // date if the validation took too long. The form data in
                // props are guaranteed to be valid.
                let {fields: {email}} = props.appState
                alert(`Registration successful! Email=${email}`) //eslint-disable-line no-alert
              }
            })
          }
        }>
          <Grid>
            <Row>
              <Col md={5}>
                {this.renderField('email', 'E-mail', style(vdata.email), validationMessage(vdata.email))}
                {this.renderField('password', 'Password', style(vdata.password),
                  validationMessage(vdata.password))}
                {this.renderField('rePassword', 'Repeat password', style(vdata.passwordsMatch),
                  validationMessage(vdata.passwordsMatch)
                )}
                <Button bsStyle="primary" type="submit">
                  Register
                </Button>
              </Col>
            </Row>
          </Grid>
        </form>
      </Panel>
    )
  }
}

const ValidatedRegistration = validated(validationConfig)(Registration)
