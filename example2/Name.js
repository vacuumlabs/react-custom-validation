'use strict'

import React from 'react'
import {validated} from '../lib/validation'
import {FormGroup, FormControl, Row, Col, Button} from 'react-bootstrap'
import {valid, invalid} from '../lib/Rules'
import R from 'ramda'
import {style, validationMessage} from './helpers'

function updateValidation(dispatch, name, data) {
  dispatch({
    fn: (state) => {
      return R.assocPath(['validations', name], {...state.validations[name], ...data}, state)
    },
    description: `Got data for ${name} validation: ${JSON.stringify(data)}`
  })
}

function isConsistent({first, last, full}) {
  if (`${first} ${last}` === full) {
    return valid()
  } else {
    return invalid(`"${first} ${last}" is not equal to "${full}"!`)
  }
}

function validationConfig(props) {
  let {
    state: {
      fields,
      fields: {first, last, full},
    },
    dispatch
  } = props

  return {
    fields,
    onValidation: (name, data) => updateValidation(dispatch, name, data),
    validations: {
      names: {
        rules: {
          isConsistent: {fn: isConsistent, args: {first, last, full}},
        },
        fields: ['first', 'last', 'full']
      },
    },
  }
}

class Name extends React.Component {

  static propTypes = {
    state: React.PropTypes.object.isRequired,
    dispatch: React.PropTypes.func.isRequired,
    remove: React.PropTypes.func.isRequired,
    onFormValid: React.PropTypes.func.isRequired,
    handleEvent: React.PropTypes.func.isRequired,
  }

  renderField(name, placeholder, style) {
    let {handleEvent} = this.props

    let update = (value) => {
      this.props.dispatch({
        fn: (state) => {
          return R.assocPath(['fields', name], value, state)
        },
        description: `Update field ${this.key}/${name} to value ${value}`
      })
    }

    return (
      <FormGroup controlId={name} validationState={style}>
        <FormControl
          type="text"
          placeholder={placeholder}
          onChange={(e) => {
            update(e.target.value)
            handleEvent('change', name)
          }}
          onBlur={(e) => handleEvent('blur', name)}
          value={this.props.state.fields[name].value}
        />
        <FormControl.Feedback />
      </FormGroup>
    )
  }

  render() {
    let vdata = this.props.state.validations

    return (
      <Row>
        <Col md={2}>
          {this.renderField('first', 'First name', style(vdata.names))}
        </Col>
        <Col md={2}>
          {this.renderField('last', 'Last name', style(vdata.names))}
        </Col>
        <Col md={2}>
          {this.renderField('full', 'Full name', style(vdata.names))}
        </Col>
        <Col md={1}>
          <Button onClick={this.props.remove}> X </Button>
        </Col>
        <Col md={5}>
          {validationMessage(vdata.names)}
        </Col>
      </Row>
    )
  }
}

export default validated(validationConfig)(Name)
