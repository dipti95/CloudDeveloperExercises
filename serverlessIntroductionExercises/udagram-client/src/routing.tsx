import React from "react"
import Auth from "./auth/Auth"
import { Router, Route } from "react-router-dom"
import Callback from "./components/Callback"

import App from "./App"
const history = require("history").createBrowserHistory()

// import { createBrowserHistory, History } from "history"
// import App from "./App"

// const history: History = createBrowserHistory()

const auth = new Auth(history)

const handleAuthentication = (props: any) => {
  const location = props.location
  if (/access_token|id_token|error/.test(location.hash)) {
    auth.handleAuthentication()
  }
}

export const makeAuthRouting = () => {
  return (
    <Router history={history}>
      <div>
        <Route
          path="/callback"
          render={(props) => {
            handleAuthentication(props)
            console.log(Callback)
            return <Callback />
          }}
        />
        <Route
          render={(props) => {
            return <App auth={auth} {...props} />
          }}
        />
        {/* <Route path="/" render={(props) => <App auth={auth} {...props} />} />
          <Route path="/home" render={(props) => <Home auth={auth} {...props} />} /> */}
      </div>
    </Router>
  )
}
