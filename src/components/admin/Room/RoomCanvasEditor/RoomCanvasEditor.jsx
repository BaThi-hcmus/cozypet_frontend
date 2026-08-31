import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './RoomCanvasEditor.module.css';
import api from '../../../../api/api';
import { toast } from 'react-toastify';

const CANVAS_SIZE = 1000;
const DISPLAY_SIZE = 600; // Khung to hơn item editor (600x600)
const SCALE_RATIO = DISPLAY_SIZE / CANVAS_SIZE;

const DEFAULT_TYPE_ORDER = ['furniture', 'decoration', 'food', 'toy'];

// Bộ đếm và đặt tên thông minh cho các slot
// chứa tấc cả các slot hiện tại trong component
// configuredOnly: chỉ lấy những slot đã được cấu hình hoàn tất
function buildSlotTypeLabels(slotList, { configuredOnly = true } = {}) {
  // Chỉ lấy ra những slot mà admin cấu hình xong (tức là bấm nút hoàn tất)
  const source = configuredOnly ? slotList.filter((s) => s.isConfigured) : slotList;
  // lưu tên hiển thị cuối cùng của từng slot
  const labels = {};
  // Lưu số thứ tự của riêng từng slot ID đó trong loại của nó.
  const typeIndexes = {};
  // Biến tạm dùng để đếm xem đến thời điểm hiện tại loại đó đã xuất hiện mấy lần.
  const typeCounts = {};

  // vòng lặp duyệt qua từng slot hợp lệ
  source.forEach((slot) => {
    // mỗi khi gặp 1 slot của loại nào thì bộ đếm của loại đó tăng lên 1
    typeCounts[slot.type] = (typeCounts[slot.type] || 0) + 1;
    // Lưu lại con số vừa đếm được gắn với ID của slot đó (dùng để sắp xếp thứ tự hiển thị ở cột bên phải sau này).
    typeIndexes[slot.id] = typeCounts[slot.type];
    labels[slot.id] = `${slot.type} (${typeCounts[slot.type]})`;
  });

  return { labels, typeIndexes };
}

// hàm sắp xếp trật tự cho danh sách các slot
// configuredSlots: mảng các slot đã được cấu hình hoàn chỉnh
// typeIndexes: Bảng chỉ mục số thứ tự của từng slot (lấy từ kết quả của hàm buildSlotTypeLabels ở trên).
// typeOrder: Thứ tự ưu tiên của các loại vật phẩm
function sortConfiguredSlotsForDisplay(configuredSlots, typeIndexes, typeOrder = DEFAULT_TYPE_ORDER) {
  return [...configuredSlots].sort((a, b) => {
    // xác định thứ tự ưu tiên của slot a và b
    const orderA = typeOrder.indexOf(a.type);
    const orderB = typeOrder.indexOf(b.type);
    // nếu loại không nằm trong danh sách ưu tiên thì bị đẩy xuống cuối
    const typeCmp = (orderA === -1 ? typeOrder.length : orderA)
      - (orderB === -1 ? typeOrder.length : orderB);
    if (typeCmp !== 0) return typeCmp;
    return (typeIndexes[a.id] || 0) - (typeIndexes[b.id] || 0);
  });
}

