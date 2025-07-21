import React from 'react'

const SpinnerLoader = ({ 
  width = "w-5", 
  height = "h-5", 
  isFullScreen = true,
  color = "border-gray-900"
}) => {
  return (
    <div className={`${isFullScreen ? 'fixed inset-0 flex justify-center items-center' : 'inline-flex'}`}>
      <div 
        className={`animate-spin rounded-full ${height} ${width} border-t-2 border-b-2 ${color}`}
      >
      </div>
    </div>
  );
};

export default SpinnerLoader;
