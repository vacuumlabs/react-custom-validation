//import Promise from 'bluebird'
import validator from 'validator'

function valid() {
  return {valid: true, reason: null}
}

function invalid(reason) {
  return {valid: false, reason}
}

export function IsEmail({value}) {
  return (validator.isEmail(value)) ?
    valid() : invalid('Please enter a valid email.')
}

export function IsRequired({value}) {
  return (value != null && value.length > 0) ?
    valid() : invalid('This field is required')
}

export function HasNumber({value}) {
  return (value != null && value.match(/.*[0-9]+.*/i) != null) ?
    valid() : invalid('This field should contain at least one number.')
}

export function HasLength({value, min, max}) {
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
