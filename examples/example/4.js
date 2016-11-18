import React from 'react'
import Promise from 'bluebird'
import update from 'immutability-helper'
import validator from 'validator'
import style from './style1'
import {validated, initValidation} from 'react-custom-validation'

class App extends React.Component {
  state = {
    fields: {
      email: '',
      password: '',
      rePassword: ''
    },
    validations: {
      email: initValidation(),
      password: initValidation(),
      rePassword: initValidation(),
    }
  }

  fieldChange = (field, value) => {
    this.setState((s) => update(s, {fields: {[field]: {$set: value}}}))
  }

  validationChange = (name, value) => {
    this.setState((s) => update(s, {validations: {[name]: {$set: value}}}))
  }

  render() {
    return (<Form
      fields={this.state.fields}
      validations={this.state.validations}
      onChange={this.fieldChange}
      onValidation={this.validationChange}
      onValid={() => alert('Submitting...')} // eslint-disable-line no-alert
      onInvalid={() => alert('Error!')} // eslint-disable-line no-alert
    />)
  }
}

const isEmail = (email) =>
  validator.isEmail(email) ? null : 'This is not a valid email.'

const isUnique = (email) => Promise.delay(1000)
  .then(() => email.includes('used') ? 'This email is already used.' : null)

const minLength = (password, length) =>
  password.length >= length ? null : 'Password is too short.'

const areSame = (password, rePassword) =>
  password === rePassword ? null : 'Passwords do not match.'

function validationConfig(props) {
  const {onValidation, fields: {email, password, rePassword}} = props

  return {
    fields: ['email', 'password', 'rePassword'],

    onValidation,

    validations: {
      email: [
        [isEmail, email],
        [isUnique, email]
      ],
      password: [[minLength, password, 6]],
      rePassword: {
        rules: [[areSame, password, rePassword]],
        fields: ['password', 'rePassword']
      }
    },
  }
}

class Form extends React.Component {
  render() {
    const {fields, validations, onChange, onValid, onInvalid, $field} = this.props
    return (
      <form className={style}>
        <h1>Sign up</h1>
        <h5>
          Same behavior as Example 1, but different code (using onValidation)
        </h5>

        <label>Email</label>
        {validations.email.show && <span>{validations.email.error.reason}</span>}
        <input type="text" value={fields.email}
          {...$field('email', (e) => onChange('email', e.target.value))}/>

        <label>Password</label>
        {validations.password.show && <span>{validations.password.error.reason}</span>}
        <input type="password" value={fields.password}
          {...$field('password', (e) => onChange('password', e.target.value))}/>

        <label>Repeat password</label>
        {validations.rePassword.show && <span>{validations.rePassword.error.reason}</span>}
        <input type="password" value={fields.rePassword}
          {...$field('rePassword', (e) => onChange('rePassword', e.target.value))}/>

        <button onClick={(e) => {
          e.preventDefault()
          this.props.$submit(onValid, onInvalid)
        }}>Sign up</button>
      </form>
    )
  }
}
Form = validated(validationConfig)(Form)

export default () => <App />
