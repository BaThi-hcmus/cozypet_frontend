import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/admin/AdminLayout/AdminLayout';
import AccountManagement from './pages/admin/AccountManagement/AccountManagement';

function App() {
  return (
    <Routes>
      {/* Chuyển hướng từ trang gốc về admin */}
      <Route path="/" element={<Navigate to="/admin/accounts" replace />} />

      {/* Khung layout chung */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="accounts" element={<AccountManagement />} />
      </Route>
    </Routes>
  );
}

export default App;