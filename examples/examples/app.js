import React from 'react'
import {Link, Router, Route, browserHistory} from 'react-router'
import Example1 from './example/1'
import Example2 from './example/2'
import Example3 from './example/3'

class Menu extends React.Component {
  render() {
    return (
      <div>
        <div>
          <Link to="/example/1"> Example1 </Link>
          <Link to="/example/2"> Example2 </Link>
          <Link to="/example/3"> Example3 </Link>
        </div>
        <p/>
        {this.props.children}
      </div>
    )
  }
}

export default class App extends React.Component {
  render() {
    return (
      <Router history={browserHistory}>
        <Route component={Menu} path="/">
          <Route component={Example1} path="example/1" />
          <Route component={Example2} path="example/2" />
          <Route component={Example3} path="example/3" />
        </Route>
      </Router>
    )
  }
}
