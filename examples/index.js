require('babel-polyfill')
import React from 'react'
import ReactDOM from 'react-dom'

if (module.hot && typeof module.hot.accept === 'function') {
  module.hot.accept('./app', () => {
    let App = require('./app').default
    ReactDOM.render(<App/>, document.getElementById('app'))
  })
}

let App = require('./app').default
ReactDOM.render(<App/>, document.getElementById('app'))
