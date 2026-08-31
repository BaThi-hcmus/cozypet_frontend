import React from 'react';
import styles from './RoomTable.module.css';
import { FaEye, FaRegEdit, FaTrashAlt } from 'react-icons/fa';

function RoomTable({
  rooms,
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
              <th>Ảnh nền</th>
              <th>Mã phòng</th>
              <th>Tên phòng</th>
              <th>Số lượng Slot</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rooms && rooms.length > 0 ? (
              rooms.map((room) => {
                const isChecked = selectedIds.includes(room._id);

                return (
                  <tr key={room._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCheckBoxClick(room._id)}
                        className="cursor-pointer"
                      />
                    </td>
                    <td>
                      <img
                        src={room.backgroundUrl || room.background_url || 'https://via.placeholder.com/60?text=Room'}
                        alt={room.name}
                        className={styles.imgThumb}
                      />
                    </td>
                    <td className={styles.codeText}>{room.code}</td>
                    <td className={styles.nameText}>{room.name}</td>
                    <td>
                      <span className={styles.slotCount}>
                        {room.slots?.length || 0} slots
                      </span>
                    </td>
                    <td>
                      {room.status === 'active' ? (
                        <span
                          className={styles.statusActive}
                          onClick={() => handleToggleStatus(room._id, 'active')}
                          title="Bấm để đổi sang Dừng hoạt động"
                        >
                          Hoạt động
                        </span>
                      ) : (
                        <span
                          className={styles.statusInactive}
                          onClick={() => handleToggleStatus(room._id, 'inactive')}
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
                          onClick={() => handleDetailClick(room)}
                          title="Xem chi tiết"
                        >
                          <FaEye />
                        </button>
                        <button
                          type="button"
                          className={styles.btnEdit}
                          onClick={() => handleUpdateClick(room)}
                          title="Chỉnh sửa"
                        >
                          <FaRegEdit />
                        </button>
                        <button
                          type="button"
                          className={styles.btnDelete}
                          onClick={() => handleDeleteClick(room._id)}
                          title="Xóa phòng"
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
                  Chưa có phòng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang dạng số và mũi tên */}
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

export default RoomTable;
