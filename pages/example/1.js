import React from 'react'
import Promise from 'bluebird'
import update from 'immutability-helper'
import validator from 'validator'
import style from './style'
import {validated} from '../../lib'

class App extends React.Component {
  state = {
    fields: {
      email: '',
      password: '',
      rePassword: ''
    },
  }

  fieldChange = (field, value) => {
    this.setState(update(this.state, {fields: {[field]: {$set: value}}}))
  }

  render() {
    return (<Form
      fields={this.state.fields}
      onChange={this.fieldChange}
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
  const {email, password, rePassword} = props.fields

  return {
    fields: ['email', 'password', 'rePassword'],

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
    const {fields, onChange, onValid, onInvalid, $field, $validation} = this.props
    return (
      <form className={style}>
        <label>Email</label>
        <input type="text" value={fields.email}
          {...$field('email', (e) => onChange('email', e.target.value))}/>
        {$validation.email.show && <span>{$validation.email.error.reason}</span>}

        <label>Password</label>
        <input type="text" value={fields.password}
          {...$field('password', (e) => onChange('password', e.target.value))}/>
        {$validation.password.show && <span>{$validation.password.error.reason}</span>}

        <label>Repeat password</label>
        <input type="text" value={fields.rePassword}
          {...$field('rePassword', (e) => onChange('rePassword', e.target.value))}/>
        {$validation.rePassword.show && <span>{$validation.rePassword.error.reason}</span>}

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
