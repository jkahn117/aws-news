import { useEffect, useState } from 'react';

import ShareIcon from 'heroicons/outline/share.svg';

export default function Share({ title, text, url }) {
  const [ shareSupported, setShareSupported ] = useState(false);

  useEffect(() => {
    console.log(navigator.share)
    if (navigator.share) {
      setShareSupported(true);
    }
  }, []);

  async function doShare() {
    try {
      await navigator.share({
        title: title,
        text: text,
        url: url
      })
    } catch(err) {
      console.log(err);
    }
    
  };

  return (
    <>
    { shareSupported &&
        <button onClick={ () => doShare() } className="h-6 w-6 text-indigo-800">
          <ShareIcon />
        </button>
    }
    </>
  );
}