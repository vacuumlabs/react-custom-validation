import React from 'react'

export function withFancySubmit(getData) {
  return (Component) => class extends React.Component {
    static displayName = `${Component.displayName} with fancy submit`

    componentWillMount() {
      this.lastSubmit = getData(this.props) || 0
    }

    componentWillReceiveProps(nextProps) {
      let {lastSubmit = 0, formValid, onSubmit} = getData(nextProps)
      if (lastSubmit > this.lastSubmit) {
        this.submitting = true
      }
      if (this.submitting && formValid != null) {
        this.submitting = false
        onSubmit(formValid)
      }
      this.lastSubmit = lastSubmit
    }

    render() {
      return <Component {...this.props} />
    }
  }
}
