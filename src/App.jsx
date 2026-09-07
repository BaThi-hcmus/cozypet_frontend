import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/admin/Layout/AdminLayout';
import AccountManagement from './pages/admin/AccountManagement/AccountManagement';
import ItemManagement from './pages/admin/ItemManagement/ItemManagement';
import RoomManagement from './pages/admin/RoomManagement/RoomManagement';
import PetTemplateManagement from './pages/admin/PetTemplateManagement/PetTemplateManagement';
import Login from './pages/admin/Login/Login';
import PetSetup from './pages/client/PetSetup/PetSetup';
import Room from './pages/client/Room/Room';
import ClientLayout from './components/client/Layout/ClientLayout';
import ClientLogin from './pages/client/Login/Login';
import ClientRegister from './pages/client/Register/Register';
import { ToastContainer } from 'react-toastify'; // tạo thông báo bên frontend
import 'react-toastify/dist/ReactToastify.css';
import 'react-image-crop/dist/ReactCrop.css'; // thư viện cắt ảnh

function App() {
  return (
    <>
      <Routes>
        {/* Khung layout chung cho client */}
        <Route element={<ClientLayout />}>
          <Route path="/" element={<PetSetup />} />
          <Route path="/room" element={<Room />} />
        </Route>

        {/* Auth pages cho client */}
        <Route path="/login" element={<ClientLogin />} />
        <Route path="/register" element={<ClientRegister />} />

        {/* Login page */}
        <Route path="/admin/login" element={<Login />} />

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