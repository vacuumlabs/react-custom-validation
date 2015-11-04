import React from 'react'
import ReactDOM from 'react-dom'
import {App} from './App'
import {Input, Row, Col, Panel} from 'react-bootstrap'


class Managed extends React.Component {

  state = {checkTime: 500, typingPace: 500}

  handleCheckTimeChange(e) {
    this.setState({checkTime: e.target.value})
  }

  handleTypingPace(e) {
    this.setState({typingPace: e.target.value})
  }

  render() {
    return (<div>
      <Panel collapsible header={"Settings"}>
        <Row>
          <Col md={4}>
            <Input type="text" label="checkTime"
              onChange={::this.handleCheckTimeChange} value={this.state.checkTime} />
          </Col>
          <Col md={4}>
            <Input type="text" label="typingPace"
              onChange={::this.handleTypingPace} value={this.state.typingPace} />
          </Col>
        </Row>
      </Panel>
      <App key={JSON.stringify(this.state)}
        checkTime={parseInt(this.state.checkTime, 10) || 500}
        typingPace={parseInt(this.state.typingPace, 10) || 500}
      />
    </div>)
  }

}

document.addEventListener('DOMContentLoaded', function(event) {
  ReactDOM.render(<Managed />, document.getElementById('main'))
})
