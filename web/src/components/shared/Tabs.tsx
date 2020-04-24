import React, { SyntheticEvent, useEffect, useState } from 'react';

interface TabsProps {
  // initial activeIndex
  defaultActiveIndex?: number;
  // called on tab change
  onTabChange(selectedIndex:number): void;
  // listing of panes to be shown in tabs
  panes: Pane[];
};

export interface Pane {
  menuItem: string;
  render: Function;
};

interface TabsMenuProps {
  activeIndex: number;
  panes: Pane[];
  onTabSelected(e:SyntheticEvent, index:number): void;
};

const TabsMenu = (props: TabsMenuProps) => {
  const { activeIndex, onTabSelected, panes } = props;

  return (
    <div className="tabs is-centered is-large">
      <ul>
        { panes.map((p, index) => 
          <li className={ index === activeIndex ? 'is-active' : '' } key={ index }>
            <a aria-label={ p.menuItem }
                aria-expanded={ index === activeIndex ? 'true' : 'false' }
                href={ `#${p.menuItem.toLowerCase()}` }
                onClick={ e => onTabSelected(e, index) }>{ p.menuItem }</a>
          </li>
        ) }
      </ul>
    </div>
  );
};

interface TabsPaneProps {
  activeIndex: number;
  panes: Pane[];
};

const TabsPane = (props: TabsPaneProps) => {
  const { activeIndex, panes } = props;

  return (
    <div>
      { panes[activeIndex].render() }
    </div>
  );
};

const Tabs = (props: TabsProps) => {
  const [ activeIndex, setActiveIndex ] = useState(0);
  const { panes, onTabChange } = props;

  useEffect(() => {
    if (props.defaultActiveIndex) {
      setActiveIndex(props.defaultActiveIndex);
    }
  }, [ props ]);

  function onTabSelected (e:SyntheticEvent, index:number) {
    setActiveIndex(index);
    onTabChange(index);
  }

  return (
    <>
      <TabsMenu activeIndex={ activeIndex }
                panes={ panes }
                onTabSelected={ onTabSelected } />

      <TabsPane activeIndex={ activeIndex }
                panes={ panes } />
    </>
  );
};

export default Tabs;
