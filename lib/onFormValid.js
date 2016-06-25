import React from 'react'
import {eventType} from './helpers'

// Add onFormValid function to Component's props. This function waits until the
// form is valid and calls the callback provided to onFormValid afterwards.
// TODO better comment
export function provideOnFormValid(getData) {
  return (Component) => class extends React.Component {
    static displayName = `${Component.displayName} with onFormValid`

    componentWillMount() {
      this.submitting = false
      this.handler = null
      this.fields = getData(this.props).fields
    }

    componentWillReceiveProps(nextProps) {
      let {formValid, fields} = getData(nextProps)
      if (this.fields != null &&
          fields != null &&
          eventType({prevFields: this.fields, fields}) === 'change') {
        this.submitting = false
      }
      if (this.submitting && formValid != null) {
        this.handler(formValid, nextProps)

        // Reset to initial state
        this.submitting = false
        this.handler = null
      }
      this.fields = fields
    }

    onFormValid = (handler) => {
      this.submitting = true
      this.handler = handler
    }

    render() {
      return <Component {...this.props} onFormValid={this.onFormValid} />
    }
  }
}
