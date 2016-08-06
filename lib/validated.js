import React from 'react'
import {isArray} from 'lodash'
import {Validation} from './Validation'
import {FieldObserver} from './FieldObserver'
import {OnFormValidProvider} from './OnFormValidProvider'

function one(config, name) {
  let {onValidation, onDestroy, debounce = 100, validations} = config
  let result = {...validations[name]}
  result.onValidation = (data) => onValidation(name, data)
  if (onDestroy !== null) {
    result.onDestroy = () => onDestroy(name)
  }
  result.debounce = debounce
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
      for (let name in this.config.validations) {
        this.validations[name] = new Validation(name, one(this.config, name), this.fieldObserver)
      }

      this.onFormValidProvider = new OnFormValidProvider(getConfig, this.props)
    }

    componentWillReceiveProps(nextProps) {
      let config = getConfig(nextProps)

      for (let name in config.validations) {
        if (this.config.validations[name] == null) {
          // new validation was added
          this.validations[name] = new Validation(name, one(config, name), this.fieldObserver)
        } else {
          // validation already exists, we notify it about new data
          this.validations[name].update(one(config, name))
        }
      }

      for (let name in this.config.validations) {
        if (config.validations[name] == null) {
          // validation was removed
          this.validations[name].destroy()
        }
      }

      this.onFormValidProvider.update(nextProps)

      this.config = config
    }

    componentWillUnmount() {
      // destroy all validations
      for (let name in this.constructionData) {
        this.validations[name].destroy(this.constructionData[name])
      }
    }

    fieldEvent = (type, field) => {
      let fields
      if (field == null) {
        // If fields are not specified, assume all fields in the form were
        // touched (syntactic sugar useful for the 'submit' event).
        let f = this.config.fields
        fields = isArray(f) ? f : Object.keys(f)
      } else {
        fields = typeof field === 'string' ? [field] : field
      }
      let e = {type, fields}
      this.fieldObserver.handleEvent(e)
      this.onFormValidProvider.handleEvent(e)
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
      let onFormValid = (handler) => this.onFormValidProvider.onFormValid(handler, this.props)

      return (<Component
        {...this.props}
        fieldEvent={this.fieldEvent}
        connectField={this.connectField}
        onFormValid={onFormValid}
      />)
    }
  }
}
