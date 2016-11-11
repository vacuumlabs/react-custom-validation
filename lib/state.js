import {initValidation} from './helpers'

export const initialFieldsState = {
  change: {
    // fieldName: true if field was changed
  },
  blur: {},
  submit: {},
  isTyping: {
    // fieldName: timestamp in millis (until when)
  }
}

export const initialResultsState = {
  // validationName: {
  //   rules: [list of normalized rules]
  //   debounce: number
  //   lastFn: function that returns the most up-to-date validation result
  //   lastAsyncFnStart: last time (in millis) when some async rule fn was started
  //   result: {
  //     isValid: true | false | null
  //     error: {rule, reason}
  //   }
  // }
}

export const initialSubmitState = {
  isSubmitting: false,
  onValid: null,
  onInvalid: null
}

export function initialState(config) {
  let validationData = {}
  for (let name in config.validations) {
    validationData[name] = initValidation()
  }
  return {
    fields: initialFieldsState,
    results: initialResultsState,
    submit: initialSubmitState,
    validationData,
    config,
    isMounted: true
  }
}
