import React from 'react';
import { Link } from 'react-router-dom';

const AppNavBar = () => {
  return (
    <div className="is-hidden-desktop is-hidden-tablet">
      <nav className="navbar is-dark has-navbar-fixed-top" role="navigation" aria-label="main navigation">
        <div className="container">
          <div className="navbar-brand">
            <Link className="navbar-item" to="/">
                <img src="/aws.png" alt="AWS News" />
            </Link>
            <a href="#menu" role="button" className="navbar-burger" aria-label="menu" aria-expanded="false">
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
            </a>
          </div>

          <div className="navbar-menu">
            <div className="navbar-end">
              <a href="#menu" className="navbar-item">
                <span className="icon is-medium">
                  <i className="fas fa-user-circle fa-2x"></i>
                </span>
              </a>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default AppNavBar;