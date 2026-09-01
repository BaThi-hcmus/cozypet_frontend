import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api/api';
import styles from './PetTemplateManagement.module.css';
import { toast } from 'react-toastify';
import Toolbar from '../../../components/admin/Account/Toolbar/Toolbar';
import PetTemplateTable from '../../../components/admin/PetTemplate/PetTemplateTable/PetTemplateTable';
import PetTemplateFormModal from '../../../components/admin/PetTemplate/PetTemplateFormModal/PetTemplateFormModal';
import PetTemplateDetailModal from '../../../components/admin/PetTemplate/PetTemplateDetailModal/PetTemplateDetailModal';

function PetTemplateManagement() {
  const [petTemplates, setPetTemplates] = useState([]);
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

  const [selectedIds, setSelectedIds] = useState([]);
  const allIds = petTemplates?.map((item) => item._id) || [];
  const isCheckAll = allIds.length > 0 && selectedIds.length === allIds.length;

  const fetchPetTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/pet-templates', {
        params: {
          status: status || undefined,
          keyword: keyword || undefined,
          page: page || undefined,
          sortType: sortType || undefined,
        },
      });

      setPetTemplates(response.data.petTemplates);
      setStatusList(response.data.statusList);
      setSortList(response.data.sortList);
      setPaginationObj(response.data.paginationObj);
      setBulkActions(response.data.bulkActions);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi tải danh sách mẫu pet');
      setError(err.message || 'Lỗi khi tải danh sách mẫu pet');
    } finally {
      setLoading(false);
    }
  }, [status, keyword, page, sortType]);

  useEffect(() => {
    fetchPetTemplates();
  }, [fetchPetTemplates]);

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
      await api.patch(`/admin/pet-templates/update/${id}`, { status: newStatus });
      toast.success('Đã cập nhật trạng thái mẫu pet');
      fetchPetTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Lỗi cập nhật trạng thái mẫu pet');
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
    const confirmDelete = window.confirm('Bạn có chắc chắn muốn xóa mẫu pet này?');
    if (!confirmDelete) return;

    try {
      await api.patch(`/admin/pet-templates/delete/${id}`);
      toast.success('Xóa mẫu pet thành công');
      fetchPetTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Xóa mẫu pet thất bại');
    }
  };

  const handleBulkActionSubmit = async (ids, type, payload) => {
    if (!ids || ids.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một mẫu pet');
      return;
    }

    if (type === 'delete') {
      const confirmDelete = window.confirm('Bạn có chắc muốn xóa các mẫu pet được chọn?');
      if (!confirmDelete) return;
    }

    try {
      await api.patch('/admin/pet-templates/bulk-actions', { ids, payload });
      toast.success('Đã cập nhật thành công các bản ghi mẫu pet');
      setSelectedIds([]);
      fetchPetTemplates();
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
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h2>Quản lý Mẫu Pet</h2>
          <p className={styles.subTitle}>
            Quản lý template pet — AI Gemini tự phân tích đặc điểm từ ảnh avatar
          </p>
        </div>
        <button type="button" className={styles.btnAddTemplate} onClick={handleAddClick}>
          <span>+</span> Thêm mẫu pet mới
        </button>
      </div>

      <Toolbar
        statusList={statusList}
        sortList={sortList}
        sortType={sortType}
        bulkActions={bulkActions}
        selectedIds={selectedIds}
        searchPlaceholder="Tìm kiếm theo mã template, tên, loài, màu lông..."
        handleChangeStatus={handleChangeStatus}
        handleSearch={handleSearch}
        handleSortType={handleSortType}
        handleBulkActionSubmit={handleBulkActionSubmit}
      />

      {loading ? (
        <div className={styles.loadingBox}>Đang tải danh sách mẫu pet...</div>
      ) : error ? (
        <div className={styles.errorBox}>{error}</div>
      ) : (
        <PetTemplateTable
          petTemplates={petTemplates}
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

      <PetTemplateFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={dataInUpdateModal}
        onSuccess={fetchPetTemplates}
      />

      <PetTemplateDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        data={dataInDetailModal}
        onEditClick={handleUpdateClick}
      />
    </div>
  );
}

export default PetTemplateManagement;
