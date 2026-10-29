import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';

export default function AdminLayout() {
  const navigate = useNavigate();
  const token = localStorage.getItem('fms_admin_token');
  const user = JSON.parse(localStorage.getItem('fms_admin_user') || '{}');

  useEffect(() => {
    if (!token) navigate('/admin/login', { replace: true });
  }, [token, navigate]);

  function handleLogout() {
    localStorage.removeItem('fms_admin_token');
    localStorage.removeItem('fms_admin_user');
    navigate('/admin/login');
  }

  const navItems = [
    { to: '/admin/dashboard', icon: 'speedometer2', label: 'Dashboard' },
    { to: '/admin/farmers', icon: 'people-fill', label: 'Farmers' },
    { to: '/admin/activity', icon: 'activity', label: 'Activity Feed' },
  ];

  return (
    <div className="d-flex min-vh-100" style={{ background: '#f0f4f0' }}>
      {/* Sidebar */}
      <div
        className="d-flex flex-column flex-shrink-0 p-3 text-white shadow-sm"
        style={{ width: 240, background: 'linear-gradient(180deg, #1a3c2e 0%, #2d6a4f 100%)' }}
      >
        <div className="d-flex align-items-center gap-2 mb-4 mt-1">
          <div
            className="d-flex align-items-center justify-content-center bg-white rounded-circle"
            style={{ width: 40, height: 40 }}
          >
            <i className="bi bi-shield-lock-fill text-success fs-5"></i>
          </div>
          <div>
            <div className="fw-bold" style={{ fontSize: '14px' }}>FMS Admin</div>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>System Administration</div>
          </div>
        </div>

        <hr className="border-secondary my-2" />

        <ul className="nav nav-pills flex-column gap-1 mb-auto">
          {navItems.map(item => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center gap-2 ${isActive ? 'bg-white text-success fw-semibold' : 'text-white-50'}`
                }
                style={{ borderRadius: 8, padding: '10px 14px', fontSize: '14px', textDecoration: 'none' }}
              >
                <i className={`bi bi-${item.icon}`}></i>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <hr className="border-secondary my-2" />

        <div className="d-flex align-items-center gap-2 px-2 mb-2">
          <div
            className="d-flex align-items-center justify-content-center bg-success rounded-circle text-white"
            style={{ width: 32, height: 32, fontSize: 14 }}
          >
            <i className="bi bi-person-fill"></i>
          </div>
          <div style={{ fontSize: '12px' }}>
            <div className="text-white fw-semibold">{user.full_name || user.username}</div>
            <div style={{ opacity: 0.6 }}>Super Admin</div>
          </div>
        </div>

        <button onClick={handleLogout} className="btn btn-outline-light btn-sm w-100" style={{ fontSize: '13px' }}>
          <i className="bi bi-box-arrow-left me-2"></i>Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 overflow-auto">
        {/* Top bar */}
        <div className="bg-white border-bottom px-4 py-2 d-flex align-items-center" style={{ height: 56 }}>
          <span className="text-muted small">
            <i className="bi bi-house me-1"></i>Admin Panel
          </span>
          <div className="ms-auto d-flex align-items-center gap-2">
            <span className="badge bg-success-subtle text-success px-2 py-1">
              <i className="bi bi-circle-fill me-1" style={{ fontSize: 8 }}></i>System Online
            </span>
            <span className="text-muted small">
              {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
