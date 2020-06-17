export default function PageHeader({ title }) {
  return (
    <header className="bg-white border-b border-gray-300">
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-4xl">
          { title || '' }
        </h1>
      </div>
    </header>
  );
};
