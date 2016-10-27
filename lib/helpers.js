// Returns initial status of validation data as provided by this library.
// It is recommended (but not necessary) to keep the validation data in the app
// state structured in the same way.
export function initValidation() {
  return {isValid: null, error: {}, show: false}
}

// Returns validity of multiple validation results. The result is false if any
// single validation contains isValid = false, null if any validation contains
// isValid = null (and none is false) and true otherwise. The argument
// `validationData` should be a dict of validation results as provided by this
// library.
export function isFormValid(validationData) {
  let result = true
  for (let name in validationData) {
    let v = validationData[name].isValid
    if (v === false) {
      return false
    }
    if (v == null) {
      result = null
    }
  }
  return result
}
