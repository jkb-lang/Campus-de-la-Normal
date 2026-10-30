import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../common/Navbar';
import { Sidebar } from '../common/Sidebar';

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Sidebar - responsive desktop visible, mobile toggle */}
      <div style={{
        display: sidebarOpen ? 'block' : 'none',
        '@media (min-width: 1024px)': { display: 'block' },
      }} className="sidebar-wrapper">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="page-wrapper">
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .sidebar-wrapper {
            position: fixed;
            inset: 0;
            z-index: 50;
            width: 260px;
          }
        }
        @media (min-width: 1024px) {
          .sidebar-wrapper {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
};
