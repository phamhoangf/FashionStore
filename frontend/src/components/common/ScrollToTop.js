import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component này sẽ cuộn trang về đầu mỗi khi đường dẫn thay đổi
 * Được sử dụng để giải quyết vấn đề khi chuyển trang, vị trí cuộn không reset
 */
const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Khi đường dẫn (pathname) hoặc tham số truy vấn (search) thay đổi
    // Cuộn cửa sổ về vị trí đầu trang (0, 0)
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Có thể dùng 'smooth' nếu muốn hiệu ứng cuộn mượt
    });
  }, [pathname, search]);

  // Component này không hiển thị bất kỳ giao diện nào
  return null;
};

export default ScrollToTop;