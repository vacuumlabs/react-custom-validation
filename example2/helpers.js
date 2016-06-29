export function style(validationData) {
  let {result: {valid}, show} = validationData
  if (show && valid === true) return 'success'
  if (show && valid === false) return 'error'
  return null
}

export function validationMessage(validationData) {
  let {result: {valid, error, rule}, show} = validationData
  let message = {
    null: 'Much validating...',
    true: 'WOW valid!',
    false: `LOL invalid (rule: ${rule}, error: ${error})`
  }[valid]

  return show ? message : null
}
