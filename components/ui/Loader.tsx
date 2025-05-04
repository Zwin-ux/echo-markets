import React from 'react';

const Loader: React.FC = () => (
  <div className="flex justify-center items-center py-4">
    <span className="loader border-4 border-t-4 border-gray-200 h-8 w-8 rounded-full animate-spin"></span>
    <style jsx>{`
      .loader {
        border-top-color: #3498db;
      }
    `}</style>
  </div>
);

export default Loader;
