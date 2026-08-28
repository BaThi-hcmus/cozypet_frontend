import React from 'react';
import styles from './Toolbar.module.css';

function Toolbar({ statusList, sortList, sortType, handleChangeStatus, handleSearch, handleSortType }) {
  return (
    <div className={styles.toolbar}>
      {/* Danh sách lọc trạng thái */}
      <div className={styles.statusFilterGroup}>
        {statusList?.map((item, index) => (
          <button
            key={index}
            type="button"
            className={`${styles.filterBtn} ${item.class}`}
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
          placeholder="Tìm kiếm theo tên, email, số điện..."
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
    </div>
  );
}

export default Toolbar;