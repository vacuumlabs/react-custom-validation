import Promise from 'bluebird'
import {fromJS, is, List, Map, Set} from 'immutable'
import React from 'react'
import Rx from 'rx'

function and(rules) {
  return new Promise((resolve, reject) => {
    let asyncRules = []
    let wasPromise = false
    // resolve all synchronous rules first to prevent server load, save async
    // rules to array to deal with later
    for (let rule of rules) {
      let {fn, args, name} = rule.toJS()
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

function isIterable(obj) {
  if (obj == null) return false
  return obj[Symbol.iterator] !== undefined
}

function isPromise(obj) {
  return typeof obj.then === 'function'
}

function rules(children, args) {
  children = isIterable(children) ? List(children).toJS() : [children]
  let rules = children.map((c) => {
    return {fn: c.type, args: {...args, ...c.props}, name: c.key}
  })
  // validate the rules
  for (let r of rules) {
    if (typeof r.fn !== 'function') {
      throw new Error('Rule type is not a function') // TODO better message
    }
  }
  return fromJS(rules)
}

// Whether all needTouch rule arguments were touched by user
function allTouched(rules, needTouch, touched) {
  if (needTouch == null) return !touched.isEmpty()
  for (let r of rules) {
    for (let a of r.get('args').keys()) {
      let arg = List([r.get('name'), a])
      if (needTouch.contains(arg) && !touched.contains(arg)) return false
    }
  }
  return true
}

function touched(prevRules, nextRules) {
  let nonTrivial = (val) => val !== '' && val !== false && val != null
  let prev = Map()
  for (let r of prevRules) {
    for (let arg of r.get('args').entrySeq()) {
      if (nonTrivial(arg[1])) {
        prev = prev.set(List([r.get('name'), arg[0]]), arg[1])
      }
    }
  }
  let result = Set()
  for (let r of nextRules) {
    for (let arg of r.get('args').entrySeq()) {
      let key = List([r.get('name'), arg[0]])
      if ((!prev.has(key) && nonTrivial(arg[1])) ||
          (prev.has(key) && prev.get(key) !== arg[1])) {
        result = result.add(key)
      }
      prev = prev.delete(key)
    }
  }
  return result.union(prev.keySeq())
}

export class Validate extends React.Component {

  static defaultProps = {
    args: {},
    children: [],
  }

  static propTypes = {
    args: React.PropTypes.any,
    children: React.PropTypes.any,
    needTouch: React.PropTypes.array,
    onValidation: React.PropTypes.func.isRequired,
  }

  componentDidMount() {
    this.subjectStream = new Rx.Subject()
    this.touched = new Set()

    this.subjectStream
      .startWith(rules(this.props.children, this.props.args))
      .flatMapLatest((rules) => Rx.Observable.fromPromise(and(rules)))
      .subscribe((validationResult) => {
        this.props.onValidation({validationResult})
      })

    this.subjectStream
      .debounce(500)
      .subscribe((rules) => {
        this.props.onValidation({showValidation:
          allTouched(rules, fromJS(this.props.needTouch), this.touched)})
      })
  }

  componentWillUnmount() {
    this.subjectStream.dispose()
  }

  componentWillReceiveProps(nextProps) {
    // TODO no rules result in showValidation stuck at false
    let rules1 = rules(this.props.children, this.props.args)
    let rules2 = rules(nextProps.children, nextProps.args)
    if (!is(rules1, rules2)) {
      this.touched = this.touched.union(touched(rules1, rules2))
      this.props.onValidation({validationResult: {}, showValidation: false})
      this.subjectStream.onNext(rules2)
    }
  }

  render() {
    return null
  }
}
