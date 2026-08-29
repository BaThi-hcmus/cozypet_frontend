import React from 'react';
import styles from './AccountTable.module.css';
import { FaEye, FaRegEdit, FaTrashAlt } from 'react-icons/fa';

function AccountTable({
  accounts,
  page,
  paginationObj,
  selectedIds,
  isCheckAll,
  handlePage,
  handleToggleStatus,
  handleUpdateClick,
  handleDetailClick,
  handleDeleteClick,
  handleCheckAllClick,
  handleCheckBoxClick
}) {
  return (
    <div className={styles.accountTableContainer}>
      <table>
        <thead>
          <tr>
            <th>
              <input
                checked={isCheckAll}
                onChange={handleCheckAllClick}
                type="checkbox"
                className="cursor-pointer"
              />
            </th>
            <th>Avatar</th>
            <th>Họ và tên</th>
            <th>Email</th>
            <th>Số điện thoại</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {accounts?.map((account) => {
            const isChecked = selectedIds.includes(account._id);
            return (
              <tr key={account._id || account.id}>
                <td>
                  <input
                    checked={isChecked}
                    onChange={() => handleCheckBoxClick(account._id)}
                    type="checkbox"
                    className="cursor-pointer"
                  />
                </td>
                <td>
                  <img
                    src={account.avatar || 'https://via.placeholder.com/40'}
                    alt="Avatar"
                    className={styles.avatarImg}
                  />
                </td>
                <td className={styles.fontMedium}>{account.fullName}</td>
                <td>{account.email}</td>
                <td>{account.phoneNumber || '---'}</td>
                <td>
                  <span className={`${styles.roleBadge} ${account.role === 'admin' ? styles.admin : styles.staff}`}>
                    {account.role === 'admin' ? 'Admin' : 'Staff'}
                  </span>
                </td>
                <td>
                  {account.status === 'active' ? (
                    <span className={styles.statusActive} onClick={() => handleToggleStatus(account._id, 'active')}>
                      Hoạt động
                    </span>
                  ) : (
                    <span className={styles.statusInactive} onClick={() => handleToggleStatus(account._id, 'inactive')}>
                      Dừng hoạt động
                    </span>
                  )}
                </td>
                <td>
                  {/* Thay thế chữ bằng các nút icon kèm title hướng dẫn */}
                  <div className={styles.actionButtons}>
                    <button
                      type="button"
                      className={styles.btnDetail}
                      onClick={() => handleDetailClick(account)}
                      title="Xem chi tiết"
                    >
                      <FaEye />
                    </button>
                    <button
                      type="button"
                      className={styles.btnEdit}
                      onClick={() => handleUpdateClick(account)}
                      title="Chỉnh sửa"
                    >
                      <FaRegEdit />
                    </button>
                    <button
                      type="button"
                      className={styles.btnDelete}
                      onClick={() => handleDeleteClick(account._id)}
                      title="Xóa tài khoản"
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Phân trang dạng số và mũi tên */}
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
    </div>
  );
}

export default AccountTable;