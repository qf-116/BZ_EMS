import React from 'react';

export default function SpecText({ title, children }) {
  return (
    <>
      <h4>{title}</h4>
      <div>{children}</div>
    </>
  );
}
