import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';

export function useImageCrop(initialImage = '') {
  // Dùng preview hình ảnh upload
  const [previewUrl, setPreviewUrl] = useState(initialImage);
  // File được gửi lên server
  const [imageFile, setImageFile] = useState(null);

  // lưu đường dẫn tạm thời của bức ảnh gốc, bức ảnh này được truyền sang ImageCropModal để cắt ảnh
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // Cấu hình react-dropzone
  const dropzone = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize: 5 * 1024 * 1024, // 5MB
    // sau khi chọn xong file, thì chạy vào onDrop
    // acceptFiles là 1 mảng chứa các file hợp lệ 
    // rejectedFiles là 1 mảng chứa các file bị từ chối
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        toast.error('File ảnh không hợp lệ hoặc vượt quá dung lượng 5MB!');
        return;
      }
      // lấy ra file hợp lệ đầu tiên vì avatar chỉ cho chọn 1 ảnh
      const file = acceptedFiles[0];
      if (file) {
        // Tạo URL tạm thời để đưa vào màn hình Crop
        // Hàm này tạo ra 1 đối tượng File thô và 1 url ảo
        const imageUrl = URL.createObjectURL(file);
        // Lưu đường dẫn ảo trên vào rawImageSrc để hiển thị lên modal cắt ảnh
        setRawImageSrc(imageUrl);
        // Bật modal lên
        setIsCropModalOpen(true);
      }
    },
  });

  // Nhận lại file đã cắt xong từ ImageCropModal
  // croppedFile là 1 đối tượng kiểu File, sẽ được gửi qua server
  // croppedPreviewUrl là 1 chuỗi url đại diện cho bức ảnh vừa được cắt
  const handleCropComplete = (croppedFile, croppedPreviewUrl) => {
    setPreviewUrl(croppedPreviewUrl); // Dùng để hiển thị preview
    setImageFile(croppedFile);        // File thực tế để gửi lên API
  };

  // Hàm reset lại trạng thái (dùng khi reset form hoặc đóng modal)
  const resetImage = (newImage = '') => {
    setPreviewUrl(newImage);
    setImageFile(null);
    setRawImageSrc(null);
    setIsCropModalOpen(false);
  };

  return {
    previewUrl,          // Link hiển thị ảnh (ảnh cũ hoặc ảnh mới preview)
    imageFile,           // File thực tế gửi lên server
    rawImageSrc,         // Link tạm truyền vào modal crop
    isCropModalOpen,     // Trạng thái đóng/mở modal crop
    setIsCropModalOpen,  // Hàm đóng/mở modal trực tiếp nếu cần
    dropzone,            // Gói chứa getRootProps và getInputProps của dropzone
    handleCropComplete,  // Hàm callback truyền vào ImageCropModal
    resetImage,          // Hàm reset ảnh
  };
}