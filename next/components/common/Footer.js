
export default function Footer() {
  return (
    <>
      <footer className="flex-shrink-0 w-full mt-10 pt-8 bg-gray-100 text-gray-500 border-t border-gray-300">
        <div className="mx-auto  text-sm leading-lg text-center">
          <p>&copy; 2019-2020. AWS News is for demonstrartion only.</p>
          <p>No claims are made on content presented here.</p>

          <img className="h-8 my-8 mx-auto" src="https://a0.awsstatic.com/libra-css/images/logos/aws_smile-header-desktop-en-white_59x35@2x.png" alt="AWS News" />
          <div className="h-12 bg-gray-100"></div>
        </div>
      </footer>
    </>
  );
};
