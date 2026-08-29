import React from 'react';
import styles from './ItemTable.module.css';
import { FaEye, FaRegEdit, FaTrashAlt } from 'react-icons/fa';

function ItemTable({
  items,
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
  const typeLabels = {
    furniture: { label: 'Nội thất', style: styles.typeFurniture },
    decoration: { label: 'Trang trí', style: styles.typeDecoration },
    food: { label: 'Thức ăn', style: styles.typeFood },
    toy: { label: 'Đồ chơi', style: styles.typeToy },
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0);
  };

  return (
    <div className={styles.itemTableContainer}>
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
              <th>Hình ảnh</th>
              <th>Tên vật phẩm</th>
              <th>Loại</th>
              <th>Giá bán</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items && items.length > 0 ? (
              items.map((item) => {
                const isChecked = selectedIds.includes(item._id);
                const typeObj = typeLabels[item.type] || {
                  label: item.type,
                  style: styles.typeBadge,
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
                        src={item.image || 'https://via.placeholder.com/60?text=Pet'}
                        alt={item.name}
                        className={styles.itemImgThumb}
                      />
                    </td>
                    <td className={styles.itemNameText}>{item.name}</td>
                    <td>
                      <span className={`${styles.typeBadge} ${typeObj.style}`}>
                        {typeObj.label}
                      </span>
                    </td>
                    <td className={styles.priceText}>{formatPrice(item.price)}</td>
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
                          title="Xóa vật phẩm"
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
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  Chưa có vật phẩm nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      {paginationObj && paginationObj.totalPage > 1 && (
        <div className={styles.paginationContainer}>
          <span className={styles.paginationInfo}>
            Hiển thị trang {paginationObj.currentPage} / {paginationObj.totalPage} ({paginationObj.totalCount} vật phẩm)
          </span>
          <ul className={styles.paginationList}>
            {Array.from({ length: paginationObj.totalPage }, (_, i) => i + 1).map((pageNum) => (
              <li
                key={pageNum}
                className={`${styles.pageItem} ${pageNum === paginationObj.currentPage ? styles.pageItemActive : ''}`}
                onClick={() => handlePage(pageNum)}
              >
                {pageNum}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ItemTable;
