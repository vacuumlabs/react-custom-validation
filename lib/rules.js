import validator from 'validator'

export function isEmail(value) {
  return (validator.isEmail(value)) ? null : 'Please enter a valid email.'
}

export function isRequired(value) {
  return (value != null && value.length > 0) ? null : 'This field is required'
}

export function hasNumber(value) {
  return (value != null && value.match(/.*[0-9]+.*/i) != null) ?
    null : 'This field should contain at least one digit.'
}

export function hasLength(value, {min, max}) {
  if (value == null) {
    'Value cannot be null.'
  }
  if (min != null && value.length < min) {
    `Length should be at least ${min}.`
  }
  if (max != null && value.length > max) {
    `Length should be at most ${max}.`
  }
  return null
}

export function areSame(value1, value2) {
  return value1 === value2 ? null : 'Values have to match.'
}
