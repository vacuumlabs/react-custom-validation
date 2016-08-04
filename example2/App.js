'use strict'

import React from 'react'
import Promise from 'bluebird'
import {
  validated,
  initValidation,
  isFormValid,
  valid,
  invalid
} from '../lib/validation'
import {
  ControlLabel,
  FormGroup,
  FormControl,
  HelpBlock,
  Grid,
  Row,
  Col,
  Panel,
  Button
} from 'react-bootstrap'
import R from 'ramda'
import {cloneDeep} from 'lodash'
import {style, validationMessage} from './helpers'
import Name from './Name'

function isTotalCountCorrect({totalCount, count}) {
  let result
  if (count === totalCount) {
    result = valid()
  } else {
    result = invalid('Total count is incorrect!')
  }
  return Promise.delay(3000).then(() => result)
}

function initNames() {
  return {
    fields: {first: '', last: '', full: ''},
    validations: {names: initValidation()}
  }
}

// Wrapper providing poor man's redux
export class App extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      appState: {
        names: {
          id1: initNames()
        },
        totalCount: 1,
        lastId: 1,
        validations: {
          totalCount: initValidation(),
        }
      }
    }
  }

  dispatch = ({fn, description}) => {
    this.setState((state) => {
      console.log(description) //eslint-disable-line no-console
      console.log(//eslint-disable-line no-console
        'New app state:', cloneDeep(fn(state.appState)))
      return {appState: fn(state.appState)}
    })
  }

  render() {
    return <ValidatedRegistration appState={this.state.appState} dispatch={this.dispatch} />
  }
}

function updateValidation(dispatch, name, data) {
  dispatch({
    fn: (state) => {
      return R.assocPath(['validations', name], {...state.validations[name], ...data}, state)
    },
    description: `Got data for ${name} validation: ${JSON.stringify(data)}`
  })
}

function validationConfig(props) {
  let {
    appState: {names, totalCount},
    dispatch
  } = props

  let validations = {...props.appState.validations}
  for (let n in names) {
    validations[n] = names[n].validations.names
  }
  let count = Object.keys(names).length

  return {
    fields: {totalCount},
    formValid: isFormValid(validations),
    onValidation: (name, data) => updateValidation(dispatch, name, data),
    validations: {
      totalCount: {
        rules: {
          isTotalCountCorrect: [isTotalCountCorrect, {totalCount, count}],
        },
        fields: 'totalCount', // field(s) validated by this set of rules
      },
    },
  }
}

class Registration extends React.Component {

  static propTypes = {
    appState: React.PropTypes.object.isRequired,
    dispatch: React.PropTypes.func.isRequired,
    onFormValid: React.PropTypes.func.isRequired,
    handleEvent: React.PropTypes.func.isRequired,
  }

  remove(id) {
    this.props.dispatch({
      fn: (state) => R.dissocPath(['names', id], state),
      description: `Remove names for id=${id}`
    })
    delete this.nameComponents[id]
  }

  add() {
    this.props.dispatch({
      fn: (state) => {
        let {lastId: id} = state
        let s = R.assocPath(['names', `id${id + 1}`], initNames(), state)
        s = R.assoc('lastId', id + 1, s)
        return s
      },
      description: 'Add new name'
    })
  }

  dispatchName = (id) =>
    ({fn, description}) => this.props.dispatch({
      fn: (state) => R.assocPath(['names', id], fn(state.names[id]), state),
      description
    })

  render() {
    let {
      appState: {
        names,
        totalCount,
        validations: vdata,
      },
      handleEvent,
      dispatch,
    } = this.props

    let nameIds = Object.keys(names)

    return (
      <div>
        <Panel header={"MuchUX Corporation: Registration Form"}>
          <form onSubmit={
            (e) => {
              e.preventDefault()
              this.props.handleEvent('submit')
              for (let id in names) {
                this.nameComponents[id].handleEvent('submit')
              }
              this.props.onFormValid((valid, props) => {
                if (valid) {
                  alert('Registration successful!') //eslint-disable-line no-alert
                } else {
                  alert('There are errors in the form.') //eslint-disable-line no-alert
                }
              })
            }
          }>
            <Grid>
              {nameIds.map((id) =>
                 <Name
                   key={id}
                   ref={
                     (c) => {
                       if (this.nameComponents == null) {
                         this.nameComponents = {}
                       }
                       this.nameComponents[id] = c
                     }
                   }
                   state={names[id]}
                   dispatch={this.dispatchName(id)}
                   remove={() => this.remove(id)}
                 />
              )}
              <Row>
                <Col md={6}>
                  <FormGroup controlId="totalCount" validationState={style(vdata.totalCount)}>
                    <ControlLabel>Total count</ControlLabel>
                    <FormControl
                      type="number"
                      onChange={(e) => {
                        let value = parseInt(e.target.value, 10)
                        dispatch({
                          fn: (s) => R.assoc('totalCount', value, s),
                          description: `Set totalCount to ${value}`
                        })
                        handleEvent('change', 'totalCount')
                      }}
                      onBlur={(e) => handleEvent('blur', 'totalCount')}
                      value={totalCount}
                    />
                    <FormControl.Feedback />
                    <HelpBlock>{validationMessage(vdata.totalCount)}</HelpBlock>
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md={2}>
                  <Button bsStyle="success" onClick={() => this.add()}> Add another </Button>
                </Col>
                <Col md={2}>
                  <Button bsStyle="primary" type="submit"> Submit </Button>
                </Col>
              </Row>
            </Grid>
          </form>
        </Panel>
      </div>
    )
  }
}

const ValidatedRegistration = validated(validationConfig)(Registration)
