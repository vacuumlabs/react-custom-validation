import update from 'immutability-helper'
import {isFormValid} from './helpers'
import {initialSubmitState} from './state'

function _isFormValid(config, validationData) {
  if (config.formValid != null) {
    return config.formValid
  } else {
    return isFormValid(validationData)
  }
}

export function resetSubmit(state) {
  return update(state, {submit: {$set: initialSubmitState}})
}

export function updateSubmit(state) {
  let {submit: {isSubmitting, onValid, onInvalid}, config, validationData} = state
  if (!isSubmitting) {
    return state
  }
  let valid = _isFormValid(config, validationData)
  if (valid != null) {
    if (valid === true && onValid != null) {
      onValid()
    } else if (onInvalid != null) {
      onInvalid()
    }
    return resetSubmit(state)
  }
  return state
}

export function submit(state, onValid, onInvalid) {
  let result = update(state, {submit: {$set: {isSubmitting: true, onValid, onInvalid}}})
  return updateSubmit(result)
}
