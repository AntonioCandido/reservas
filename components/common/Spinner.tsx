
import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center h-full w-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-estacio-blue"></div>
    </div>
  );
};

export default Spinner;