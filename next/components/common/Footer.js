export default function Footer() {
  return (
    <>
      <footer className="flex-shrink-0 w-full mt-10 pt-10 h-48 bg-gray-100 text-gray-500">
        <div className="mx-auto pt-10 text-sm leading-lg text-center">
          <p>&copy; 2019-2020. AWS News is demonstrartion only.</p>
          <p>No claims are made on content presented here.</p>
          <img className="h-8 mt-8 mx-auto" src="https://a0.awsstatic.com/libra-css/images/logos/aws_smile-header-desktop-en-white_59x35@2x.png" alt="AWS News" />
          <div className="h-10 bg-gray-100"></div>
        </div>
      </footer>
    </>
  );
};
