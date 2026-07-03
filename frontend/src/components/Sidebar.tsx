import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/',               icon: '⊞',  label: 'Dashboard' },
  { to: '/employees',      icon: '👥',  label: 'Employees' },
  { to: '/timesheets',     icon: '⏱',  label: 'Timesheets' },
  { to: '/leave-requests', icon: '🗓',  label: 'Leave Requests' },
];

const getInitials = (first: string, last: string) =>
  `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase();

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">ERP System</span>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Navigation</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="avatar">
            {user ? getInitials(user.first_name, user.last_name) : '?'}
          </div>
          <div className="user-info">
            <div className="user-name">
              {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
            </div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Log out">
            ⏻
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
