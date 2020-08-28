import { useEffect, useRef, useState } from 'react';

import LazyLoad from 'react-lazyload';

export default function LazyImage({ src, srcset, sizes, alt, className }) {
  return (
    <LazyLoad once offset={ 50 }>
      <img src={ src }
        srcSet={ srcset }
        sizes={ sizes }
        alt={ alt }
        className={ className } />
    </LazyLoad>
  );
}