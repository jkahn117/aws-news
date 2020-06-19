

export default function Loader() {
  return (
    <div className="px-4 py-6 m-auto text-indigo-500 flex justify-between items-center w-32">
      {/* By Sam Herbert (@sherb), for everyone. More @ http://goo.gl/7AJzbL */}
      <svg  xmlns="http://www.w3.org/2000/svg" stroke="currentColor" viewBox="0 0 38 38" className="h-6 w-auto inline-block">
          <g fill="none" fillRule="evenodd">
              <g transform="translate(1 1)" strokeWidth="2">
                  <circle strokeOpacity=".5" cx="18" cy="18" r="18"/>
                  <path d="M36 18c0-9.94-8.06-18-18-18">
                      <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from="0 18 18"
                          to="360 18 18"
                          dur="1s"
                          repeatCount="indefinite"/>
                  </path>
              </g>
          </g>
      </svg>
      <span className="text-gray-800 text-sm leading-5">Loading...</span>
    </div>
  );
}