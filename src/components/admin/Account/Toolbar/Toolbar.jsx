import React, { useState } from 'react';
import styles from './Toolbar.module.css';

function Toolbar({
  statusList,
  sortList,
  sortType,
  bulkActions,
  selectedIds,
  searchPlaceholder = 'Tìm kiếm...',
  handleChangeStatus,
  handleSearch,
  handleSortType,
  handleBulkActionSubmit,
}) {
  const [valueAction, setValueAction] = useState('');

  return (
    <div className={styles.toolbar}>
      {/* Danh sách lọc trạng thái */}
      <div className={styles.statusFilterGroup}>
        {statusList?.map((item, index) => (
          <button
            key={index}
            type="button"
            className={item.class === 'active' ? `${styles.active} active` : ''}
            onClick={() => handleChangeStatus(item.status)}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* Tìm kiếm */}
      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder={searchPlaceholder}
          onChange={handleSearch}
        />
      </div>

      {/* Sắp xếp */}
      <div className={styles.sortBox}>
        <select
          value={sortType}
          onChange={(e) => handleSortType(e.target.value)}
        >
          {sortList?.map((item, index) => (
            <option key={index} value={item.type}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {/* Bulk Actions */}
      <div className={styles.bulkActionBox}>
        <select
          value={valueAction ? JSON.stringify(valueAction) : ''}
          onChange={(e) => {
            const val = e.target.value;
            setValueAction(val ? JSON.parse(val) : '');
          }}
          disabled={selectedIds.length === 0}
        >
          <option value="">-- Chọn hành động --</option>
          {bulkActions?.map((item, index) => (
            <option
              key={index}
              value={JSON.stringify(item.value)}
            >
              {item.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          className={styles.bulkBtn}
          disabled={!valueAction || selectedIds.length === 0}
          onClick={() => {
            if (valueAction) {
              handleBulkActionSubmit(selectedIds, valueAction.type, valueAction.payload);
            }
          }}
        >
          Áp dụng
        </button>
      </div>
    </div>
  );
}

export default Toolbar;