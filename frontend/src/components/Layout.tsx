import Sidebar from './Sidebar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    <div className="main-content">
      <div className="page-body">
        {children}
      </div>
    </div>
  </div>
);

export default Layout;
