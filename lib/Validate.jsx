import React from 'react'
import Promise from 'bluebird'
import Rx from 'rx'

export function and(rules) {
  let n = rules.length

  return new Promise((resolve, reject) => {
    let results = rules.map((r) => {
      return {name: r.name, result: Promise.resolve(r.fn(r.args))}
    })

    function findFirstInvalid() {
      for (let i = 0; i < n; i++) {
        let {name, result} = results[i]
        if (!result.isFulfilled()) return
        let {valid, reason} = result.value()
        if (!valid) resolve({valid: false, error: reason, rule: name})
      }
    }

    return Promise.all(
      results.map((r) => r.result.then((_) => findFirstInvalid()))
    ).then((_) => {
      resolve({valid: true, error: null, rule: null})
    })
  })
}

function rules(children, args) {
  children = children == null ?
    [] :
    children instanceof Array ? children : [children]
  return children.map((c) => {
    return {fn: c.type, args: {...args, ...c.props}, name: c.key}
  })
}

function areSame(rule1, rule2) {
  if (rule1.fn !== rule2.fn) return false
  if (JSON.stringify(rule1.args) !== JSON.stringify(rule2.args)) return false
  if (rule1.name !== rule2.name) return false
  return true
}

function areSameAll(rules1, rules2) {
  if (rules1.length !== rules2.length) return false
  for (let i = 0; i < rules1.length; i++) {
    if (!areSame(rules1[i], rules2[i])) return false
  }
  return true
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
    this.showValidation = false
    this.subjectStream = new Rx.Subject()
    this.subscription = this.subjectStream
      .debounce(500)
      .startWith(this.props)
      .flatMapLatest(
        (value) => Rx.Observable.fromPromise(this.validate(value)))
      .subscribe(
        (validationResult) => this.props.onValidation(validationResult))
  }

  componentWillUnmount() {
    this.subjectStream.dispose()
  }

  componentWillReceiveProps(nextProps) {
    // TODO no rules result in showValidation stuck at false
    let same = areSameAll(
      rules(this.props.children, this.props.args),
      rules(nextProps.children, nextProps.args))
    if (!same) {
      this.showValidation = true
      this.props.onValidation({valid: null, error: null, showValidation: false})
      this.subjectStream.onNext(nextProps)
    }
  }

  validate() {
    this.props.onValidation(
      {valid: null, error: null, showValidation: this.showValidation})
    return and(rules(this.props.children, this.props.args)).then((result) => {
      return {...result, showValidation: this.showValidation}
    })
  }

  render() {
    return null
  }
}
