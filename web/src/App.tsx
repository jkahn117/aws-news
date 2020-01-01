import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import './App.css';

import ArticleView from './components/ArticleView';
import BlogList from './components/BlogList';
import BlogView from './components/BlogView';

const App: React.FC = () => {
  return (
    <div className="App">
      <h1>AWS News</h1>
      
      <Router>

        <Switch>
          <Route path="/article/:id"><ArticleView /></Route>
          <Route path="/blog/:id"><BlogView /></Route>
          <Route exact path="/"><BlogList /></Route>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
