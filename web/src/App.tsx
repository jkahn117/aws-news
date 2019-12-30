import React from 'react';
import './App.css';

import Blogs from './components/Blogs';

const App: React.FC = () => {
  return (
    <div className="App">
      <h1>AWS News</h1>
      <Blogs />
    </div>
  );
}

export default App;
