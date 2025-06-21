import React, { useState, memo } from 'react';

const NavigationMenu = memo(({
  view,
  dashboardTab,
  onNavigate,
  onDashboardTabChange,
  onLogout,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleNavigation = (newView, tab = null) => {
    if (tab) {
      onDashboardTabChange(tab);
    }
    onNavigate(newView);
    closeMenu();
  };

  return (
    <>
      {/* Hamburger button */}
      <button
        data-testid="hamburger-menu-btn"
        className="hamburger-btn"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '4px',
          padding: '8px',
          marginLeft: '8px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '32px',
          height: '32px',
        }}
      >
        <span style={{ height: '2px', background: 'white', display: 'block' }} />
        <span style={{ height: '2px', background: 'white', display: 'block' }} />
        <span style={{ height: '2px', background: 'white', display: 'block' }} />
      </button>

      {/* Menu dropdown overlay */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
          onClick={closeMenu}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '70%',
              maxWidth: '300px',
              height: '100%',
              backgroundColor: 'white',
              boxShadow: '-2px 0 10px rgba(0,0,0,0.2)',
              padding: '1.5rem',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: '#15803d',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '0.5rem',
              }}
              >
                Navigation
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  data-testid="menu-nav-new-round"
                  style={{
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    fontSize: '1rem',
                    padding: '0.5rem',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    backgroundColor: view === 'setup' ? '#f0fdf4' : 'transparent',
                    color: view === 'setup' ? '#15803d' : '#1f2937',
                  }}
                  onClick={() => handleNavigation('setup')}
                >
                  New Round
                </button>
              </div>
            </div>

            {/* Dashboard Pages */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: '#15803d',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '0.5rem',
              }}
              >
                Dashboard
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { key: 'profile', label: 'Profile' },
                  { key: 'stats', label: 'Stats' },
                  { key: 'history', label: 'History' },
                  { key: 'friends', label: 'Golf Buddies' },
                  { key: 'rounds', label: 'Rounds' },
                  { key: 'notifications', label: 'Notifications' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    data-testid={`menu-nav-${key}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      fontSize: '1rem',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      backgroundColor: view === 'dashboard' && dashboardTab === key ? '#f0fdf4' : 'transparent',
                      color: view === 'dashboard' && dashboardTab === key ? '#15803d' : '#1f2937',
                    }}
                    onClick={() => handleNavigation('dashboard', key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                marginBottom: '1rem',
                color: '#15803d',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '0.5rem',
              }}
              >
                Account
              </h3>
              <button
                data-testid="menu-logout-btn"
                style={{
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: '1rem',
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  color: '#ef4444',
                }}
                onClick={() => {
                  onLogout();
                  closeMenu();
                }}
              >
                Log Out
              </button>
            </div>

            <div style={{ marginTop: 'auto' }}>
              <button
                data-testid="menu-close-btn"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  border: 'none',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
                onClick={closeMenu}
              >
                Close Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

NavigationMenu.displayName = 'NavigationMenu';

export default NavigationMenu;
