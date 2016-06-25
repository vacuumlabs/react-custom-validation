// Initial status of validation data as provided by this library.
// It is recommended (but not necessary) to keep the validation data in the app
// state structured in the same way.
export function initValidation() {
  return {validationResult: {valid: null}, showValidation: false}
}

// Initial status of field data as required by this validation library.
// It is recommended (but not necessary) to keep the field data in the app
// state structured in the same way.
export function initField() {
  return {value: '', lastBlur: null, lastChange: null}
}

