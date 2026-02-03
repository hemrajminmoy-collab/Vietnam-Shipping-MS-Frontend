import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Box,
  LogOut
} from 'lucide-react';

import BulkShipmentForm from './components/BulkShipmentForm';
import Dashboard from './components/Dashboard';
import ContainerList from './components/ContainerList';
import Login from './components/Login';
import WarehouseSection from './Dashboard Sections/WarehouseSection';

import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // 🔐 Restore login on refresh
  useEffect(() => {
    const loggedIn = localStorage.getItem('isAuthenticated');
    if (loggedIn === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  // 🔐 Login Screen ONLY (no UI touched)
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create-shipment', label: 'Create Shipment', icon: PlusCircle },
    { id: 'Expenses', label: 'Expenses', icon: Box },
    { id: 'warehouse', label: 'Warehouse', icon: Box }
  ];

  return (
    <div className="app-expenses">
      {/* SIDEBAR — UNCHANGED */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {!isCollapsed && <span className="brand-logo">Vietnam Trading</span>}
          <button
            className="toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
        </div>

        <nav className="nav-menu">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon size={22} />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={22} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT — UNCHANGED */}
      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'create-shipment' && <BulkShipmentForm />}
        {activeTab === 'Expenses' && <ContainerList />}
        {activeTab === 'warehouse' && <WarehouseSection />}
      </main>
    </div>
  );
}

export default App;
