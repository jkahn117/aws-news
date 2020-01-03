import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import { Sidebar } from 'semantic-ui-react';

import './App.scss';

import AppSidebar from './components/AppSidebar';
import Footer from './components/Footer';

import ArticleView from './components/ArticleView';
import BlogList from './components/BlogList';
import BlogView from './components/BlogView';

const App: React.FC = () => {
  return (
    <div className="App">
      <Sidebar.Pusher>
        <div className="full height">
          <Router>
            <AppSidebar />
            <div className="main">
              <div className="content">
                <Switch>
                  <Route path="/article/:id"><ArticleView /></Route>
                  <Route path="/blog/:id"><BlogView /></Route>
                  <Route exact path="/"><BlogList /></Route>
                </Switch>
              </div>
              <Footer />
            </div>
          </Router>
        </div>
      </Sidebar.Pusher>
    </div>
  );
}

export default App;
