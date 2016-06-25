// Returns initial status of validation data as provided by this library.
// It is recommended (but not necessary) to keep the validation data in the app
// state structured in the same way.
export function initValidation() {
  return {validationResult: {valid: null}, showValidation: false}
}

// Returns initial status of field data as required by this validation library.
// It is recommended (but not necessary) to keep the field data in the app
// state structured in the same way.
export function initField(lastSubmit) {
  let result = {value: '', lastBlur: null, lastChange: null}
  if (lastSubmit === true) {
    result.lastSubmit = null
  }
  return result
}

// Returns validity of multiple validation results. The result is false if any
// single validation contains valid = false, null if any validation contains
// valid = null (and none are false) and true otherwise. The argument
// `validationData` should be a map of validation results as provided by this
// library.
export function validity(validationData) {
  let result = true
  for (let name in validationData) {
    let v = validationData[name].validationResult.valid
    if (v === false) {
      return false
    }
    if (v == null) {
      result = null
    }
  }
  return result
}

export function eventType({prevFields, fields}) {
  for (let f in fields) {
    let {lastSubmit: s = 0, lastBlur: b = 0, value: v} = fields[f] || {}
    let {lastSubmit: ps = 0, lastBlur: pb = 0, value: pv} = prevFields[f] || {}

    if (v !== pv) {
      return 'change'
    } else if (s > ps) {
      return 'submit'
    } else if (b > pb) {
      return 'blur'
    }
  }
  return null
}
