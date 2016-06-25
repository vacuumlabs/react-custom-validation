import React from 'react'
import {Validation} from './Validation'
import {cloneDeep} from 'lodash'

const LAST_SUBMIT = '__lastSubmit'

// Returns constructionData with lastSubmit set to global lastSubmit for each
// field (if not provided directly for that field)
function prepared(constructionData) {
  let lastSubmit = constructionData[LAST_SUBMIT]
  let result = {}
  for (let name in constructionData) {
    if (name !== LAST_SUBMIT) {
      // TODO better performance
      let cdn = cloneDeep(constructionData[name])
      for (let field in cdn.fields) {
        if (!('lastSubmit' in cdn.fields[field])) {
          cdn.fields[field].lastSubmit = lastSubmit
        }
      }
      result[name] = cdn
    }
  }
  return result
}

export function validated(getConstructionData) {
  return (Component) => class extends React.Component {
    static displayName = `Validated ${Component.displayName}`

    componentWillMount() {
      this.constructionData = prepared(getConstructionData(this.props))
      this.validations = {}
      for (let name in this.constructionData) {
        this.validations[name] = new Validation(this.constructionData[name])
      }
    }

    componentWillReceiveProps(nextProps) {
      let cd = prepared(getConstructionData(nextProps))

      for (let name in cd) {
        if (this.constructionData[name] == null) {
          // new validation was added
          this.validations[name] = new Validation(cd[name])
        } else {
          // validation already exists, we notify it about new data
          this.validations[name].update({...cd[name], name})
        }
      }

      for (let name in this.constructionData) {
        if (cd[name] == null) {
          // validation was removed
          this.validations[name].destroy(cd[name])
        }
      }
      this.constructionData = cd
    }

    componentWillUnmount() {
      // destroy all validations
      for (let name in this.constructionData) {
        this.validations[name].destroy(this.constructionData[name])
      }
    }

    render() {
      return <Component {...this.props} />
    }
  }
}
