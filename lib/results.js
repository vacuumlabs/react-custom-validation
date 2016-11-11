import update from 'immutability-helper'
import {isEqual} from 'lodash'
import {initialResultsState} from './state'

function isResultValid(result) {
  return result === true || result == null || result === [] || result === {}
}

function isPromise(obj) {
  return obj != null && typeof obj.then === 'function'
}

//TODO why works this not? (bug in next?)
//async function asyncAnd(rules) {
//  for (let {name, pResult} of rules) {
//    let result = await pResult
//    if (!isResultValid(result)) {
//      return {isValid: false, error: {reason: result, rule: name}}
//    }
//  }
//  return {isValid: true, error: {}}
//}

function asyncAnd(rules) {
  if (rules.length === 0) {
    return {isValid: true, error: {}}
  }
  let {name, result: pResult} = rules[0]
  return pResult.then((result) => {
    if (!isResultValid(result)) {
      return {isValid: false, error: {reason: result, rule: name}}
    } else {
      return asyncAnd(rules.slice(1))
    }
  })
}

function and(rules) {
  let asyncRules = []
  let wasPromise = false
  // resolve sync rules first to prevent server load, save async rules to array
  // to deal with later
  for (let rule of rules) {
    let name = rule[0]
    let fn = rule[1]
    let args = rule.slice(2)
    let result = fn.apply(null, args)
    if (wasPromise || isPromise(result)) {
      wasPromise = true
      asyncRules.push({name, result: Promise.resolve(result)})
    } else if (!isResultValid(result)) {
      return {isValid: false, error: {reason: result, rule: name}}
    }
  }
  if (asyncRules.length === 0) {
    return {isValid: true, error: {}}
  }
  return asyncAnd(asyncRules)
}

function setLastAsyncFnStart(state, name, when) {
  return update(state, {results: {[name]: {lastAsyncFnStart: {$set: when}}}})
}

function setResult(state, name, result) {
  return update(state, {results: {[name]: {result: {$set: result}}}})
}

function runFn(state, name, dispatchUpdate) {
  let {results: {[name]: {lastFn}}} = state
  let r = lastFn()
  if (!isPromise(r)) {
    return setResult(state, name, r)
  } else {
    let s = setLastAsyncFnStart(state, name, new Date().getTime())
    r.then((rr) => {
      dispatchUpdate((laterState) => {
        let {results: {[name]: {lastFn: laterLastFn}}} = laterState
        if (lastFn === laterLastFn) {
          return setResult(laterState, name, rr)
        } else {
          return laterState
        }
      })
    })
    return s
  }
}

function runLater(name, fn, timeout, dispatchUpdate) {
  setTimeout(() => {
    dispatchUpdate((state) => {
      let {results: {[name]: {lastFn}}} = state
      if (fn !== lastFn) {
        return state
      } else {
        return runFn(state, name, dispatchUpdate)
      }
    })
  }, timeout)
}

// Update results according to new config
export function updateResults(dispatchUpdate) {
  dispatchUpdate((state) => {
    let {config} = state
    let oldResults = state.results
    let newState = update(state, {results: {$set: initialResultsState}})

    for (let name in config.validations) {
      let {rules, debounce} = config.validations[name]

      if (name in oldResults && isEqual(rules, oldResults[name].rules)) {
        // rules have not changed => no need to recalculate the result
        newState = update(newState, {results: {[name]: {$set: {...oldResults[name], debounce}}}})
      } else {
        let lastFn = () => and(rules)
        let {lastAsyncFnStart = 0} = oldResults[name] || {}
        let result = {isValid: null, error: {}}

        newState = update(
          newState,
          {results: {[name]: {$set: {rules, debounce, lastFn, lastAsyncFnStart, result}}}}
        )

        let nextRunIn = lastAsyncFnStart + debounce - new Date().getTime()

        if (nextRunIn > 0) {
          runLater(name, lastFn, nextRunIn, dispatchUpdate)
        } else {
          newState = runFn(newState, name, dispatchUpdate)
        }
      }
    }
    return newState
  })
}

// TODO add this check in some form
// for (let ruleName in rules) {
//   // Unequality of rule functions could easily happen by providing a lambda function.
//   // This would lead to an infinite loop, so we do not allow it.
//   if (this.rules[ruleName] != null && this.rules[ruleName][0] !== rules[ruleName][0]) {
//     throw new Error(
//       'Changing the rule function (first argument) is not allowed. Note that \'() => {...}\' creates a ' +
//       `different function anytime it is evaluated. Check the rule ${this.name}/${ruleName}.`)
//   }
// }
