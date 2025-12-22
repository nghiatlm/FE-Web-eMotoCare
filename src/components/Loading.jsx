import React from "react";

const Loading = ({ 
  size = "large",
  className = "" 
}) => {
  const sizeClasses = {
    small: "h-8 w-8",
    medium: "h-10 w-10",
    large: "h-12 w-12",
  };

  const spinnerSize = sizeClasses[size] || sizeClasses.large;

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="relative">
        {/* Outer spinning ring */}
        <div 
          className={`inline-block animate-spin rounded-full ${spinnerSize} border-4 border-slate-200 border-t-primary`}
        ></div>
        {/* Inner counter-rotating ring for visual effect */}
        <div 
          className={`absolute inset-0 inline-block animate-spin rounded-full ${spinnerSize} border-4 border-transparent border-r-primary/30`}
          style={{ 
            animationDirection: 'reverse', 
            animationDuration: '1.5s' 
          }}
        ></div>
      </div>
    </div>
  );
};

export default Loading;

