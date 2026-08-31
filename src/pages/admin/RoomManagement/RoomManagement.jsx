import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api/api';
import styles from './RoomManagement.module.css';
import { toast } from 'react-toastify';
import Toolbar from '../../../components/admin/Account/Toolbar/Toolbar';
import RoomTable from '../../../components/admin/Room/RoomTable/RoomTable';
import RoomFormModal from '../../../components/admin/Room/RoomFormModal/RoomFormModal';
import RoomDetailModal from '../../../components/admin/Room/RoomDetailModal/RoomDetailModal';

function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [status, setStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [sortType, setSortType] = useState('createdAt-desc');

  const [statusList, setStatusList] = useState([]);
  const [sortList, setSortList] = useState([]);
  const [paginationObj, setPaginationObj] = useState({});
  const [bulkActions, setBulkActions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [dataInUpdateModal, setDataInUpdateModal] = useState(null);
  const [dataInDetailModal, setDataInDetailModal] = useState(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState([]);
  const allIds = rooms?.map((room) => room._id) || [];
  const isCheckAll = allIds.length > 0 && selectedIds.length === allIds.length;

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/rooms', {
        params: {
          status: status || undefined,
          keyword: keyword || undefined,
          page: page || undefined,
          sortType: sortType || undefined,
        },
      });

      setRooms(response.data.rooms);
      setStatusList(response.data.statusList);
      setSortList(response.data.sortList);
      setPaginationObj(response.data.paginationObj);
      setBulkActions(response.data.bulkActions);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi tải danh sách phòng');
      setError(err.message || 'Lỗi khi tải danh sách phòng');
    } finally {
      setLoading(false);
    }
  }, [status, keyword, page, sortType]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

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
      await api.patch(`/admin/rooms/update/${id}`, { status: newStatus });
      toast.success('Đã cập nhật trạng thái phòng');
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi cập nhật trạng thái phòng');
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
    const confirmDelete = window.confirm('Bạn có chắc chắn muốn xóa phòng này?');
    if (!confirmDelete) return;

    try {
      await api.patch(`/admin/rooms/delete/${id}`);
      toast.success('Xóa phòng thành công');
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Xóa phòng thất bại');
    }
  };

  const handleBulkActionSubmit = async (ids, type, payload) => {
    if (!ids || ids.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một phòng');
      return;
    }

    if (type === 'delete') {
      const confirmDelete = window.confirm('Bạn có chắc muốn xóa các phòng được chọn?');
      if (!confirmDelete) return;
    }

    try {
      const formPayload = { ids, payload };
      await api.patch('/admin/rooms/bulk-actions', formPayload);
      toast.success('Đã cập nhật thành công các bản ghi phòng');

      setSelectedIds([]);
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi không cập nhật được dữ liệu');
    }
  };

  const handleCheckAllClick = () => {
    if (isCheckAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);
    }
  };

  const handleCheckBoxClick = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className={styles.container}>
      {/* Tiêu đề & Nút Thêm mới */}
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h2>
            Quản lý Phòng
          </h2>
          <p className={styles.subTitle}>Quản lý ảnh nền và vị trí đặt vật phẩm trong game</p>
        </div>
        <button type="button" className={styles.btnAddRoom} onClick={handleAddClick}>
          <span>+</span> Thêm phòng mới
        </button>
      </div>

      {/* Thanh công cụ Lọc / Tìm kiếm / Sắp xếp / Bulk Actions */}
      <Toolbar
        statusList={statusList}
        sortList={sortList}
        sortType={sortType}
        bulkActions={bulkActions}
        selectedIds={selectedIds}
        searchPlaceholder="Tìm kiếm theo mã phòng, tên phòng..."
        handleChangeStatus={handleChangeStatus}
        handleSearch={handleSearch}
        handleSortType={handleSortType}
        handleBulkActionSubmit={handleBulkActionSubmit}
      />

      {/* Bảng danh sách phòng */}
      {loading ? (
        <div className={styles.loadingBox}>Đang tải danh sách phòng...</div>
      ) : error ? (
        <div className={styles.errorBox}>{error}</div>
      ) : (
        <RoomTable
          rooms={rooms}
          page={page}
          paginationObj={paginationObj}
          selectedIds={selectedIds}
          isCheckAll={isCheckAll}
          handlePage={setPage}
          handleToggleStatus={handleToggleStatus}
          handleDetailClick={handleDetailClick}
          handleUpdateClick={handleUpdateClick}
          handleDeleteClick={handleDeleteClick}
          handleCheckAllClick={handleCheckAllClick}
          handleCheckBoxClick={handleCheckBoxClick}
        />
      )}

      {/* Modal Thêm mới / Cập nhật */}
      {isModalOpen && (
        <RoomFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialData={dataInUpdateModal}
          onSuccess={fetchRooms}
        />
      )}

      {/* Modal Xem chi tiết */}
      {isDetailModalOpen && (
        <RoomDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          data={dataInDetailModal}
          onEditClick={handleUpdateClick}
        />
      )}
    </div>
  );
}

export default RoomManagement;
