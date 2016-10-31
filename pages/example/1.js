import React from 'react'
import Promise from 'bluebird'
import update from 'immutability-helper'
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
      onValidation={this.onValidation}
    />)
  }
}

const isEmail = (email) =>
  email.includes('@') ? null : 'This is not valid email.'

const isUnique = (email) => Promise.delay(1000)
  .then(() => email.includes('used') ? 'This email is already used.' : null)

const minLength = (password, length) =>
  password.length >= length ? null : 'Password too short.'

const areSame = (password, rePassword) =>
  password === rePassword ? null : 'Do not match.'

function validationConfig(props) {
  const {email, password, rePassword} = props.fields

  return {
    fields: ['email', 'password', 'rePassword'],

    validations: {
      email: {
        rules: {
          isEmail: [isEmail, email],
          isUnique: [isUnique, email]
        }
      },
      password: {
        rules: {
          minLength: [minLength, password, 6],
        }
      },
      rePassword: {
        rules: {
          areSame: [areSame, password, rePassword],
        },
        fields: ['password', 'rePassword']
      }
    },

    onValidation: props.onValidation
  }
}

class Form extends React.Component {
  render() {
    const {fields, onChange, onValid, onInvalid, connectField, validation} = this.props
    return (
      <form className={style}>
        <label>Email</label>
        <input type="text" value={fields.email}
          {...connectField('email', (e) => onChange('email', e.target.value))}/>
        {validation.email.show && <span>{validation.email.error.reason}</span>}

        <label>Password</label>
        <input type="text" value={fields.password}
          {...connectField('password', (e) => onChange('password', e.target.value))}/>
        {validation.password.show && <span>{validation.password.error.reason}</span>}

        <label>Repeat password</label>
        <input type="text" value={fields.rePassword}
          {...connectField('rePassword', (e) => onChange('rePassword', e.target.value))}/>
        {validation.rePassword.show && <span>{validation.rePassword.error.reason}</span>}

        <button onClick={(e) => {
          e.preventDefault()
          this.props.submit(onValid, onInvalid)
          this.props.fieldEvent('submit')
        }}>Sign up</button>
      </form>
    )
  }
}
Form = validated(validationConfig)(Form)

export default () => <App />
