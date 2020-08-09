import React from "react";
import logo from "./logo.svg";
import "./styles/App.scss";
import { Route, Switch } from "react-router-dom";
import Navigation from "~/components/navigation";

class App extends React.Component {
  render = () => {
    return (
      <>
        <Navigation />
        <Switch>
          <Route path={`/`}>
            <div className="App">
              <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>
                  Edit <code>src/App.tsx</code> and save to reload.
                </p>
                <a
                  className="App-link"
                  href="https://reactjs.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn React
                </a>
              </header>
            </div>
          </Route>
        </Switch>
      </>
    );
  };
}

export default App;
