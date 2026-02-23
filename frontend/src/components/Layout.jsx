import React from 'react';
import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="app-wrapper">
      <Navbar />
      <main className="main-content">{children}</main>
      <footer className="footer">
        &copy; {new Date().getFullYear()} Smart EMR &amp; Diagnostic Assistant. Built with React &amp; Node.js.
      </footer>
    </div>
  );
}
