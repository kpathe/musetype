import React from 'react';

const Caret = ({ left = 0, top = 0 }) => {
  return (
    <div 
      className="caret"
      style={{
        left: `${left}px`,
        top: `${top}px`
      }}
    />
  );
};

export default Caret;
