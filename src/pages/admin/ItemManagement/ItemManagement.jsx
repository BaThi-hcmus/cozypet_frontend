import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api/api';
import styles from './ItemManagement.module.css';
import { toast } from 'react-toastify';
import Toolbar from '../../../components/admin/Account/Toolbar/Toolbar';
import ItemTable from '../../../components/admin/Item/ItemTable/ItemTable';
import ItemFormModal from '../../../components/admin/Item/ItemFormModal/ItemFormModal';
import ItemDetailModal from '../../../components/admin/Item/ItemDetailModal/ItemDetailModal';

function ItemManagement() {
  const [items, setItems] = useState([]);
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
  const allIds = items?.map((item) => item._id) || [];
  const isCheckAll = allIds.length > 0 && selectedIds.length === allIds.length;

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/items', {
        params: {
          status: status || undefined,
          keyword: keyword || undefined,
          page: page || undefined,
          sortType: sortType || undefined,
        },
      });

      setItems(response.data.items);
      setStatusList(response.data.statusList);
      setSortList(response.data.sortList);
      setPaginationObj(response.data.paginationObj);
      setBulkActions(response.data.bulkActions);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi tải danh sách vật phẩm');
      setError(err.message || 'Lỗi khi tải danh sách vật phẩm');
    } finally {
      setLoading(false);
    }
  }, [status, keyword, page, sortType]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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
      await api.patch(`/admin/items/update/${id}`, { status: newStatus });
      toast.success('Đã cập nhật trạng thái vật phẩm');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi cập nhật trạng thái vật phẩm');
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
    const confirmDelete = window.confirm('Bạn có chắc chắn muốn xóa vật phẩm này?');
    if (!confirmDelete) return;

    try {
      await api.patch(`/admin/items/delete/${id}`);
      toast.success('Xóa vật phẩm thành công');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Xóa vật phẩm thất bại');
    }
  };

  const handleBulkActionSubmit = async (ids, type, payload) => {
    if (!ids || ids.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một vật phẩm');
      return;
    }

    if (type === 'delete') {
      const confirmDelete = window.confirm('Bạn có chắc muốn xóa các vật phẩm được chọn?');
      if (!confirmDelete) return;
    }

    try {
      const formPayload = { ids, payload };
      await api.patch('/admin/items/bulk-actions', formPayload);
      toast.success('Đã cập nhật thành công các bản ghi vật phẩm');

      setSelectedIds([]);
      fetchItems();
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
            Quản lý Vật phẩm
          </h2>
          <p className={styles.subTitle}>Quản lý vật phẩm trang trí, nội thất, đồ chơi và thức ăn thú cưng</p>
        </div>
        <button type="button" className={styles.btnAddItem} onClick={handleAddClick}>
          <span>+</span> Thêm vật phẩm mới
        </button>
      </div>

      {/* Thanh công cụ Lọc / Tìm kiếm / Sắp xếp / Bulk Actions */}
      <Toolbar
        statusList={statusList}
        sortList={sortList}
        sortType={sortType}
        bulkActions={bulkActions}
        selectedIds={selectedIds}
        searchPlaceholder="Tìm kiếm theo tên vật phẩm, loại, danh mục..."
        handleChangeStatus={handleChangeStatus}
        handleSearch={handleSearch}
        handleSortType={handleSortType}
        handleBulkActionSubmit={handleBulkActionSubmit}
      />

      {/* Bảng danh sách vật phẩm */}
      {loading ? (
        <div className={styles.loadingBox}>Đang tải danh sách vật phẩm...</div>
      ) : error ? (
        <div className={styles.errorBox}>{error}</div>
      ) : (
        <ItemTable
          items={items}
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
      <ItemFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={dataInUpdateModal}
        onSuccess={fetchItems}
      />

      {/* Modal Xem chi tiết */}
      <ItemDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        data={dataInDetailModal}
        onEditClick={handleUpdateClick}
      />
    </div>
  );
}

export default ItemManagement;
