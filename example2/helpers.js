export function style(validationData) {
  let {isValid, show} = validationData
  if (show && isValid === true) return 'success'
  if (show && isValid === false) return 'error'
  return null
}

export function validationMessage(validationData) {
  let {isValid, error: {rule, reason}, show} = validationData
  let message = {
    null: 'Much validating...',
    true: 'WOW valid!',
    false: `LOL invalid (rule: ${rule}, error: ${reason})`
  }[isValid]

  return show ? message : null
}
