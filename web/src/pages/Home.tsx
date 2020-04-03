import React, { useState } from 'react';

import { Tab, Header, TabProps } from 'semantic-ui-react';
import LatestArticles from '../components/article/LatestArticles';
import PopularArticles from '../components/article/PopularArticles';

const Home = () => {
  const [ selectedIndex, setSelectedIndex ] = useState(0);

  // @ts-ignore
  const panes = [
    {
      menuItem: 'Latest',
      render: () => <Tab.Pane as='div'><LatestArticles /></Tab.Pane>
    },
    {
      menuItem: 'Popular',
      render: () => <Tab.Pane as='div'><PopularArticles /></Tab.Pane>
    }
  ];

  // @ts-ignore
  function handleTabChange(_, { activeIndex }:TabProps) {
    setSelectedIndex(activeIndex ? Number(activeIndex) : 0);
  }

  return (
    <>
      <Header as='h1'>{ panes[selectedIndex].menuItem } Articles</Header>
      <Tab menu={{ color: 'orange', secondary: true, pointing: true }}
          panes={ panes }
          onTabChange={ handleTabChange } />
    </>
  );
};

export default Home;