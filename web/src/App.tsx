import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import './App.scss';

import AppNavBar from './components/shared/AppNavBar';
import AppSidebar from './components/shared/AppSidebar';
import AppFooter from './components/shared/AppFooter';
import ArticleView from './pages/ArticleView';
import BlogView from './pages/BlogView';
import Home from './pages/Home';

const App: React.FC = () => {
  return (
    <Router>
      <AppNavBar />
      <div className="main">
        <div className="columns is-divided">
          <div id="sidebar" className="column is-3 has-squidink-background is-hidden-mobile">
            <AppSidebar />
          </div>
          <div className="column is-9">
            <Switch>
              <Route path="/article/:id"><ArticleView /></Route>
              <Route path="/blog/:id"><BlogView /></Route>
              <Route exact path="/"><Home /></Route>
            </Switch>
            <AppFooter />
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
