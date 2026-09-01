import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/admin/AdminLayout/AdminLayout';
import AccountManagement from './pages/admin/AccountManagement/AccountManagement';
import ItemManagement from './pages/admin/ItemManagement/ItemManagement';
import RoomManagement from './pages/admin/RoomManagement/RoomManagement';
import PetTemplateManagement from './pages/admin/PetTemplateManagement/PetTemplateManagement';
import { ToastContainer } from 'react-toastify'; // tạo thông báo bên frontend
import 'react-toastify/dist/ReactToastify.css';
import 'react-image-crop/dist/ReactCrop.css'; // thư viện cắt ảnh

function App() {
  return (
    <>
      <Routes>
        {/* Chuyển hướng từ trang gốc về admin */}
        <Route path="/" element={<Navigate to="/admin/accounts" replace />} />

        {/* Khung layout chung */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="accounts" element={<AccountManagement />} />
          <Route path="items" element={<ItemManagement />} />
          <Route path="rooms" element={<RoomManagement />} />
          <Route path="pet-templates" element={<PetTemplateManagement />} />
        </Route>
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

export default App;