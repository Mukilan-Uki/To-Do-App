import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">Oops! Page not found.</p>
      <Link to="/" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all">
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFound;
