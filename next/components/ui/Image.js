import { useEffect, useRef, useState } from 'react'

export default function Image({ src, alt, className }) {
  const image = useRef(null);

  const [ isLoaded, setIsLoaded ] = useState(false);
  const [ imageSrc, setImageSrc ] = useState();


  useEffect(() => {
    let observer;
    let cancelled = false;

    if (image && src) {
      if (IntersectionObserver) {
        observer = new IntersectionObserver( (entries) => {
          entries.forEach( (entry) => {
            if ( !cancelled && (entry.intersectionRatio > 0 || entry.isIntersecting) ) {
              setImageSrc(src);
            }
          })
        }, {
          threshold: 0.01,
          rootMargin: '75%'
        });
        observer.observe(image.current);
      } else { // support older browsers
        setImageSrc(src);
      }
    }

    return () => {
      cancelled = true;
      if (observer && observer.unobserve) {
        observer.unobserve(image.current)
      }
    };
  }, [])

  return (
    <>
      <img ref={ image } src={ imageSrc } alt={ alt } className={ className } />

      <style jsx>{`
        
      `}</style>
    </>
  );
}