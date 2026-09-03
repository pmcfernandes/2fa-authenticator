import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { installApi } from './api.js'
import './assets/index.css'

installApi()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
