import React from 'react'
import ReactDOM from 'react-dom'
import {App} from './App'

document.addEventListener('DOMContentLoaded', function(event) {
  let checkTime = 500
  let typingPace = 500
  ReactDOM.render(
    <App checkTime={checkTime} typingPace={typingPace} />,
      document.getElementById('main')
  )
})
