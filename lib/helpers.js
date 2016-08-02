// Returns initial status of validation data as provided by this library.
// It is recommended (but not necessary) to keep the validation data in the app
// state structured in the same way.
export function initValidation() {
  return {result: {valid: null}, show: false}
}

// Returns validity of multiple validation results. The result is false if any
// single validation contains valid = false, null if any validation contains
// valid = null (and none is false) and true otherwise. The argument
// `validationData` should be a dict of validation results as provided by this
// library.
export function validity(validationData) {
  let result = true
  for (let name in validationData) {
    let v = validationData[name].result.valid
    if (v === false) {
      return false
    }
    if (v == null) {
      result = null
    }
  }
  return result
}

// Returns valid validation result. Useful for writing custom rule functions.
export function valid() {
  return {valid: true, reason: null}
}

// Returns invalid validation result with specified reason. Useful for writing
// custom rule functions.
export function invalid(reason) {
  return {valid: false, reason}
}
