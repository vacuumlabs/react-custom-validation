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

function isUnique(value, {time}) {
  let isValid = value.indexOf('used') === -1
  let response = isValid ? valid() : invalid('The value is not unique.')
  return Promise.delay(time).then(() => response)
}

function style(validationData) {
  let {isValid, show} = validationData
  if (show && isValid === true) return 'success'
  if (show && isValid === false) return 'error'
  return null
}

function validationMessage(validationData) {
  let {isValid, error: {rule, reason}, show} = validationData
  let message = {
    null: 'Validating...',
    true: 'Valid!',
    false: `Invalid (rule: ${rule}, error: ${reason})`
  }[isValid]

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
      return R.assocPath(['validations', name], data, state)
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
    fields: Object.keys(fields), // list of all field names that require validation
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
          // Lisp-like convention, first item in the list is function, all other
          // items are arguments. Note that the function has to be constant
          // (lambda functions are not allowed)
          isRequired: [isRequired, email],
          isEmail: [isEmail, email],
          isUnique: [isUnique, email, {time: 1000}]
        },
      },
      password: {
        rules: {
          isRequired: [isRequired, password],
          hasLength: [hasLength, password, {min: 6, max: 10}],
          hasNumber: [hasNumber, password],
        },
      },
      passwordsMatch: {
        rules: {
          areSame: [areSame, password, rePassword]
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
    fieldEvent: React.PropTypes.func.isRequired,
    connectField: React.PropTypes.func.isRequired,
  }

  renderField(name, label, style, helpMsg) {
    let {connectField} = this.props

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
          {...connectField(name, (e) => update(e.target.value))}
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
            this.props.fieldEvent('submit')
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
