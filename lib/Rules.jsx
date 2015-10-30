import Promise from 'bluebird'
import validator from 'validator'

export function IsEmail(value, {msg}) {
  return Promise.resolve(
    validator.isEmail(value) ||
    msg ||
    'Please enter a valid email.')
}

export function IsRequired(value, {msg}) {
  return Promise.resolve(
    (value != null && value.length > 0) ||
    msg ||
    'This field is required.')
}

export function HasNumber(value, {msg}) {
  let isValid = value == null || value.match(/.*[0-9]+.*/i) === null
  msg = msg || 'This field should contain at least one number.'
  return Promise.resolve(isValid ? msg : true)
}

export function HasLength(value, {msg, min, max}) {
  let isValid = !value || (((min == null) ||
    (value.length >= min)) && ((max == null) || (value.length <= max)))
  return Promise.resolve(
    isValid ||
    msg ||
    `Length should be between ${min} and ${max}`)
}
