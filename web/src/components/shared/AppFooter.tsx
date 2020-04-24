import React from 'react';

const Footer = () => {
  function currentYear() {
    return new Date().getUTCFullYear();
  }

  return (
    <footer className="footer">
      <div className="container has-text-centered">
        <figure className="image is-3x2">
          <img src="/aws.png" alt="AWS News" style={{ maxWidth: '150px' }} className="has-image-centered" />
        </figure>
        <p>&copy; 2019-{ `${currentYear()}` } - This site is for demonstration purposes only.</p>
      </div>
    </footer>
  );
}

export default Footer;
