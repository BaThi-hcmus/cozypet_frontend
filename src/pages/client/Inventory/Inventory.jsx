import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import api, { clientApi } from '../../../api/api';
import { PetAvatarRig } from '../../../components/client/Pet/PetAvatarRig';
import styles from './Inventory.module.css';

const TAB_PETS = 'pets';
const TAB_ITEMS = 'items';
const TAB_ROOMS = 'rooms';

function toId(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value._id) return String(value._id);
  return String(value);
}

const TYPE_LABELS = {
  furniture: 'Nội thất',
  decoration: 'Trang trí',
  food: 'Thức ăn',
  toy: 'Đồ chơi',
};

export default function Inventory() {
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(TAB_PETS);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchContext = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/me');
      setPayload(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải kho đồ');
      console.error('Inventory fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  const petTemplateById = useMemo(() => {
    const map = new Map();
    if (!payload?.petTemplates) return map;
    payload.petTemplates.forEach((tpl) => {
      map.set(toId(tpl._id), tpl);
      if (tpl.templateId) map.set(String(tpl.templateId), tpl);
    });
    return map;
  }, [payload]);

  const itemById = useMemo(() => {
    const map = new Map();
    if (!payload?.items) return map;
    payload.items.forEach((item) => map.set(toId(item._id), item));
    return map;
  }, [payload]);

  const roomById = useMemo(() => {
    const map = new Map();
    if (!payload?.rooms) return map;
    payload.rooms.forEach((room) => map.set(toId(room._id), room));
    return map;
  }, [payload]);

  const userItemsWithDetails = useMemo(() => {
    if (!payload?.userItems) return [];
    return payload.userItems
      .filter((ui) => ui && ui.quantity && ui.quantity >= 1)
      .map((userItem) => {
        const itemId = toId(userItem.itemId) || toId(userItem._id);
        const item = itemById.get(itemId) || null;
        return { userItem, item, quantity: userItem.quantity || 0 };
      })
      .filter((entry) => entry.item && !entry.item.deleted && entry.item.status !== 'inactive');
  }, [payload, itemById]);

  const userRoomsWithDetails = useMemo(() => {
    if (!payload?.userRooms) return [];
    return payload.userRooms.map((userRoom) => {
      const roomId = toId(userRoom.roomId);
      const room = roomById.get(roomId) || null;
      return { userRoom, room };
    });
  }, [payload, roomById]);

  const stats = useMemo(() => {
    return {
      pets: (payload?.pets || []).length,
      items: userItemsWithDetails.length,
      rooms: userRoomsWithDetails.filter((e) => e.room).length,
    };
  }, [payload, userItemsWithDetails, userRoomsWithDetails]);

  const handleSetCurrentPet = useCallback(async (pet) => {
    if (actionLoading || pet.isCurrent) return;
    const petId = toId(pet._id);
    setActionLoading(`pet-${petId}`);
    try {
      await clientApi.setCurrentPet(petId);
      toast.success(`Đã chọn "${pet.name || pet.petTemplateId}" làm pet hiện tại`);
      await fetchContext();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể đổi pet';
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  }, [actionLoading, fetchContext]);

  const handleSetCurrentRoom = useCallback(async (userRoom) => {
    if (actionLoading || userRoom.isCurrent) return;
    const urId = toId(userRoom._id);
    setActionLoading(`room-${urId}`);
    try {
      await clientApi.setCurrentRoom(urId);
      toast.success('Đã đổi phòng hiện tại');
      await fetchContext();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể đổi phòng';
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  }, [actionLoading, fetchContext]);

  const handleGoToRoom = useCallback(() => {
    navigate('/room');
  }, [navigate]);

  if (loading) {
    return (
      <div className={styles.stateScreen}>
        <span className={`material-symbols-outlined ${styles.stateIcon}`}>inventory_2</span>
        <p>Đang tải kho đồ của bạn...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.stateScreen}>
        <span className={`material-symbols-outlined ${styles.stateIcon}`}>error</span>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.inventoryPage}>
      <div className={styles.inventoryContainer}>
        <header className={styles.pageHeader}>
          <div className={styles.pageTitleWrap}>
            <div className={styles.pageIcon}>
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
            <div>
              <h1 className={styles.pageTitle}>Kho đồ của bạn</h1>
              <p className={styles.pageSubtitle}>
                Quản lý tất cả Pet, Vật phẩm và Phòng bạn đang sở hữu
              </p>
            </div>
          </div>
          <div className={styles.statsRow}>
            <div className={`${styles.statCard} ${styles.statPets}`}>
              <span className="material-symbols-outlined">pets</span>
              {stats.pets} Pet
            </div>
            <div className={`${styles.statCard} ${styles.statItems}`}>
              <span className="material-symbols-outlined">category</span>
              {stats.items} Vật phẩm
            </div>
            <div className={`${styles.statCard} ${styles.statRooms}`}>
              <span className="material-symbols-outlined">cottage</span>
              {stats.rooms} Phòng
            </div>
          </div>
        </header>

        <div className={styles.tabsContainer}>
          <div className={styles.tabsHeader}>
            <button
              className={`${styles.tabBtn} ${activeTab === TAB_PETS ? styles.active : ''}`}
              onClick={() => setActiveTab(TAB_PETS)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                pets
              </span>
              Pet của bạn
              <span className={styles.tabCount}>{stats.pets}</span>
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === TAB_ITEMS ? styles.active : ''}`}
              onClick={() => setActiveTab(TAB_ITEMS)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                category
              </span>
              Vật phẩm
              <span className={styles.tabCount}>{stats.items}</span>
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === TAB_ROOMS ? styles.active : ''}`}
              onClick={() => setActiveTab(TAB_ROOMS)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                cottage
              </span>
              Phòng
              <span className={styles.tabCount}>{stats.rooms}</span>
            </button>
          </div>

          <div className={styles.tabsContent}>
            {activeTab === TAB_PETS && (
              <PetsTab
                pets={payload?.pets || []}
                petTemplateById={petTemplateById}
                actionLoading={actionLoading}
                onSetCurrent={handleSetCurrentPet}
              />
            )}
            {activeTab === TAB_ITEMS && (
              <ItemsTab entries={userItemsWithDetails} />
            )}
            {activeTab === TAB_ROOMS && (
              <RoomsTab
                entries={userRoomsWithDetails}
                actionLoading={actionLoading}
                onSetCurrent={handleSetCurrentRoom}
                onGoToRoom={handleGoToRoom}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============== Sub Tab Components =============== */

function PetsTab({ pets, petTemplateById, actionLoading, onSetCurrent }) {
  if (!pets || pets.length === 0) {
    return (
      <div className={styles.emptyTabState}>
        <span className="material-symbols-outlined">pets</span>
        <p>
          <strong>Bạn chưa có pet nào</strong>
          <br />
          Quay về trang chủ để triệu hồi pet đầu tiên cho mình nhé!
        </p>
      </div>
    );
  }

  return (
    <div className={styles.petsGrid}>
      {pets.map((pet) => {
        const petId = toId(pet._id);
        const tpl = petTemplateById.get(String(pet.petTemplateId)) || null;
        const layers = tpl?.layers;
        const species = tpl?.species || pet.petTemplateId;
        const hasLayers = layers && Object.keys(layers).length > 0;
        const isLoadingThis = actionLoading === `pet-${petId}`;
        return (
          <div
            key={petId}
            className={`${styles.petCard} ${pet.isCurrent ? styles.isCurrent : ''}`}
          >
            {pet.isCurrent && (
              <span className={styles.currentBadge}>
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                  check_circle
                </span>
                Pet hiện tại
              </span>
            )}
            <div className={styles.petAvatarWrap}>
              <div className={styles.petAvatarFrame}>
                {hasLayers ? (
                  <PetAvatarRig
                    type={species}
                    layers={layers}
                    globalZoom={(Number(tpl?.globalZoom) || 1) * 0.9}
                    globalOffset={tpl?.globalOffset || { x: 0, y: 0 }}
                    name={pet.name || tpl?.name}
                    compact
                    showInfo={false}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#a78bfa' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 48 }}>image_not_supported</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Chưa có bộ phận</span>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.petInfo}>
              <h3 className={styles.petName}>{pet.name || tpl?.name || 'Bạn nhỏ'}</h3>
              <div className={styles.petMeta}>
                <span
                  className={`${styles.petBadge} ${
                    species === 'cat' ? styles.speciesCat : styles.speciesDog
                  }`}
                >
                  {species === 'cat' ? 'Mèo' : species === 'dog' ? 'Chó' : 'Pet'}
                </span>
                <span className={`${styles.petBadge} ${styles.levelBadge}`}>
                  Lv. {pet.level || 1}
                </span>
                {tpl && (
                  <span className={`${styles.petBadge} ${styles.templateBadge}`}>
                    {tpl.name}
                  </span>
                )}
              </div>
              <div className={styles.petActions}>
                {pet.isCurrent ? (
                  <button className={styles.btnSecondary} disabled>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      check
                    </span>
                    Đang là pet hiện tại
                  </button>
                ) : (
                  <button
                    className={styles.btnPrimary}
                    disabled={!!isLoadingThis}
                    onClick={() => onSetCurrent(pet)}
                  >
                    {isLoadingThis ? (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          progress_activity
                        </span>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          favorite
                        </span>
                        Chọn làm pet hiện tại
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ItemsTab({ entries }) {
  if (!entries || entries.length === 0) {
    return (
      <div className={styles.emptyTabState}>
        <span className="material-symbols-outlined">category</span>
        <p>
          <strong>Kho đồ trống</strong>
          <br />
          Bạn chưa có vật phẩm nào. Hãy khám phá shop để sưu tầm đồ mới nhé!
        </p>
      </div>
    );
  }

  return (
    <div className={styles.itemsGrid}>
      {entries.map(({ userItem, item, quantity }) => {
        const keyId = toId(userItem._id) + '-' + toId(item._id);
        return (
          <div key={keyId} className={styles.itemCard}>
            <div className={styles.itemImageWrap}>
              <span className={styles.quantityBadge}>×{quantity}</span>
              <img
                src={item.image || item.image_url}
                alt={item.name}
                className={styles.itemImage}
                draggable={false}
              />
            </div>
            <div className={styles.itemInfo}>
              <h4 className={styles.itemName}>{item.name}</h4>
              <div className={styles.itemMeta}>
                {item.type && (
                  <span className={`${styles.metaBadge} ${styles.metaType}`}>
                    {TYPE_LABELS[item.type] || item.type}
                  </span>
                )}
                {item.category && (
                  <span className={`${styles.metaBadge} ${styles.metaCategory}`}>
                    {item.category}
                  </span>
                )}
                {item.roomCode ? (
                  <span className={`${styles.metaBadge} ${styles.metaRoom}`}>
                    {item.roomCode}
                  </span>
                ) : (
                  <span className={`${styles.metaBadge} ${styles.metaRoomGlobal}`}>
                    Toàn cục
                  </span>
                )}
              </div>
              {item.price && item.price > 0 && (
                <div className={styles.itemPrice}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    paid
                  </span>
                  {item.price.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RoomsTab({ entries, actionLoading, onSetCurrent, onGoToRoom }) {
  const valid = entries.filter((e) => e.room);
  if (valid.length === 0) {
    return (
      <div className={styles.emptyTabState}>
        <span className="material-symbols-outlined">cottage</span>
        <p>
          <strong>Bạn chưa sở hữu phòng nào</strong>
          <br />
          Phòng mặc định sẽ được cấp khi bạn đăng ký tài khoản.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.roomsGrid}>
      {valid.map(({ userRoom, room }) => {
        const urId = toId(userRoom._id);
        const isLoadingThis = actionLoading === `room-${urId}`;
        return (
          <div
            key={urId}
            className={`${styles.roomCard} ${userRoom.isCurrent ? styles.isCurrent : ''}`}
          >
            <div className={styles.roomImageWrap}>
              {userRoom.isCurrent && (
                <span className={styles.roomCurrentOverlay}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                    check_circle
                  </span>
                  Phòng hiện tại
                </span>
              )}
              <img
                src={room.background_url}
                alt={room.name}
                className={styles.roomBg}
                draggable={false}
              />
            </div>
            <div className={styles.roomInfo}>
              <h3 className={styles.roomName}>{room.name}</h3>
              {room.description && (
                <p className={styles.roomDescription}>{room.description}</p>
              )}
              <div className={styles.roomMeta}>
                {room.code && (
                  <span className={styles.roomBadge}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                      apartment
                    </span>
                    {room.code}
                  </span>
                )}
                {room.isDefault && (
                  <span className={styles.roomBadge}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                      star
                    </span>
                    Mặc định
                  </span>
                )}
              </div>
              <div className={styles.roomActions}>
                {userRoom.isCurrent ? (
                  <button className={styles.btnPrimary} onClick={onGoToRoom}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      open_in_new
                    </span>
                    Vào phòng ngay
                  </button>
                ) : (
                  <button
                    className={styles.btnPrimary}
                    disabled={!!isLoadingThis}
                    onClick={() => onSetCurrent(userRoom)}
                  >
                    {isLoadingThis ? (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          progress_activity
                        </span>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          home
                        </span>
                        Sử dụng phòng này
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
