import React from 'react';

const EnvDebug: React.FC = () => {
  const mode = process.env.NODE_ENV;
  const dev = process.env.NODE_ENV === 'development';
  const prod = process.env.NODE_ENV === 'production';
  const firebaseProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

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
      <div><strong>Firebase Project:</strong> {firebaseProject || 'undefined'}</div>
      <div><strong>MODE:</strong> {mode}</div>
      <div><strong>DEV:</strong> {dev ? 'true' : 'false'}</div>
      <div><strong>PROD:</strong> {prod ? 'true' : 'false'}</div>
      <div><strong>Window location:</strong> {typeof window !== 'undefined' ? window.location.origin : 'SSR'}</div>
    </div>
  );
};

export default EnvDebug;
