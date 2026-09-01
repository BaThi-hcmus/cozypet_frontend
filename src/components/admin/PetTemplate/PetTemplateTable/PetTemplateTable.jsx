import React from 'react';
import styles from './PetTemplateTable.module.css';
import { FaEye, FaRegEdit, FaTrashAlt } from 'react-icons/fa';

const speciesLabels = {
  dog: { label: 'Chó', style: styles.speciesDog },
  cat: { label: 'Mèo', style: styles.speciesCat },
};

function PetTemplateTable({
  petTemplates,
  page,
  paginationObj,
  selectedIds,
  isCheckAll,
  handlePage,
  handleToggleStatus,
  handleDetailClick,
  handleUpdateClick,
  handleDeleteClick,
  handleCheckAllClick,
  handleCheckBoxClick,
}) {
  const formatTraitSummary = (item) => {
    const parts = [item.primaryColor, item.coatPattern, item.coatLength].filter(Boolean);
    return parts.join(' · ') || '—';
  };

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={isCheckAll}
                  onChange={handleCheckAllClick}
                  className="cursor-pointer"
                />
              </th>
              <th>Avatar</th>
              <th>Mã template</th>
              <th>Tên mẫu</th>
              <th>Loài</th>
              <th>Đặc điểm (AI)</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {petTemplates && petTemplates.length > 0 ? (
              petTemplates.map((item) => {
                const isChecked = selectedIds.includes(item._id);
                const speciesObj = speciesLabels[item.species] || {
                  label: item.species,
                  style: styles.speciesBadge,
                };

                return (
                  <tr key={item._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCheckBoxClick(item._id)}
                        className="cursor-pointer"
                      />
                    </td>
                    <td>
                      <img
                        src={item.avatar || 'https://via.placeholder.com/60?text=Pet'}
                        alt={item.name}
                        className={styles.avatarThumb}
                      />
                    </td>
                    <td className={styles.codeText}>{item.templateId}</td>
                    <td className={styles.nameText}>{item.name}</td>
                    <td>
                      <span className={`${styles.speciesBadge} ${speciesObj.style}`}>
                        {speciesObj.label}
                      </span>
                    </td>
                    <td>
                      <span className={styles.traitSummary} title={formatTraitSummary(item)}>
                        {formatTraitSummary(item)}
                      </span>
                    </td>
                    <td>
                      {item.status === 'active' ? (
                        <span
                          className={styles.statusActive}
                          onClick={() => handleToggleStatus(item._id, 'active')}
                          title="Bấm để đổi sang Dừng hoạt động"
                        >
                          Hoạt động
                        </span>
                      ) : (
                        <span
                          className={styles.statusInactive}
                          onClick={() => handleToggleStatus(item._id, 'inactive')}
                          title="Bấm để đổi sang Hoạt động"
                        >
                          Dừng hoạt động
                        </span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          type="button"
                          className={styles.btnDetail}
                          onClick={() => handleDetailClick(item)}
                          title="Xem chi tiết"
                        >
                          <FaEye />
                        </button>
                        <button
                          type="button"
                          className={styles.btnEdit}
                          onClick={() => handleUpdateClick(item)}
                          title="Chỉnh sửa"
                        >
                          <FaRegEdit />
                        </button>
                        <button
                          type="button"
                          className={styles.btnDelete}
                          onClick={() => handleDeleteClick(item._id)}
                          title="Xóa mẫu pet"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  Chưa có mẫu pet nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {paginationObj && paginationObj.totalPage >= 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            onClick={() => page > 1 && handlePage(page - 1)}
            disabled={page <= 1}
          >
            &lt;
          </button>

          {[...Array(paginationObj?.totalPage || 0).keys()].map((index) => {
            const pageNumber = index + 1;
            return (
              <button
                key={pageNumber}
                type="button"
                onClick={() => handlePage(pageNumber)}
                className={page === pageNumber ? styles.active : ''}
              >
                {pageNumber}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => page < (paginationObj?.totalPage || 1) && handlePage(page + 1)}
            disabled={page >= (paginationObj?.totalPage || 1)}
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
}

export default PetTemplateTable;
