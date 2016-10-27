import Promise from 'bluebird'
import Rx from 'rx'
import {isEqual} from 'lodash'
import {initValidation} from './helpers'

function and(rules) {
  return new Promise((resolve, reject) => {
    let asyncRules = []
    let wasPromise = false
    // resolve all synchronous rules first to prevent server load, save async
    // rules to array to deal with later
    for (let name in rules) {
      let fn = rules[name][0]
      let args = rules[name].slice(1)
      let error = fn.apply(null, args)
      if (wasPromise || isPromise(error)) {
        wasPromise = true
        asyncRules.push({name, result: Promise.resolve(error)})
      } else if (error != null) {
        resolve({isValid: false, error: {reason: error, rule: name}})
        return
      }
    }

    Promise.reduce(asyncRules, (isOk, {name, result}) => {
      if (!isOk) {
        return false
      } else {
        return result
          .then((error) => {
            if (error != null) {
              resolve({isValid: false, error: {reason: error, rule: name}})
              return false
            } else {
              return true
            }
          })
      }
    }, true).then((isOk) => {
      if (isOk) {
        resolve({isValid: true, error: {}})
      }
    })
  })
}

function isPromise(obj) {
  return obj != null && typeof obj.then === 'function'
}

export class Validation {

  constructor(name, {rules, fields, onValidation, typingDebounce, debounce}, fieldObserver) {

    this.name = name
    this.rules = rules
    this.fields = fields
    this.debounce = debounce
    this.typingDebounce = typingDebounce
    this.onValidation = onValidation
    this.fieldObserver = fieldObserver

    this.validationData = initValidation()
    this.stream1 = new Rx.Subject()
    this.stream2 = new Rx.Subject()

    this.stream1
      .startWith(rules)
      .debounce(debounce)
      .flatMapLatest((rules) => Rx.Observable.fromPromise(and(rules)))
      .subscribe((result) => {
        this.handleValidation(result, this.onValidation)
      })

    this.stream2
      .debounce(typingDebounce)
      .subscribe(() => {
        this.handleValidation({show: this.allTouched()})
      })
  }

  handleValidation(data) {
    // data may contain only part of validation data (show or result)
    let wholeData = {...this.validationData, ...data}
    if (!isEqual(this.validationData, wholeData)) {
      this.onValidation(wholeData)
      this.validationData = wholeData
    }
  }

  allTouched() {
    return this.fieldObserver.touched(this.fields)
  }

  handleEvent({type, fields}) {
    if (this.fields.some((f) => fields.indexOf(f) !== -1)) {
      if (type === 'change') {
        // user is typing in one of fields related to this validation
        this.handleValidation({show: false})
        this.stream2.onNext(null)
      } else if (type === 'submit' || type === 'blur' || type === 'reset') {
        // user finished typing
        this.handleValidation({show: this.allTouched()})
      }
    }
  }

  destroy() {
    this.stream1.dispose()
    this.stream2.dispose()
  }

  update({rules, fields, onValidation, typingDebounce, debounce}) {
    if (debounce !== this.debounce) {
      throw new Error('Changing debounce is not allowed.')
    }
    if (typingDebounce !== this.typingDebounce) {
      throw new Error('Changing typingDebounce is not allowed.')
    }
    for (let ruleName in rules) {
      // Unequality of rule functions could easily happen by providing a lambda function.
      // This would lead to an infinite loop, so we do not allow it.
      if (this.rules[ruleName] != null && this.rules[ruleName][0] !== rules[ruleName][0]) {
        throw new Error(
          'Changing the rule function (first argument) is not allowed. Note that \'() => {...}\' creates a ' +
          `different function anytime it is evaluated. Check the rule ${this.name}/${ruleName}.`)
      }
    }

    if (!isEqual(this.rules, rules)) {
      this.handleValidation({isValid: null, error: {}}, onValidation)
      this.stream1.onNext(rules)
    }

    this.rules = rules
    this.fields = fields
    this.onValidation = onValidation
  }
}
