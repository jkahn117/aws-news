import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import { Grid, Responsive } from 'semantic-ui-react';

import './App.scss';
import AppSidebar from './components/shared/AppSidebar';
import Footer from './components/shared/Footer';
import ArticleView from './pages/ArticleView';
import BlogView from './pages/BlogView';
import Home from './pages/Home';

const App: React.FC = () => {
  return (
    <Grid stretched className="App">
        <Router>
          <Responsive as={ Grid.Column } width={ 4 } minWidth={ Responsive.onlyTablet.minWidth }>
            <AppSidebar />
          </Responsive>
          <Grid.Column width={ 12 }>
            <div className="main">
              <div className="content">
                <Switch>
                  <Route path="/article/:id"><ArticleView /></Route>
                  <Route path="/blog/:id"><BlogView /></Route>
                  <Route exact path="/"><Home /></Route>
                </Switch>
              </div>
              <Footer />
            </div>
          </Grid.Column>
        </Router>
      
    </Grid>
  );
}

export default App;
