import React, { useState } from 'react';

import Tabs, { Pane } from '../components/shared/Tabs';
import LatestArticles from '../components/article/LatestArticles';
import PopularArticles from '../components/article/PopularArticles';

const Home = () => {
  const [ selectedIndex, setSelectedIndex ] = useState(0);

  const panes:Pane[] = [
    {
      menuItem: 'Latest',
      render: () => <LatestArticles />
    },
    {
      menuItem: 'Popular',
      render: () => <PopularArticles />
    }
  ];

  function handleTabChange(activeIndex:Number) {
    setSelectedIndex(activeIndex ? Number(activeIndex) : 0);
  }

  return (
    <>
      <div className="hero">
        <div className="hero-body">
          <h1 className="title is-1">{ panes[selectedIndex].menuItem } Articles</h1>
        </div>
      </div>
      
      <Tabs panes={ panes } onTabChange={ handleTabChange } />
    </>
  );
};

export default Home;