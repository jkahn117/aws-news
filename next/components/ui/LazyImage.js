import LazyLoad from 'react-lazyload';

function Placeholder() {
  return (
    <div className="border border-gray-300 shadow rounded-md p-4 max-w-sm w-full mx-auto">
      <div className="animate-pulse flex space-x-4">
        <div className="h-full w-full bg-gray-400"/>
      </div>
    </div>
  );
}

export default function LazyImage({ src, srcset, sizes, alt, className }) {
  return (
    <LazyLoad once offset={ 50 } placeholder={ <Placeholder /> }>
      <img src={ src }
        srcSet={ srcset }
        sizes={ sizes }
        alt={ alt }
        className={ className } />
    </LazyLoad>
  );
}