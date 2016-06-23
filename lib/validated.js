import React from 'react'
import {Validation} from './Validation'

export function validated(getConstructionData) {
  return (Component) => class extends React.Component {
    static displayName = `Validated ${Component.displayName}`

    componentWillMount() {
      this.constructionData = getConstructionData(this.props)
      this.validations = {}
      for (let name of Object.keys(this.constructionData)) {
        this.validations[name] = new Validation(this.constructionData[name])
      }
    }

    componentWillReceiveProps(nextProps) {
      let cd = getConstructionData(nextProps)

      for (let name of Object.keys(cd)) {
        if (this.constructionData[name] == null) {
          // new validation was added
          this.validations[name] = new Validation(cd[name])
        } else {
          // validation already exists, we notify it about new data
          this.validations[name].update(cd[name])
        }
      }

      for (let name of Object.keys(this.constructionData)) {
        if (cd[name] == null) {
          // validation was removed
          this.validations[name].destroy(cd[name])
        }
      }
      this.constructionData = cd
    }

    componentWillUnmount() {
      // destroy all validations
      for (let name of Object.keys(this.constructionData)) {
        this.validations[name].destroy(this.constructionData[name])
      }
    }

    render() {
      return <Component {...this.props} />
    }
  }
}
