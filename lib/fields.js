import update from 'immutability-helper'
import {isArray} from 'lodash'
import {assertSpec} from './helpers'
import {initialFieldsState} from './state'

const EVENTS = ['change', 'blur', 'submit', 'reset']

function normalizeDebounce(state, field, event, debounce) {
  if (event !== 'change') {
    // disallow debounce for other event types
    assertSpec(
      debounce === false || debounce === 0 || debounce == null,
      'Nonzero debounce is allowed only for change event',
      debounce,
      'false or 0 or null'
    )
    return 0
  }

  assertSpec(
    typeof debounce === 'number' || typeof debounce === 'boolean' || debounce  == null,
    'Invalid debounce.',
    debounce,
    'number or boolean or null'
  )

  if (debounce === true || debounce == null) {
    // use default debounce set in (normalized) config
    let {config: {typingDebounce: {before, after}}, fields: {blur, submit}} = state
    return (field in blur || field in submit) ? after : before
  } else if (debounce === false) {
    return 0
  } else {
    return debounce
  }
}

function normalizeFields(state, fields) {
  let result = fields == null ? state.config.fields : fields
  result = isArray(result) ? result : [result]

  assertSpec(
    isArray(result) && result.every((f) => typeof f === 'string'),
    'Invalid field.',
    fields,
    'string or Array<string> or null'
  )
  return result
}

function withoutKeys(keys) {
  return (obj) => {
    let result = {...obj}
    for (let k of keys) {
      delete result[k]
    }
    return result
  }
}

function withKeys(keys, value) {
  return (obj) => {
    let result = {...obj}
    for (let k of keys) {
      result[k] = value
    }
    return result
  }
}

function handleReset(state, fields) {
  if (fields == null) {
    // delete all recorded field events
    return update(state, {fields: {$set: initialFieldsState}})
  } else {
    let _fields = normalizeFields(state, fields)
    return update(state, {
      fields: {
        change: {$apply: withoutKeys(_fields)},
        blur: {$apply: withoutKeys(_fields)},
        submit: {$apply: withoutKeys(_fields)},
        isTyping: {$apply: withoutKeys(_fields)}
      }
    })
  }
}

export function handleFieldEvent(dispatchUpdate, field, event, debounce) {
  dispatchUpdate((state) => {
    assertSpec(EVENTS.indexOf(event) >= 0, 'Invalid event.', event, `one of ${EVENTS}`)

    if (event === 'reset') {
      return handleReset(state, field)
    }

    let fields = normalizeFields(state, field)
    let debounces = {}
    for (let f of fields) {
      let nd = normalizeDebounce(state, f, event, debounce)
      if (nd > 0) {
        debounces[f] = nd
      }
    }
    let now = new Date().getTime()

    let updateDesc = {[event]: {$apply: withKeys(fields, true)}}

    for (let f in debounces) {
      let d = debounces[f]
      if (updateDesc.isTyping == null) {
        updateDesc.isTyping = {}
      }
      updateDesc.isTyping[f] = {$set: now + d}

      setTimeout(() => dispatchUpdate((laterState) => {
        let isTyping = laterState.fields.isTyping
        if (isTyping[f] === now + d) {
          return update(laterState, {fields: {isTyping: {$apply: withoutKeys([f])}}})
        } else {
          return laterState
        }
      }), d)
    }

    if (event === 'submit' || event === 'blur') {
      updateDesc.isTyping = {$apply: withoutKeys(fields)}
    }

    return update(state, {fields: updateDesc})
  })
}

export function shouldShowValidation(validationFields, fields) {
  let {change, blur, submit, isTyping} = fields
  let [dependsOn, needTouch] = validationFields
  let touched = needTouch.every((f) => (f in change || f in blur || f in submit))
  let typing = dependsOn.some((f) => isTyping[f] != null)
  return touched && !typing
}
