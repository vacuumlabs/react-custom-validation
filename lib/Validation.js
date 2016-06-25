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
      let {fn, args} = rules[name]
      let result = fn(args)
      if (wasPromise || isPromise(result)) {
        wasPromise = true
        asyncRules.push({name, result: Promise.resolve(result)})
      } else {
        let {valid, reason} = result
        if (!valid) {
          resolve({valid: false, error: reason, rule: name})
          return
        }
      }
    }

    Promise.reduce(asyncRules, (isOk, {name, result}) => {
      if (!isOk) {
        return false
      } else {
        return result
          .then(({valid, reason}) => {
            if (!valid) {
              resolve({valid: false, error: reason, rule: name})
              return false
            } else {
              return true
            }
          })
      }
    }, true).then((isOk) => {
      if (isOk) {
        resolve({valid: true})
      }
    })
  })
}

function isPromise(obj) {
  return typeof obj.then === 'function'
}

function allTouched(fields) {
  let result = true
  for (let f in fields) {
    let {lastSubmit: s = 0, lastChange: c = 0, lastBlur: b = 0} = fields[f] || {}
    let touched = s > 0 || c > 0 || b > 0
    result = touched && result
  }
  return result
}

function eventType({prevFields, fields}) {
  for (let f in fields) {
    let {lastSubmit: s = 0, lastChange: c = 0, lastBlur: b = 0} = fields[f] || {}
    let {lastSubmit: ps = 0, lastChange: pc = 0, lastBlur: pb = 0} = prevFields[f] || {}

    if (c > pc) {
      return 'change'
    } else if (s > ps) {
      return 'submit'
    } else if (b > pb) {
      return 'blur'
    }
  }
  return null
}

export class Validation {

  constructor({rules, fields, onValidation, onDestroy}) {
    this.validationData = initValidation()
    this.rules = rules
    this.fields = fields
    this.stream = new Rx.Subject()

    this.stream
      .startWith({rules, fields, onValidation})
      .flatMapLatest(({rules, onValidation}) => {
        let promise = and(rules).then((validationResult) => ({validationResult, onValidation}))
        return Rx.Observable.fromPromise(promise)
      })
      .subscribe(({validationResult, onValidation}) => {
        this.handleValidation({validationResult}, onValidation)
      })

    this.stream
      .debounce(500)
      .subscribe(({fields, onValidation}) => {
        this.handleValidation({showValidation: allTouched(fields)}, onValidation)
      })
  }

  handleValidation(data, onValidation) {
    // data may contain only part of validation data (showValidation or validationResult)
    let wholeData = {...this.validationData, ...data}
    if (!isEqual(this.validationData, wholeData)) {
      onValidation(data)
      this.validationData = wholeData
    }
  }

  destroy({rules, fields, onValidation, onDestroy}) {
    if (onDestroy) {
      onDestroy()
    } else {
      this.handleValidation({validationResult: {valid: true}, showValidation: false}, onValidation)
    }
    this.stream.dispose()
  }

  update({rules, fields, onValidation, onDestroy}) {
    for (let ruleName in rules) {
      // Unequality of rule functions could easily happen by providing a lambda function.
      // This would lead to an infinite loop, so we do not allow it.
      if (this.rules[ruleName] != null && this.rules[ruleName].fn !== rules[ruleName].fn) {
        throw new Error(
          `Changing \`fn\` for given rule is not allowed. Check the rule ${ruleName}.`)
      }
    }

    if (!isEqual(this.rules, rules)) {
      this.handleValidation({validationResult: {valid: null}}, onValidation)
      this.stream.onNext({rules, fields, onValidation})
    }

    let et = eventType({prevFields: this.fields, fields})
    if (et === 'change') {
      // user is typing
      this.handleValidation({showValidation: false}, onValidation)
      this.stream.onNext({rules, fields, onValidation})
    } else if (et === 'submit' || et === 'blur') {
      // user finished typing
      this.handleValidation({showValidation: allTouched(fields)}, onValidation)
    }

    this.rules = rules
    this.fields = fields
  }
}
