import React, { useCallback, useEffect, useState } from 'react';
import Toolbar from '../../../components/admin/Account/Toolbar/Toolbar';
import AccountTable from '../../../components/admin/Account/AccountTable/AccountTable';
import AccountFormModal from '../../../components/admin/Account/AccountFormModal/AccountFormModal';
import AccountDetailModal from '../../../components/admin/Account/AccountDetailModal/AccountDetailModal';
import styles from './AccountManagement.module.css';
import api from '../../../api/api';
import { toast } from 'react-toastify'; // Import toast

function AccountManagement() {
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [sortType, setSortType] = useState('createdAt-desc');

  const [accounts, setAccounts] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [sortList, setSortList] = useState([]);
  const [paginationObj, setPaginationObj] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [dataInUpdateModal, setDataInUpdateModal] = useState(null);
  const [dataInDetailModal, setDataInDetailModal] = useState(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/accounts/', {
        params: {
          status: status || undefined,
          keyword: keyword || undefined,
          page: page || undefined,
          sortType: sortType || undefined
        }
      });

      setAccounts(response.data.accounts);
      setStatusList(response.data.statusList);
      setSortList(response.data.sortList);
      setPaginationObj(response.data.paginationObj);
    } catch (err) {
      toast.error(err.message || 'Lỗi khi tải danh sách tài khoản')
      setError(err.message || 'Lỗi khi tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  }, [status, keyword, page, sortType]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleAddClick = () => {
    setDataInUpdateModal(null);
    setIsModalOpen(true);
  };

  const handleChangeStatus = useCallback((newStatus) => {
    setStatus(newStatus);
    setPage(1);
  }, []);

  const handleSearch = useCallback((e) => {
    setKeyword(e.target.value);
    setPage(1);
  }, []);

  const handleSortType = useCallback((newSortType) => {
    setSortType(newSortType);
    setPage(1);
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/admin/accounts/update/${id}`, { status: newStatus });
      toast.success('Đã đổi trạng thái tài khoản');
      fetchAccounts();
    } catch (err) {
      toast.error(err.message || 'Lỗi cập nhật trạng thái tài khoản');
    }
  };

  const handleUpdateClick = (data) => {
    setDataInUpdateModal(data);
    setIsModalOpen(true);
  };

  const handleDetailClick = (data) => {
    setDataInDetailModal(data);
    setIsDetailModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản này không?')) {
      try {
        await api.patch(`/admin/accounts/delete/${id}`);
        toast.success('Đã xóa tài khoản');
        fetchAccounts();
      } catch (err) {
        toast.error(err.message || 'Lỗi khi xóa tài khoản');
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeaderRow}>
        <div>
          <h2>Quản lý tài khoản</h2>
          <p>Quản lý danh sách nhân viên và quyền hạn trong hệ thống</p>
        </div>
        <button type="button" className={styles.btnAddAccount} onClick={handleAddClick}>
          + Thêm tài khoản mới
        </button>
      </div>

      {error && <div className={styles.errorMsg}>{error}</div>}

      {/* Toolbar lọc, tìm kiếm, sắp xếp */}
      <Toolbar
        statusList={statusList}
        sortList={sortList}
        sortType={sortType}
        handleChangeStatus={handleChangeStatus}
        handleSearch={handleSearch}
        handleSortType={handleSortType}
      />

      {/* Bảng danh sách tài khoản */}
      <AccountTable
        accounts={accounts}
        page={page}
        paginationObj={paginationObj}
        handlePage={setPage}
        handleToggleStatus={handleToggleStatus}
        handleUpdateClick={handleUpdateClick}
        handleDetailClick={handleDetailClick}
        handleDeleteClick={handleDeleteClick}
      />

      {/* Modal Thêm / Cập nhật */}
      <AccountFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={dataInUpdateModal}
        onSuccess={fetchAccounts}
      />

      {/* Modal Xem chi tiết */}
      <AccountDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        data={dataInDetailModal}
        onEditClick={handleUpdateClick}
      />
    </div>
  );
}

export default AccountManagement;