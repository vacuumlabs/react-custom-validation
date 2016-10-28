import React from 'react'
import {isArray, isEqual} from 'lodash'
import {Validation} from './Validation'
import {FieldObserver} from './FieldObserver'
import {SubmitProvider} from './SubmitProvider'
import {isFormValid} from './helpers'

function one(config, name, updateData) {
  let {onValidation, debounce = 100, typingDebounce = 1000, validations} = config
  let result = {...validations[name]}
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
    static displayName = `Validated ${Component.displayName}`

    componentWillMount() {
      this.config = getConfig(this.props)
      this.fieldObserver = new FieldObserver()

      this.validations = {}
      this.validationData = {}

      for (let name in this.config.validations) {
        this.validations[name] = new Validation(name, one(this.config, name, this.updateData), this.fieldObserver)
      }

      this.submitProvider = new SubmitProvider(this.isFormValid)
    }

    componentWillReceiveProps(nextProps) {
      let config = getConfig(nextProps)

      for (let name in config.validations) {
        if (this.config.validations[name] == null) {
          // new validation was added
          this.validations[name] = new Validation(name, one(config, name, this.updateData), this.fieldObserver)
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

    connectField = (field, handleChange, handleBlur) => {
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
      return (<Component
        {...this.props}
        fieldEvent={this.fieldEvent}
        connectField={this.connectField}
        submit={(onValid, onInvalid) => this.submitProvider.submit(onValid, onInvalid)}
      />)
    }
  }
}
