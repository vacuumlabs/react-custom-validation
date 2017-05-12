import React from 'react'
import update from 'immutability-helper'
import {isEqual, cloneDeep} from 'lodash'
import {normalizeConfig} from './config'
import {handleFieldEvent, shouldShowValidation} from './fields'
import {updateResults} from './results'
import {submit, updateSubmit, resetSubmit} from './submit'
import {initialState} from './state'

function updateValidationData(state) {
  let {results, fields, config: {validations}} = state
  let validationData = {}
  for (let name in validations) {
    validationData[name] = cloneDeep(results[name].result)
    validationData[name].show = shouldShowValidation(validations[name].fields, fields)
  }
  return update(state, {validationData: {$set: validationData}})
}

export function validated(getConfig) {
  return (Component) => class extends React.Component {
    static displayName = `Validated-${Component.name || Component.displayName}`

    componentWillMount() {
      this.shouldForceUpdate = false
      this.registry = initialState(normalizeConfig(getConfig(this.props)))
      this.componentWillReceiveProps(this.props)
    }

    componentDidMount() {
      // forceUpdate should be called only on the client (it should not be called
      // on the server during server-side rendering). We use componentDidMount
      // (which is called only on the client) to distinguish client from server
      this.shouldForceUpdate = true
    }

    componentWillReceiveProps(nextProps) {
      let config = normalizeConfig(getConfig(nextProps))

      // Cancel submitting if user is still changing data in the form
      if (!isEqual(this.registry.config.validations, config.validations)) {
        this.registry = resetSubmit(this.registry)
      }

      this.registry = update(this.registry, {config: {$set: config}})

      let dispatchUpdate = (fn) => {
        let oldRegistry = this.registry
        if (!this.registry.isMounted) {
          return
        }
        this.registry = fn(this.registry)
        this.registry = updateValidationData(this.registry)
        this.registry = updateSubmit(this.registry)
        this.forceUpdateIfNeeded(oldRegistry, this.registry)
      }
      updateResults(dispatchUpdate)
    }

    componentWillUnmount() {
      this.registry = update(this.registry, {isMounted: {$set: false}})
    }

    fieldEvent = (type, field, debounce) => {
      // Cancel submitting if user is still changing data in the form or if the
      // form was reset
      if (type === 'change' || type === 'reset') {
        this.registry = resetSubmit(this.registry)
      }

      let dispatchUpdate = (fn) => {
        let oldRegistry = this.registry
        if (!this.registry.isMounted) {
          return
        }
        this.registry = fn(this.registry)
        this.registry = updateValidationData(this.registry)
        this.forceUpdateIfNeeded(oldRegistry, this.registry)
      }
      handleFieldEvent(dispatchUpdate, field, type, debounce)
    }

    forceUpdateIfNeeded(oldRegistry, newRegistry) {
      // ensure that the decorated component gets new props
      if (!isEqual(oldRegistry.validationData, newRegistry.validationData)) {
        this.shouldForceUpdate && this.forceUpdate()
      }
      // ensure that onValidation handler is called
      let {config: {onValidation, validations}} = newRegistry
      for (let name in validations) {
        if (!isEqual(oldRegistry.validationData[name], newRegistry.validationData[name])) {
          onValidation(name, newRegistry.validationData[name])
        }
      }
    }

    field = (field, handleChange, handleBlur, debounce) => {
      return {
        onChange: (e) => {
          (handleChange || (() => {}))(e)
          this.fieldEvent('change', field, debounce)
        },
        onBlur: (e) => {
          (handleBlur || (() => {}))(e)
          this.fieldEvent('blur', field, false)
        }
      }
    }

    render() {
      let validationProps = {
        $validation: this.registry.validationData,
        $fieldEvent: this.fieldEvent,
        $field: this.field,
        $submit: (onValid, onInvalid, fieldEvent = true) => {
          if (fieldEvent) {
            this.fieldEvent('submit')
          }
          this.registry = submit(this.registry, onValid, onInvalid)
        }
      }
      for (let p in validationProps) {
        if (p in this.props) {
          let message = `Naming collision: validated component ${Component.name || Component.displayName} ` +
            `cannot receive prop ${p}, as this prop name is reserved by the validation library.`
          throw new Error(message)
        }
      }
      return React.createElement(Component, {...this.props, ...validationProps})
    }
  }
}
