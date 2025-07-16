
import React from 'react';

interface IconInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: string; // Nome da classe do ícone do Bootstrap, ex: 'bi-person'
}

const IconInput: React.FC<IconInputProps> = ({ icon, ...props }) => {
  return (
    <div className="relative flex items-center text-gray-500 focus-within:text-estacio-blue group">
      <span className="absolute left-4 pointer-events-none transition-colors duration-300 group-focus-within:text-estacio-blue">
        <i className={`bi ${icon} text-lg`}></i>
      </span>
      <input
        {...props}
        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-estacio-blue/50 focus:border-estacio-blue transition-colors placeholder-gray-500 text-gray-800"
      />
    </div>
  );
};

export default IconInput;
