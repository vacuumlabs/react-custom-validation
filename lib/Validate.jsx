import Promise from 'bluebird'
import {fromJS, is, List} from 'immutable'
import React from 'react'
import Rx from 'rx'


function and(rules) {
  return new Promise((resolve, reject) => {
    let asyncRules = []
    let wasPromise = false
    // resolve all synchronous rules first to prevent server load, save async
    // rules to array to deal with later
    for (let rule of rules) {
      let result = rule.fn(rule.args)
      if (wasPromise || isPromise(result)) {
        wasPromise = true
        asyncRules.push({name: rule.name, result: Promise.resolve(result)})
      } else {
        let {valid, reason} = result
        if (!valid) {
          resolve({valid: false, error: reason, rule: rule.name})
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
  return rules
}

export class Validate extends React.Component {

  static defaultProps = {
    args: {},
    children: [],
  }

  static propTypes = {
    args: React.PropTypes.any,
    children: React.PropTypes.any,
    onValidation: React.PropTypes.func.isRequired,
  }

  componentDidMount() {
    this.subjectStream = new Rx.Subject()

    this.subjectStream
      .startWith(this.props)
      .flatMapLatest((props) => {
        return Rx.Observable.fromPromise(and(rules(props.children, props.args)))
      }).subscribe((validationResult) => {
        this.props.onValidation({validationResult})
      })

    this.subjectStream
      .debounce(500)
      .subscribe((_) => {
        this.props.onValidation({showValidation: true})
      })
  }

  componentWillUnmount() {
    this.subjectStream.dispose()
  }

  componentWillReceiveProps(nextProps) {
    // TODO no rules result in showValidation stuck at false
    let same = is(
      fromJS(rules(this.props.children, this.props.args)),
      fromJS(rules(nextProps.children, nextProps.args)))
    if (!same) {
      this.props.onValidation({validationResult: {}, showValidation: false})
      this.subjectStream.onNext(nextProps)
    }
  }

  render() {
    return null
  }
}
