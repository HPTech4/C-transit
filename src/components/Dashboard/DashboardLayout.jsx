import { useState } from 'react';
import SidebarDrawer from './SidebarDrawer';
import HeaderBar from './HeaderBar';
import BottomNav from './BottomNav';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout({ children, activePage = 'home', onNavigate, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.shell}>
      {/* Sidebar Drawer */}
      <SidebarDrawer
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activePage={activePage}
        onNavigate={(page) => {
          onNavigate(page);
          setSidebarOpen(false);
        }}
      />

      {/* Dark Overlay Behind Sidebar */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Fixed Top Header */}
      <HeaderBar onMenuClick={() => setSidebarOpen(true)} />

      {/* Scrollable Page Content */}
      <main className={styles.main}>
        {children}
      </main>

      {/* Fixed Bottom Nav */}
      <BottomNav activePage={activePage} onTabChange={onNavigate} />
    </div>
  );
}
