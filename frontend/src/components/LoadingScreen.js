import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="text-white mt-4 text-lg font-medium opacity-70">
        Loading Rakesh School Attendance...
      </p>
    </div>
  );
};

export default LoadingScreen;