// isOpen: có mở modal hay không
// isClose: có đóng modal hay không
// imgSrc: url của background
// initialSlots: rỗng nếu thêm mới và chứa các slot đã được cấu hình từ trước nếu là update
function RoomCanvasEditor({ isOpen, onClose, imgSrc, initialSlots = [], onConfirm }) {
  // tham chiếu trực tiếp đến thẻ canvas
  const canvasRef = useRef(null);
  // lưu đối tượng File ảnh background
  const imageRef = useRef(null);
  // báo hiệu ảnh đã load xong chưa
  const [imageLoaded, setImageLoaded] = useState(false);

  // Phase 1 (Background): căn chỉnh ảnh nền
  // Tọa độ vị trí đặt góc trên bên trái của ảnh nền trên khung canvas.
  const [bgX, setBgX] = useState(0);
  const [bgY, setBgY] = useState(0);
  // Tỉ lệ phóng to/thu nhỏ của ảnh nền (mặc định là 1).
  const [bgZoom, setBgZoom] = useState(1);
  // Cờ kiểm tra xem Admin có đang ở trạng thái đang bấm giữ chuột trái để kéo ảnh nền hay không.
  const [isDraggingBg, setIsDraggingBg] = useState(false);

  // Trạng thái chuyển đổi phase
  // khi admin bấm khóa nền biến này đổi thành true, khi đó background sẽ được giữ cố định, không thể thay đổi
  const [isBackgroundLocked, setIsBackgroundLocked] = useState(false);

  // Phase 2 (Slots)
  // mảng chứa toàn bộ danh sách các ô slot
  const [slots, setSlots] = useState([]);
  // Lưu ID của ô slot mà Admin đang chọn (click vào).
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  // Cờ kiểm tra xem Admin có đang bấm giữ và kéo di chuyển một ô slot trên bản đồ phòng hay không.
  const [isDraggingSlot, setIsDraggingSlot] = useState(false);
  // Cờ quyết định có bật bảng nhập liệu (Sidebar form) ở cột bên phải để chỉnh sửa chi tiết slot hay không
  const [isSlotFormOpen, setIsSlotFormOpen] = useState(false);
  // Lưu bộ dữ liệu danh mục lấy từ Backend (ví dụ: các loại type, category hợp lệ).
  const [itemConstants, setItemConstants] = useState(null);

  // lưu tọa độ điểm xuất phát khi bắt đầu kéo chuột (kéo bg hoặc slot)
  const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0, targetId: null });
  // lưu lại 1 bản sao của slot trước khi admin bấm nút sửa, dùng để backup khi cần thiết
  const editSnapshotRef = useRef(null);

  // Load init data
  useEffect(() => {
    if (!isOpen) return;

    // Xử lý trường hợp Admin chọn chỉnh sửa một phòng đã được thiết lập từ trước
    if (initialSlots && initialSlots.length > 0) {
      setSlots(initialSlots.map((s) => ({ ...s, isConfigured: true })));
      setIsBackgroundLocked(true);  // không cho di chuyển background
    } else {
      setSlots([]);
      setIsBackgroundLocked(false);
    }
    setSelectedSlotId(null);
    setIsSlotFormOpen(false);
    editSnapshotRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // lấy dữ liệu các constant để hiển thị ở giao diện cấu hình slot
  useEffect(() => {
    if (!isOpen) return;

    const fetchItemConstants = async () => {
      try {
        const response = await api.get('/admin/items/constants');
        setItemConstants(response.data.data);
      } catch (error) {
        toast.error(
          error.response?.data?.message || 'Không tải được cấu hình slot từ server'
        );
      }
    };

    fetchItemConstants();
  }, [isOpen]);

  // chuẩn bị khung hình và căn chihr background
  useEffect(() => {
    if (!isOpen || !imgSrc) return;

    const img = new Image();
    // khi bg load xong thì chạy vào hàm này 
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);

      // lấy cạnh lớn nhất của img
      const maxDim = Math.max(img.naturalWidth, img.naturalHeight);
      const defaultZoom = maxDim > CANVAS_SIZE
        ? CANVAS_SIZE / maxDim
        : 1;

      // thiết lập hệ số zoom để img lọn vào khung canvas
      setBgZoom(defaultZoom);
      const scaledW = img.naturalWidth * defaultZoom;
      const scaledH = img.naturalHeight * defaultZoom;
      // đặt bg nằm mặc định ở chính giữa khung canvas
      setBgX((CANVAS_SIZE - scaledW) / 2);
      setBgY((CANVAS_SIZE - scaledH) / 2);
    };
    // xử lý cors nếu load ảnh từ link ngoài (cloudinary)
    img.crossOrigin = 'anonymous';
    img.src = imgSrc;

    // dọn dẹp khi admin đóng modal hoặc đổi bg khác
    return () => {
      imageRef.current = null;
      setImageLoaded(false);
    };
  }, [imgSrc, isOpen]);

  // vẽ background lên khung canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');  // dùng bút vẽ 2d của canvas
    if (!ctx) return;

    // Xóa nền trước khi vẽ
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Vẽ Background
    const scaledW = img.naturalWidth * bgZoom;
    const scaledH = img.naturalHeight * bgZoom;
    ctx.drawImage(img, bgX, bgY, scaledW, scaledH);

    // Vẽ guide line (Phase 1)
    // nếu nền chưa được khóa
    if (!isBackgroundLocked) {
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.3)';  // màu hồng nhạt, độ trong suốt
      ctx.lineWidth = 10;  // độ rộng đường
      ctx.setLineDash([12, 4]); // nét đứt
      ctx.strokeRect(1, 1, CANVAS_SIZE - 2, CANVAS_SIZE - 2); // kích thước khung
      ctx.setLineDash([]);
    }

    // Vẽ Slots (Phase 2)
    // nếu nền đã được khóa thì hệ thống sẽ vẽ các ô slot lên trên
    if (isBackgroundLocked) {
      // Sort theo zIndex để vẽ slot ở dưới trước, trên sau
      const sortedSlots = [...slots].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));

      sortedSlots.forEach((slot) => {
        // tính theo hệ số zoom
        const slotW = CANVAS_SIZE * (slot.scaleFactor || 1);
        const slotH = CANVAS_SIZE * (slot.scaleFactor || 1);

        // Màu sắc phân biệt theo type
        let color = 'rgba(59, 130, 246, 0.7)'; // Mặc định xanh dương
        if (slot.type === 'furniture') color = 'rgba(16, 185, 129, 0.7)'; // xanh lá
        if (slot.type === 'decoration') color = 'rgba(236, 72, 153, 0.7)'; // hồng
        if (slot.type === 'food') color = 'rgba(245, 158, 11, 0.7)'; // cam
        if (slot.type === 'toy') color = 'rgba(139, 92, 246, 0.7)'; // tím

        // kiểm tra slot có đang được chọn hay không
        const isSelected = slot.id === selectedSlotId;

        // Vẽ mảng mờ bên trong
        ctx.fillStyle = isSelected ? color.replace('0.7', '0.3') : color.replace('0.7', '0.1');
        ctx.fillRect(slot.x, slot.y, slotW, slotH);

        // Vẽ viền
        ctx.strokeStyle = color;
        ctx.lineWidth = isSelected ? 6 : 3;
        if (isSelected) {
          ctx.setLineDash([8, 4]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.strokeRect(slot.x, slot.y, slotW, slotH);
        ctx.setLineDash([]);

        // Vẽ tâm (điểm anchor nhỏ)
        // Vẽ một chấm tròn nhỏ màu trắng ở chính giữa ô slot
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(slot.x + slotW / 2, slot.y + slotH / 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Vẽ tên Type
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        const { labels: labelMap } = buildSlotTypeLabels(slots);
        const text = labelMap[slot.id] || (slot.isConfigured ? slot.type : `${slot.type} (mới)`);
        ctx.strokeText(text, slot.x + 10, slot.y + 30);
        ctx.fillText(text, slot.x + 10, slot.y + 30);
      });
    }
  }, [bgX, bgY, bgZoom, isBackgroundLocked, slots, selectedSlotId]);

  // gọi hàm vẽ khi ảnh đã load xong
  useEffect(() => {
    if (imageLoaded) {
      drawCanvas();
    }
  }, [imageLoaded, drawCanvas]);

  // ===== Drag Events =====
  // xử lý sự kiện đặt chuột xuống
  const handleMouseDown = (e) => {
    e.preventDefault();
    // lấy kích thước thực tế và vị trí hiển thị của thẻ canvas
    const rect = canvasRef.current.getBoundingClientRect();
    // Lấy tọa độ vị trí trỏ chuột thực tế tại thời điểm Admin nhấn chuột trái.
    const clickX = e.clientX;
    const clickY = e.clientY;

    // Tọa độ trên canvas 1000x1000
    // quy đổi từ tọa độ màn hình thành tọa độ trên khung canvas
    const canvasClickX = (clickX - rect.left) / SCALE_RATIO;
    const canvasClickY = (clickY - rect.top) / SCALE_RATIO;

    // nếu còn đang căng chỉnh bg
    if (!isBackgroundLocked) {
      // Phase 1: Kéo Background
      setIsDraggingBg(true);
      dragStartRef.current = {
        // lưu tọa độ đặt chuột xuống
        x: clickX,
        y: clickY,
        // lưu tọa độ ban đầu của bg
        startX: bgX,
        startY: bgY,
      };
    } else {
      // Phase 2: Click/Kéo Slot
      // Tìm xem click vào slot nào (ưu tiên zIndex cao hơn)
      let clickedSlot = null;
      const sortedSlotsDesc = [...slots].sort((a, b) => (b.zIndex || 1) - (a.zIndex || 1));

      for (const slot of sortedSlotsDesc) {
        // tính chiều cao và rộng thực tế của slot
        const slotW = CANVAS_SIZE * (slot.scaleFactor || 1);
        const slotH = CANVAS_SIZE * (slot.scaleFactor || 1);
        // kiểm tra tọa độ của cú click có nằm trong slot hay không
        if (
          canvasClickX >= slot.x &&
          canvasClickX <= slot.x + slotW &&
          canvasClickY >= slot.y &&
          canvasClickY <= slot.y + slotH
        ) {
          clickedSlot = slot;
          break;
        }
      }

      // khi admin bấm trúng 1 ô slot
      if (clickedSlot) {
        setSelectedSlotId(clickedSlot.id);
        // nếu đây là 1 slot đã được cấu hình trước và bảng nhập liệu bên phải đang đóng
        if (clickedSlot.isConfigured && !isSlotFormOpen) {
          // tạo 1 bản sao của slot
          editSnapshotRef.current = { ...clickedSlot };
          setIsSlotFormOpen(true);
        }
        // báo hiệu bắt đầu kéo thả slot
        setIsDraggingSlot(true);
        dragStartRef.current = {
          // tạo độ đặt chuột
          x: clickX,
          y: clickY,
          // tọa độ slot
          startX: clickedSlot.x,
          startY: clickedSlot.y,
          // id của slot đang được chọn
          targetId: clickedSlot.id,
        };
      } else {
        setSelectedSlotId(null); // click ra ngoài
      }
    }
  };

  // xử lý sự kiện kéo thả 
  const handleMouseMove = useCallback(
    (e) => {
      // lấy vị trí chuột hiện tại trừ đi vị trí chuột lúc bắt đầu 
      const dx = (e.clientX - dragStartRef.current.x) / SCALE_RATIO;
      const dy = (e.clientY - dragStartRef.current.y) / SCALE_RATIO;

      // nếu đang kéo bg và bg chưa bị khóa nền
      if (isDraggingBg && !isBackgroundLocked) {
        // cập nhật tọa độ mới
        setBgX(dragStartRef.current.startX + dx);
        setBgY(dragStartRef.current.startY + dy);
      } else if (isDraggingSlot && isBackgroundLocked && dragStartRef.current.targetId) {
        // nếu đang kéo slot, bg bi khóa và đúng id của slot đang bị kéo
        const targetId = dragStartRef.current.targetId;
        const newX = dragStartRef.current.startX + dx;
        const newY = dragStartRef.current.startY + dy;

        // cập nhật mảng danh sách của slot(cập nhất vị trí mới)
        setSlots((prev) =>
          prev.map((s) => (s.id === targetId ? { ...s, x: newX, y: newY } : s))
        );
      }
    },
    [isDraggingBg, isBackgroundLocked, isDraggingSlot]
  );

  // khi nhất chuột lên
  const handleMouseUp = useCallback(() => {
    setIsDraggingBg(false);
    setIsDraggingSlot(false);
  }, []);

  // lắng nghe sự kiện trên toàn cửa sổ trình duyệt (phòng trường hợp kéo thả ra bên ngoài thẻ canvas)
  useEffect(() => {
    if (isDraggingBg || isDraggingSlot) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingBg, isDraggingSlot, handleMouseMove, handleMouseUp]);

  // ===== Phase 1 Tools =====
  // điều khiển phóng to thu nhỏ bg
  const handleBgZoomChange = (e) => {
    const img = imageRef.current;
    if (!img) return;
    // lấy dữ liệu từ thanh zoom
    const newZoom = parseFloat(e.target.value);

    // tính toán kích thước bg trước và sau khi zoom
    const oldScaledW = img.naturalWidth * bgZoom;
    const oldScaledH = img.naturalHeight * bgZoom;
    const newScaledW = img.naturalWidth * newZoom;
    const newScaledH = img.naturalHeight * newZoom;

    // Xác định tọa độ tâm điểm hiện tại của bức ảnh trên khung canvas trước khi zoom:
    const centerX = bgX + oldScaledW / 2;
    const centerY = bgY + oldScaledH / 2;

    // Cập nhật lại tọa độ góc trái mới (bgX, bgY) dựa trên 
    // kích thước mới sao cho tâm của ảnh vẫn giữ nguyên vị trí cũ, 
    // không bị lệch đi đâu cả.
    setBgX(centerX - newScaledW / 2);
    setBgY(centerY - newScaledH / 2);
    setBgZoom(newZoom);
  };

  // ===== Phase 2 Tools =====
  // xử lý thêm slot
  const handleAddSlot = () => {
    if (!isBackgroundLocked) return;

    const newSlot = {
      id: `slot_${Date.now()}`,
      x: 250,
      y: 250,
      type: '',
      category: '',
      slotType: '',
      zIndex: slots.filter((s) => s.isConfigured).length + 1,
      scaleFactor: 0.5,
      isConfigured: false,
    };
    setSlots((prev) => {
      // loại bỏ các slot dang dở, chỉ lấy các slot đã được hoàn tất
      const withoutDraft = prev.filter((s) => s.isConfigured);
      return [...withoutDraft, newSlot];
    });
    setSelectedSlotId(newSlot.id);
    editSnapshotRef.current = null;
    setIsSlotFormOpen(true);
  };

  // xử lý cập nhật slot
  const handleEditSlot = (id) => {
    const slot = slots.find((s) => s.id === id);
    if (slot) {
      // tạo bản sao để backup khi cần thiết
      editSnapshotRef.current = { ...slot };
    }
    setSelectedSlotId(id);
    setIsSlotFormOpen(true);
  };

  // nút bấm hoàn tất ở cấu hình slot
  const handleCompleteSlot = () => {
    const slot = slots.find((s) => s.id === selectedSlotId);
    if (!slot?.type || !slot?.category || !slot?.slotType) {
      toast.warning('Vui lòng chọn đầy đủ Type, Category và Slot Type');
      return;
    }

    if (selectedSlotId) {
      setSlots((prev) =>
        prev.map((s) => (s.id === selectedSlotId ? { ...s, isConfigured: true } : s))
      );
    }
    editSnapshotRef.current = null;
    setIsSlotFormOpen(false);
    setSelectedSlotId(null);
  };

  // nút bấm huy ở cấu hình slot
  const handleCancelSlot = () => {
    if (!selectedSlotId) return;

    const slot = slots.find((s) => s.id === selectedSlotId);
    // nếu đây là slot mới tạo mà admin bấm hủy
    if (slot && !slot.isConfigured) {
      setSlots((prev) => prev.filter((s) => s.id !== selectedSlotId));
    } else if (editSnapshotRef.current) { // trường hợp đây là slot cũ đang sửa nhưng admin bấm hủy
      // khôi phục thông tin slot cũ
      setSlots((prev) =>
        prev.map((s) => (s.id === selectedSlotId ? { ...editSnapshotRef.current } : s))
      );
    }

    editSnapshotRef.current = null;
    setIsSlotFormOpen(false);
    setSelectedSlotId(null);
  };

  // nút delete slot
  const handleDeleteSlot = (id) => {
    // xóa slot ra khỏi danh sách
    setSlots((prev) => prev.filter((s) => s.id !== id));
    if (selectedSlotId === id) {
      setSelectedSlotId(null);
      setIsSlotFormOpen(false);
    }
  };

  // khi admin cập nhật 1 trường trong slot thì gọi hàm này
  const handleUpdateSelectedSlot = (field, value) => {
    if (!selectedSlotId) return;
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id !== selectedSlotId) return s;
        // khi thay đổi trường type thì tự động cập nhật category về rỗng
        if (field === 'type') {
          return { ...s, type: value, category: '' };
        }
        // cập nhật trường dữ liệu
        return { ...s, [field]: value };
      })
    );
  };

  // ===== Submit =====
  // lưu lại toàn bộ kết quả khi admin chỉnh xong bg và các slot
  const handleConfirm = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    // Xuất ảnh background đã crop 1000x1000 (không vẽ slot lên ảnh xuất ra!)
    // tạo thẻ canvas ảo
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_SIZE;
    exportCanvas.height = CANVAS_SIZE;
    const ctx = exportCanvas.getContext('2d');

    // xóa sạch trước khi vẽ
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    const scaledW = img.naturalWidth * bgZoom;
    const scaledH = img.naturalHeight * bgZoom;
    ctx.drawImage(img, bgX, bgY, scaledW, scaledH);

    exportCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], 'room_bg.png', { type: 'image/png' });
        const previewUrl = URL.createObjectURL(blob);

        const slotsToSave = slots
          .filter((s) => s.isConfigured)
          .map(({ isConfigured, ...rest }) => rest);
        onConfirm(file, previewUrl, slotsToSave);
        onClose();
      },
      'image/png'
    );
  };

  if (!isOpen) return null;

  // tìm kiếm xem có slot nào trùng id với slot đang được chọn không => dùng hiển thị thông tin ở cột bên phải
  const selectedSlot = slots.find((s) => s.id === selectedSlotId);
  // lọc ra danh sách các ô đã được cấu hình hoàn tất
  const configuredSlots = slots.filter((s) => s.isConfigured);
  // đếm và gán nhãn tên cho slot
  const { labels: slotDisplayNames, typeIndexes } = buildSlotTypeLabels(slots);
  // lấy order mặc định hoặc từ server gửi sang
  const typeOrder = itemConstants?.types?.map((t) => t.value) || DEFAULT_TYPE_ORDER;
  // sắp xếp các slot theo đúng thứ tự ưu tiên
  const sortedConfiguredSlots = sortConfiguredSlotsForDisplay(
    configuredSlots,
    typeIndexes,
    typeOrder
  );
  // lọc danh sách danh mục con
  const categoryOptions = selectedSlot?.type
    ? itemConstants?.categories?.[selectedSlot.type] || []
    : [];
  // các biến quyết định bố cục
  const sidePanelMode = isSlotFormOpen ? 'form' : configuredSlots.length > 0 ? 'list' : null;
  const hasTwoColumns = sidePanelMode !== null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h3>
            <span>🎨</span> Trình thiết kế Phòng (Room Editor)
          </h3>
          <div className={styles.headerControls}>
            {isBackgroundLocked && !isSlotFormOpen && (
              <button
                type="button"
                className={styles.btnAddSlotHeader}
                onClick={handleAddSlot}
              >
                + Thêm Slot
              </button>
            )}
            <button type="button" className={styles.btnClose} onClick={onClose}>×</button>
          </div>
        </div>

        <div className={`${styles.editorBody} ${hasTwoColumns ? styles.editorBodyTwoCol : styles.editorBodySingleCol}`}>
          {/* Cột 1: Canvas — 3/4 khi có cột phụ, căn giữa khi chỉ 1 cột */}
          <div className={styles.canvasCol}>
            <div className={styles.canvasColInner}>
              <div className={styles.canvasWrapperArea}>
                <div
                  className={styles.canvasWrapper}
                  onMouseDown={handleMouseDown}
                >
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_SIZE}
                    height={CANVAS_SIZE}
                  />
                </div>
              </div>

              {!isBackgroundLocked ? (
                <div className={styles.canvasToolsRow}>
                  <div className={styles.zoomControl}>
                    <label>🔍 Thu phóng Nền:</label>
                    <input
                      type="range"
                      min="0.1"
                      max="5"
                      step="0.01"
                      value={bgZoom}
                      onChange={handleBgZoomChange}
                    />
                    <span>{Math.round(bgZoom * 100)}%</span>
                  </div>
                  <p className={styles.bgHintText}>
                    Kéo thả để căn chỉnh nền, sau đó bấm &quot;Khóa nền&quot; để có thể thêm slot.
                  </p>
                  <button
                    type="button"
                    className={styles.btnLock}
                    onClick={() => setIsBackgroundLocked(true)}
                  >
                    🔒 Khóa nền
                  </button>
                </div>
              ) : (
                <div className={styles.canvasToolsRow}>
                  <div className={styles.lockStatus}>
                    ✅ Nền đã khóa. Kéo thả các hộp màu trên canvas để dịch chuyển slot.
                  </div>
                  {!isSlotFormOpen && (
                    <button
                      type="button"
                      className={styles.btnUnlock}
                      onClick={() => setIsBackgroundLocked(false)}
                    >
                      🔓 Mở khóa & Sửa nền
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Cột 2: Form cấu hình slot HOẶC danh sách slot (luân phiên, không hiện cùng lúc) */}
          {sidePanelMode === 'form' && selectedSlot && (
            <div className={styles.sideCol}>
              <div className={styles.slotFormHeader}>
                <h4>Cấu hình Slot</h4>
                <div className={styles.slotFormActions}>
                  <button
                    type="button"
                    className={styles.btnCancelSlot}
                    onClick={handleCancelSlot}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className={styles.btnCompleteSlot}
                    onClick={handleCompleteSlot}
                  >
                    Hoàn tất
                  </button>
                </div>
              </div>

              <div className={styles.slotDetailForm}>
                <div className={styles.formGroup}>
                  <label>Loại vật phẩm (Type) *</label>
                  <select
                    value={selectedSlot.type}
                    onChange={(e) => handleUpdateSelectedSlot('type', e.target.value)}
                    required
                    disabled={!itemConstants}
                  >
                    <option value="">-- Chọn loại --</option>
                    {itemConstants?.types?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} ({opt.value})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Danh mục chi tiết (Category) *</label>
                  <select
                    value={selectedSlot.category}
                    onChange={(e) => handleUpdateSelectedSlot('category', e.target.value)}
                    required
                    disabled={!selectedSlot.type || !itemConstants}
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {selectedSlot.category
                      && !categoryOptions.some((opt) => opt.value === selectedSlot.category) && (
                      <option value={selectedSlot.category}>{selectedSlot.category}</option>
                    )}
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Vị trí trong phòng (Slot Type) *</label>
                  <select
                    value={selectedSlot.slotType}
                    onChange={(e) => handleUpdateSelectedSlot('slotType', e.target.value)}
                    required
                    disabled={!itemConstants}
                  >
                    <option value="">-- Chọn vị trí --</option>
                    {itemConstants?.slotTypes?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} ({opt.value})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Hệ số thu phóng (Scale)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="3"
                      value={selectedSlot.scaleFactor}
                      onChange={(e) => handleUpdateSelectedSlot('scaleFactor', Number(e.target.value))}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Thứ tự lớp (zIndex)</label>
                    <input
                      type="number"
                      step="1"
                      value={selectedSlot.zIndex}
                      onChange={(e) => handleUpdateSelectedSlot('zIndex', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Tọa độ X</label>
                    <input
                      type="number"
                      value={Math.round(selectedSlot.x)}
                      onChange={(e) => handleUpdateSelectedSlot('x', Number(e.target.value))}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Tọa độ Y</label>
                    <input
                      type="number"
                      value={Math.round(selectedSlot.y)}
                      onChange={(e) => handleUpdateSelectedSlot('y', Number(e.target.value))}
                    />
                  </div>
                </div>
                <p className={styles.hintText}>* Mẹo: Có thể dùng chuột kéo thả khối màu trên Canvas thay vì nhập tay tọa độ.</p>
              </div>
            </div>
          )}

          {sidePanelMode === 'list' && (
            <div className={styles.sideCol}>
              <div className={styles.slotsHeader}>
                <h4>Slots đã cấu hình ({configuredSlots.length})</h4>
              </div>

              <div className={styles.slotsList}>
                {sortedConfiguredSlots.map((s) => (
                  <div
                    key={s.id}
                    className={styles.slotItem}
                    onClick={() => handleEditSlot(s.id)}
                  >
                    <div className={styles.slotItemInfo}>
                      <strong>{slotDisplayNames[s.id]}</strong>
                      <span>z: {s.zIndex} | scale: {s.scaleFactor}</span>
                      {s.category && <span className={styles.slotCategory}>{s.category}</span>}
                    </div>
                    <button
                      type="button"
                      className={styles.btnDelSlotMin}
                      onClick={(e) => { e.stopPropagation(); handleDeleteSlot(s.id); }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.editorFooter}>
          <button type="button" className={styles.btnCancelMain} onClick={onClose}>Hủy</button>
          <button
            type="button"
            className={styles.btnConfirmMain}
            onClick={handleConfirm}
            disabled={!isBackgroundLocked}
          >
            Lưu Nền & Slots
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoomCanvasEditor;
