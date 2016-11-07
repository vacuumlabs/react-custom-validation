import React from 'react'
import {isArray, isEqual} from 'lodash'
import {Validation} from './Validation'
import {FieldObserver} from './FieldObserver'
import {initValidation} from './helpers'
import {normalizeConfig} from './config'
import {submit, updateSubmit, resetSubmit} from './submit'

function canUseDOM() {
  return !!(
    typeof window !== 'undefined' &&
    window.document && window.document.createElement
  )
}

function one(config, name, updateData) {
  let {onValidation, debounce, typingDebounce, validations} = config

  let v = validations[name]
  let result = {rules: v.rules, fields: v.fields}

  result.onValidation = (data) => {
    onValidation(name, data)
    updateData(name, data)
  }
  result.debounce = debounce
  result.typingDebounce = typingDebounce

  return result
}

const initialSubmitState = {
  isSubmitting: false,
  onValid: null,
  onInvalid: null
}

export function validated(getConfig) {
  return (Component) => class extends React.Component {
    static displayName = `Validated-${Component.name || Component.displayName}`

    componentWillMount() {
      this.xxx = {
        config: normalizeConfig(getConfig(this.props)),
        validationData: {},
        submit: initialSubmitState,
      }
      this.fieldObserver = new FieldObserver()

      this.validations = {}

      for (let name in this.xxx.config.validations) {
        this.validations[name] = new Validation(
          name, one(this.xxx.config, name, this.updateData), this.fieldObserver)
        this.xxx.validationData[name] = initValidation()
      }
    }

    componentWillReceiveProps(nextProps) {
      let config = normalizeConfig(getConfig(nextProps))

      for (let name in config.validations) {
        if (this.xxx.config.validations[name] == null) {
          // new validation was added
          this.validations[name] = new Validation(name, one(config, name, this.updateData), this.fieldObserver)
          this.xxx.validationData[name] = initValidation()
        } else {
          // validation already exists, we notify it about new data
          this.validations[name].update(one(config, name, this.updateData))
        }
      }

      for (let name in this.xxx.config.validations) {
        if (config.validations[name] == null) {
          // validation was removed
          this.validations[name].destroy()
          delete this.xxx.validationData[name]
        }
      }

      this.xxx.config = config

      if (!isEqual(this.xxx.config.validations, config.validations)) {
        // Cancel submitting if user is still changing data in the form
        this.xxx = resetSubmit(this.xxx)
      }
      // has to be called after this.xxx.config and this.validations were updated
      this.xxx = updateSubmit(this.xxx)
      canUseDOM() && this.forceUpdate()
    }

    componentWillUnmount() {
      // destroy all validations
      for (let name in this.validations) {
        this.validations[name].destroy()
      }
    }

    updateData = (name, data) => {
      this.xxx.validationData[name] = data
      // if total form validity is known, submit handling should proceed
      this.xxx = updateSubmit(this.xxx)
      canUseDOM() && this.forceUpdate()
    }

    fieldEvent = (type, field) => {
      let fields
      if (field == null) {
        // If fields are not specified, assume all fields in the form were
        // touched (syntactic sugar useful for the 'submit' and 'reset' events).
        let f = this.xxx.config.fields
        fields = isArray(f) ? f : Object.keys(f)
      } else {
        fields = typeof field === 'string' ? [field] : field
      }
      let e = {type, fields}

      // Cancel submitting if user is still changing data in the form or if the
      // form was reset
      if (type === 'change' || type === 'reset') {
        this.xxx = resetSubmit(this.xxx)
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
        $validation: this.xxx.validationData,
        $fieldEvent: this.fieldEvent,
        $field: this.field,
        $submit: (onValid, onInvalid, fieldEvent = true) => {
          if (fieldEvent) {
            this.fieldEvent('submit')
          }
          this.xxx = submit(this.xxx, onValid, onInvalid)
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
