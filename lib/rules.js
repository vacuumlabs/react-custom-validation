import validator from 'validator'
import {valid, invalid} from './helpers'

export function isEmail({value}) {
  return (validator.isEmail(value)) ?
    valid() : invalid('Please enter a valid email.')
}

export function isRequired({value}) {
  return (value != null && value.length > 0) ?
    valid() : invalid('This field is required')
}

export function hasNumber({value}) {
  return (value != null && value.match(/.*[0-9]+.*/i) != null) ?
    valid() : invalid('This field should contain at least one digit.')
}

export function hasLength({value, min, max}) {
  if (value == null) {
    return invalid('Value cannot be null.')
  }
  if (min != null && value.length < min) {
    return invalid(`Length should be at least ${min}.`)
  }
  if (max != null && value.length > max) {
    return invalid(`Length should be at most ${max}.`)
  }
  return valid()
}

export function areSame({value1, value2}) {
  return value1 === value2 ?
    valid() : invalid('Values have to match.')
}
