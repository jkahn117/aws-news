import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Transition from './Transition';

/**
 * 
 * 
 * @see https://www.youtube.com/watch?v=415EfGPuhSo
 * @see https://www.jakewiesler.com/blog/compound-components-and-the-context-api/
 */

export const DropdownContext = React.createContext();

function Dropdown(props) {
  const [ isOpen, setIsOpen ] = useState(false);
  const justMounted = useRef(true);
  
  const toggle = useCallback(() => setIsOpen(oldIsOpen => !oldIsOpen), []);

  useEffect(() => {
    if (!justMounted.current && props.onToggle) {
      props.onToggle(isOpen);
    }

    justMounted.current = false;
  }, [ isOpen ]);

  const value = useMemo(() => ({ isOpen, toggle }), [ isOpen ]);

  return (
    <DropdownContext.Provider value={ value }>
      { props.children }
    </DropdownContext.Provider>
  );
}

function useDropdownContext() {
  const context = useContext(DropdownContext);

  if (!context) {
    throw new Error('Dropdown cannot be rendered outside the Dropdown component.');
  }

  return context;
}

const Button = ({ children }) => {
  const { toggle } = useDropdownContext();

  return (
    <div onClick={ toggle }>
      { children }
    </div>
  );
}
Dropdown.Button = Button;

const Menu = ({ children }) => {
  const { isOpen } = useDropdownContext();

  return (
    <Transition
      show={ isOpen }
      enter="transition ease-out duration-100"
      enterFrom="transform opacity-0 scale-95"
      enterTo="transform opacity-100 scale-100"
      leave="transition ease-in duration-75 transform"
      leaveFrom="transform opacity-100 scale-100"
      leaveTo="transform opacity-0 scale-95"
    >
      { children }
    </Transition>
  );
}
Dropdown.Menu = Menu;

export default Dropdown;
