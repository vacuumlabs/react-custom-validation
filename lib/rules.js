import validator from 'validator'
import {valid, invalid} from './helpers'

export function isEmail({value}) {
  return (validator.isEmail(value)) ?
    valid() : invalid('Please enter a valid email.')
}

export function isRequired({value, msg}) {
  return (value != null && value.length > 0) ?
    valid() : invalid(msg || 'This field is required')
}

export function hasNumber({value, msg}) {
  return (value != null && value.match(/.*[0-9]+.*/i) != null) ?
    valid() : invalid(msg || 'This field should contain at least one digit.')
}

export function hasLength({value, min, max, msg, msgNull, msgShort, msgLong}) {
  if (value == null) {
    return invalid(msgNull || msg || 'Value cannot be null.')
  }
  if (min != null && value.length < min) {
    return invalid(msgShort || msg || `Length should be at least ${min}.`)
  }
  if (max != null && value.length > max) {
    return invalid(msgLong || msg || `Length should be at most ${max}.`)
  }
  return valid()
}

export function areSame({value1, value2, msg}) {
  return value1 === value2 ?
    valid() : invalid(msg || 'Values have to match.')
}
