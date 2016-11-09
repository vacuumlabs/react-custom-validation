import {isArray} from 'lodash'
import {assertSpec} from './helpers'

function normalizeFields(validationName, fields) {
  let result = fields
  if (result == null) {
    result = [validationName]
  }
  if (isArray(result) && (result.length === 0 || typeof result[0] === 'string')) {
    result = [result, result]
  }
  let wellFormed = isArray(result) &&
    result.length === 2 &&
    result.every((i) => isArray(i)) &&
    result[0].every((i) => typeof i === 'string') &&
    result[1].every((i) => typeof i === 'string')
  assertSpec(
    wellFormed,
    `Invalid validation config! Malformed fields for validation ${validationName}.`,
    fields,
    'Array<Array<string>> of length 2 or Array<string> or null'
  )
  // result has form [dependsOn, needTouch]
  //   dependsOn: Array<string>, field names that hide the validation result if
  //   the user is changing any of them (typing)
  //   needTouch: Array<string>, field names that need to be touched
  //   (changed/blurred/submitted) before the validation result is shown
  return result
}

function normalizeRules(validationName, rules) {
  assertSpec(
    isArray(rules) && rules.every((r) => isArray(r)),
    `Invalid validation config! Malformed rules for validation ${validationName}.`,
    rules,
    'Array of Arrays'
  )

  let result = []
  for (let r of rules) {
    let rr = r
    if (rr.length > 0 && typeof rr[0] === 'function') {
      rr = [r[0].name, ...r]
    }
    assertSpec(
      rr.length >= 2 && typeof rr[0] === 'string' && typeof rr[1] === 'function',
      `Invalid validation config! Malformed rule for validation ${validationName}.`,
      r,
      '[string, function, ...arguments] or [function, ...arguments]'
    )
    result.push(rr)
  }
  return result
}

function normalizeAllFields(fields) {
  let result = fields
  if (typeof result === 'string') {
    result = [result]
  }
  assertSpec(
    isArray(result) && result.every((f) => typeof f === 'string'),
    'Invalid validation config! Malformed fields.',
    fields,
    'Array<string> or string'
  )
  return result
}

export function normalizeConfig(config) {
  let {
    validations,
    fields,
    onValidation = () => {},
    debounce,
    debounce: {
      calculation = 100, // throttle validation result calculations
      typing = 2500, // before first blur/submit
      typingAfterBlur = 1000
    } = {}
  } = config

  let resultValidations = {}

  for (let name in validations) {
    let v = validations[name]
    if (isArray(v)) {
      // only rules were provided, expand the config to its full form
      v = {rules: v, fields: null}
    }

    for (let d in debounce) {
      assertSpec(
        typeof debounce[d] === 'number',
        `Invalid ${d} debounce in validation config!`,
        debounce[d],
        'number'
      )
    }

    resultValidations[name] = {
      rules: normalizeRules(name, v.rules),
      fields: normalizeFields(name, v.fields),
      debounce: calculation
    }
  }

  return {
    validations: resultValidations,
    fields: normalizeAllFields(fields),
    typingDebounce: {before: typing, after: typingAfterBlur},
    onValidation,
  }
}
