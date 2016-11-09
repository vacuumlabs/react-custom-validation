import React from 'react'
import update from 'immutability-helper'
import {isEqual, cloneDeep} from 'lodash'
import {normalizeConfig} from './config'
import {handleFieldEvent, shouldShowValidation} from './fields'
import {updateResults} from './results'
import {submit, updateSubmit, resetSubmit} from './submit'
import {initialState} from './state'

function canUseDOM() {
  return !!(
    typeof window !== 'undefined' &&
    window.document && window.document.createElement
  )
}

function updateValidationData(state) {
  let {results, fields, config: {onValidation, validations}} = state
  let validationData = {}
  for (let name in validations) {
    validationData[name] = cloneDeep(results[name].result)
    validationData[name].show = shouldShowValidation(validations[name].fields, fields)
    if (!isEqual(validationData[name], state.validationData[name])) {
      onValidation(name, validationData[name])
    }
  }
  return update(state, {validationData: {$set: validationData}})
}

export function validated(getConfig) {
  return (Component) => class extends React.Component {
    static displayName = `Validated-${Component.name || Component.displayName}`

    componentWillMount() {
      this.registry = initialState(normalizeConfig(getConfig(this.props)))
      this.componentWillReceiveProps(this.props)
    }

    componentWillReceiveProps(nextProps) {
      let config = normalizeConfig(getConfig(nextProps))

      // Cancel submitting if user is still changing data in the form
      if (!isEqual(this.registry.config.validations, config.validations)) {
        this.registry = resetSubmit(this.registry)
      }

      this.registry = update(this.registry, {config: {$set: config}})
      let dispatchUpdate = (fn) => {
        if (!this.registry.isMounted) {
          return
        }
        this.registry = fn(this.registry)
        this.registry = updateValidationData(this.registry)
        this.registry = updateSubmit(this.registry)
        canUseDOM() && this.forceUpdate()
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
        if (!this.registry.isMounted) {
          return
        }
        this.registry = fn(this.registry)
        this.registry = updateValidationData(this.registry)
        canUseDOM() && this.forceUpdate()
      }
      handleFieldEvent(dispatchUpdate, field, type, debounce)
    }

    field = (field, handleChange, handleBlur, debounce) => {
      return {
        onChange: (e) => {
          this.fieldEvent('change', field, debounce)
          return (handleChange || (() => {}))(e)
        },
        onBlur: (e) => {
          this.fieldEvent('blur', field, false)
          return (handleBlur || (() => {}))(e)
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
      return (<Component
        {...this.props}
        {...validationProps}
      />)
    }
  }
}
