import React from 'react'
import {Link, Router, Route, browserHistory} from 'react-router'
import Example1 from './example/1'
import Example2 from './example/2'
import Example3 from './example/3'

const navStyle = {
  borderBottom: '1px solid #eee',
  padding: '.5rem 0',
  fontFamily: 'sans-serif',
  marginBottom: '2rem',
  display: 'flex',
  alignItems: 'center',
}
const linkStyle = {
  padding: '.25rem',
  marginLeft: '1rem',
  color: '#333',
  textDecoration: 'none',
  borderBottom: '1px dotted #333',
}
const h1Style = {margin: '0 0 0 .5rem', fontSize: '1rem'}

class Menu extends React.Component {
  render() {
    return (
      <div>
        <div style={navStyle}>
          <h1 style={h1Style}>react-custom-validation</h1>
          <Link to="/example1" style={linkStyle}>Example 1</Link>
          <Link to="/example2" style={linkStyle}>Example 2</Link>
          <Link to="/example3" style={linkStyle}>Example 3</Link>
        </div>
        <div>
          {this.props.children}
        </div>
      </div>
    )
  }
}

export default class App extends React.Component {
  render() {
    return (
      <Router history={browserHistory}>
        <Route component={Menu} path="/">
          <Route component={Example1} path="example1" />
          <Route component={Example2} path="example2" />
          <Route component={Example3} path="example3" />
        </Route>
      </Router>
    )
  }
}
