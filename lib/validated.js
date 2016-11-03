import React from 'react'
import {isArray, isEqual} from 'lodash'
import {Validation} from './Validation'
import {FieldObserver} from './FieldObserver'
import {SubmitProvider} from './SubmitProvider'
import {isFormValid, initValidation, assertSpec} from './helpers'

function canUseDOM() {
  return !!(
    typeof window !== 'undefined' &&
    window.document && window.document.createElement
  )
}

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

function one(config, name, updateData) {
  let {onValidation = () => {}, debounce = 100, typingDebounce = 1000, validations} = config

  let v = validations[name]
  if (isArray(v)) {
    // only rules were provided, expand the config to its full form
    v = {rules: v, fields: null}
  }

  let result = {
    rules: normalizeRules(name, v.rules),
    fields: normalizeFields(name, v.fields)
  }

  result.onValidation = (data) => {
    onValidation(name, data)
    updateData(name, data)
  }
  result.debounce = debounce
  result.typingDebounce = typingDebounce
  if (result.fields == null) {
    result.fields = [name]
  }
  if (typeof result.fields === 'string') {
    result.fields = [result.fields]
  }
  return result
}

export function validated(getConfig) {
  return (Component) => class extends React.Component {
    static displayName = `Validated-${Component.name || Component.displayName}`

    componentWillMount() {
      this.config = getConfig(this.props)
      this.fieldObserver = new FieldObserver()

      this.validations = {}
      this.validationData = {}

      for (let name in this.config.validations) {
        this.validations[name] = new Validation(name, one(this.config, name, this.updateData), this.fieldObserver)
        this.validationData[name] = initValidation()
      }

      this.submitProvider = new SubmitProvider(this.isFormValid)
    }

    componentWillReceiveProps(nextProps) {
      let config = getConfig(nextProps)

      for (let name in config.validations) {
        if (this.config.validations[name] == null) {
          // new validation was added
          this.validations[name] = new Validation(name, one(config, name, this.updateData), this.fieldObserver)
          this.validationData[name] = initValidation()
        } else {
          // validation already exists, we notify it about new data
          this.validations[name].update(one(config, name, this.updateData))
        }
      }

      for (let name in this.config.validations) {
        if (config.validations[name] == null) {
          // validation was removed
          this.validations[name].destroy()
          delete this.validationData[name]
        }
      }

      this.config = config

      if (!isEqual(this.config.validations, config.validations)) {
        // Cancel submitting if user is still changing data in the form
        this.submitProvider.reset()
      }
      // has to be called after this.config and this.validations were updated
      this.submitProvider.update()
      canUseDOM() && this.forceUpdate()
    }

    componentWillUnmount() {
      // destroy all validations
      for (let name in this.validations) {
        this.validations[name].destroy()
      }
    }

    updateData = (name, data) => {
      this.validationData[name] = data
      // submitProvider may depend on hidden state (this.validationData),
      // so we make sure it gets updated when this.validationData changes
      this.submitProvider.update()
      canUseDOM() && this.forceUpdate()
    }

    isFormValid = () => {
      if (this.config.formValid != null) {
        return this.config.formValid
      } else {
        return isFormValid(this.validationData)
      }
    }

    fieldEvent = (type, field) => {
      let fields
      if (field == null) {
        // If fields are not specified, assume all fields in the form were
        // touched (syntactic sugar useful for the 'submit' and 'reset' events).
        let f = this.config.fields
        fields = isArray(f) ? f : Object.keys(f)
      } else {
        fields = typeof field === 'string' ? [field] : field
      }
      let e = {type, fields}

      // Cancel submitting if user is still changing data in the form or if the
      // form was reset
      if (type === 'change' || type === 'reset') {
        this.submitProvider.reset()
      }

      this.fieldObserver.handleEvent(e)
      for (let name in this.validations) {
        this.validations[name].handleEvent(e)
      }
    }

    field = (field, handleChange, handleBlur) => {
      return {
        onChange: (e) => {
          this.fieldEvent('change', field)
          return (handleChange || (() => {}))(e)
        },
        onBlur: (e) => {
          this.fieldEvent('blur', field)
          return (handleBlur || (() => {}))(e)
        }
      }
    }

    render() {
      let validationProps = {
        $validation: this.validationData,
        $fieldEvent: this.fieldEvent,
        $field: this.field,
        $submit: (onValid, onInvalid, fieldEvent = true) => {
          if (fieldEvent) {
            this.fieldEvent('submit')
          }
          this.submitProvider.submit(onValid, onInvalid)
        }
      }
      for (let p in validationProps) {
        if (p in this.props) {
          let message = `Naming collision: validated component ${Component.name || Component.displayName} ` +
            `cannot receive prop ${p}, as this prop name is reserved by the validation library.`
          throw new Error(message)
        }
      }
      return (<Component
        {...this.props}
        {...validationProps}
      />)
    }
  }
}
