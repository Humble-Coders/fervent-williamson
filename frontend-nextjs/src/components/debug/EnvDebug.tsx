import React from 'react';

const EnvDebug: React.FC = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const mode = process.env.NODE_ENV;
  const dev = process.env.NODE_ENV === 'development';
  const prod = process.env.NODE_ENV === 'production';

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 5px 0' }}>Environment Debug</h4>
      <div><strong>NEXT_PUBLIC_API_URL:</strong> {apiUrl || 'undefined'}</div>
      <div><strong>MODE:</strong> {mode}</div>
      <div><strong>DEV:</strong> {dev ? 'true' : 'false'}</div>
      <div><strong>PROD:</strong> {prod ? 'true' : 'false'}</div>
      <div><strong>Window location:</strong> {window.location.origin}</div>
    </div>
  );
};

export default EnvDebug;
