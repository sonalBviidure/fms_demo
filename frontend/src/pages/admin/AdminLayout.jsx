import React, { Component, useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, Link, Navigate } from 'react-router-dom';

class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Admin Panel caught render error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="card border-danger shadow-sm p-4 m-3 bg-white" style={{ borderRadius: 12 }}>
          <div className="d-flex align-items-center gap-3 mb-3 text-danger">
            <i className="bi bi-exclamation-triangle-fill fs-2"></i>
            <div>
              <h5 className="mb-0 fw-bold">Admin Panel Render Error</h5>
              <small className="text-muted">A rendering issue was prevented from blanking the screen.</small>
            </div>
          </div>
          <div className="alert alert-danger py-2 small font-monospace">
            {this.state.error?.message || 'Unknown render error'}
          </div>
          <div>
            <button
              className="btn btn-sm btn-success me-2"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>Reload Page
            </button>
            <Link to="/admin/dashboard" className="btn btn-sm btn-outline-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const token = localStorage.getItem('fms_admin_token');
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('fms_admin_user') || '{}');
  } catch {
    user = {};
  }
  const [collapsed, setCollapsed] = useState(false);
  const [currentSystemTime, setCurrentSystemTime] = useState(new Date());

  // Keep live system date and clock accurate
  useEffect(() => {
    const timer = setInterval(() => setCurrentSystemTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  function handleLogout() {
    localStorage.removeItem('fms_admin_token');
    localStorage.removeItem('fms_admin_user');
    navigate('/admin/login');
  }

  // If unauthenticated, redirect directly to admin login
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  // Clean navigation sections strictly for the software administrator
  const navSections = [
    {
      title: 'OPERATIONS',
      items: [
        { to: '/admin/dashboard', icon: 'speedometer2', label: 'Dashboard' },
        { to: '/admin/farmer-lookup', icon: 'people-fill', label: 'Farmer Lookup' },
        { to: '/admin/users', icon: 'person-gear', label: 'User Management' },
      ],
    },
    {
      title: 'MONITORING & PLATFORM',
      items: [
        { to: '/admin/ai-monitoring', icon: 'cpu-fill', label: 'AI/ML Monitoring' },
        { to: '/admin/system', icon: 'hdd-network-fill', label: 'System Monitoring' },
        { to: '/admin/settings', icon: 'gear-fill', label: 'Settings' },
      ],
    },
  ];

  return (
    <div className="d-flex min-vh-100" style={{ background: '#f4f6f8' }}>
      {/* Sidebar */}
      <div
        className="d-flex flex-column flex-shrink-0 text-white shadow-sm"
        style={{
          width: collapsed ? 80 : 255,
          transition: 'width 0.25s ease',
          background: 'linear-gradient(180deg, #0e2a1d 0%, #1a4d36 60%, #153c2a 100%)',
          zIndex: 1000,
        }}
      >
        {/* Brand Header */}
        <div className="p-3 d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25">
          <div className="d-flex align-items-center gap-2 overflow-hidden">
            <div
              className="d-flex align-items-center justify-content-center bg-white rounded-3 flex-shrink-0 shadow-sm"
              style={{ width: 38, height: 38 }}
            >
              <i className="bi bi-shield-check text-success fs-5"></i>
            </div>
            {!collapsed && (
              <div>
                <div className="fw-bold lh-1 text-white" style={{ fontSize: '15px' }}>
                  FMS Admin
                </div>
                <div className="text-white-50" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                  Operations Center
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="btn btn-sm text-white-50 p-1 border-0 hover-light d-none d-md-block"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <i className={`bi bi-${collapsed ? 'chevron-right' : 'chevron-left'}`}></i>
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-grow-1 overflow-auto py-2 px-2" style={{ scrollbarWidth: 'thin' }}>
          {navSections.map((sec, idx) => (
            <div key={idx} className="mb-3">
              {!collapsed && (
                <div
                  className="px-3 mb-1 text-white-50 fw-semibold"
                  style={{ fontSize: '10px', letterSpacing: '0.8px' }}
                >
                  {sec.title}
                </div>
              )}
              <ul className="nav nav-pills flex-column gap-1">
                {sec.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `nav-link d-flex align-items-center gap-2 ${
                          isActive
                            ? 'bg-success text-white fw-semibold shadow-sm'
                            : 'text-white-50 hover-sidebar'
                        }`
                      }
                      style={{
                        borderRadius: 8,
                        padding: collapsed ? '9px 0' : '8px 12px',
                        fontSize: '13.5px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                      }}
                    >
                      <i className={`bi bi-${item.icon} ${collapsed ? 'fs-5' : 'fs-6'}`}></i>
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-top border-secondary border-opacity-25 bg-black bg-opacity-20">
          <div className={`d-flex align-items-center ${collapsed ? 'justify-content-center' : 'gap-2'} mb-2`}>
            <div
              className="d-flex align-items-center justify-content-center bg-success text-white rounded-circle flex-shrink-0"
              style={{ width: 34, height: 34, fontSize: 14 }}
            >
              <i className="bi bi-person-badge"></i>
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-grow-1">
                <div className="text-white fw-semibold text-truncate" style={{ fontSize: '12.5px' }}>
                  {user.full_name || user.username || 'System Admin'}
                </div>
                <div className="text-white-50 small" style={{ fontSize: '11px' }}>
                  Super Admin
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`btn btn-sm btn-outline-light w-100 d-flex align-items-center justify-content-center ${
              collapsed ? 'p-1' : ''
            }`}
            style={{ fontSize: '12px' }}
            title="Logout from Admin"
          >
            <i className={`bi bi-box-arrow-left ${collapsed ? '' : 'me-1'}`}></i>
            {!collapsed && 'Logout'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column min-w-0 overflow-auto">
        {/* Top Navbar */}
        <header
          className="bg-white border-bottom px-4 d-flex align-items-center justify-content-between shadow-sm flex-shrink-0"
          style={{ height: 60 }}
        >
          <div className="d-flex align-items-center gap-3">
            <span className="badge bg-light text-secondary border px-2 py-1">
              <i className="bi bi-shield-lock me-1 text-success"></i>Admin Console
            </span>
            <span className="text-muted small d-none d-md-inline">
              FMS Operations &amp; Governance
            </span>
          </div>

          <div className="d-flex align-items-center gap-3">
            <Link
              to="/dashboard"
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
              style={{ fontSize: '12px' }}
            >
              <i className="bi bi-box-arrow-up-right"></i>
              <span className="d-none d-sm-inline">Farmer Portal</span>
            </Link>

            <span className="badge bg-success-subtle text-success px-2 py-1 rounded-pill">
              <i className="bi bi-circle-fill me-1" style={{ fontSize: 7 }}></i>Live Production
            </span>

            {/* Dynamic System Date & Live Clock */}
            <div className="text-dark fw-semibold small d-none d-lg-block border-start ps-3">
              <i className="bi bi-calendar3 me-1 text-success"></i>
              {currentSystemTime.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
              <span className="text-muted ms-2 fw-normal">
                {currentSystemTime.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content with Error Boundary */}
        <main className="p-4 flex-grow-1">
          <AdminErrorBoundary>
            <Outlet />
          </AdminErrorBoundary>
        </main>
      </div>
    </div>
  );
}
