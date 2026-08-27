const exact = {
  'Tất cả': 'All', 'Thêm mới': 'Add new', 'Cập nhật': 'Update', 'Chỉnh sửa': 'Edit',
  'Xóa': 'Delete', 'Hủy': 'Cancel', 'Lưu': 'Save', 'Đóng': 'Close', 'Xác nhận': 'Confirm',
  'Tìm kiếm': 'Search', 'Làm mới': 'Refresh', 'Thao tác': 'Actions', 'Trạng thái': 'Status',
  'Tên': 'Name', 'Mã': 'Code', 'Mô tả': 'Description', 'Ngày tạo': 'Created date',
  'Đang tải...': 'Loading...', 'Không có dữ liệu': 'No data', 'Có lỗi xảy ra': 'An error occurred',
  'Đăng xuất': 'Sign out', 'Cài đặt': 'Settings', 'Hồ sơ cá nhân': 'Profile',
  'Sẵn sàng': 'Available', 'Bảo trì': 'Maintenance', 'Hoạt động': 'Active', 'Tạm khóa': 'Suspended',
  'Đang chờ': 'Waiting', 'Đã gọi': 'Called', 'Đang thực hiện': 'In progress',
  'Hoàn thành': 'Completed', 'Đã hoàn thành': 'Completed', 'Đã hủy': 'Cancelled',
  'Bệnh nhân': 'Patient', 'Khách hàng': 'Customer', 'Bác sĩ': 'Doctor', 'Y tá': 'Nurse',
  'Lễ tân': 'Receptionist', 'Thu ngân': 'Cashier', 'Quản trị viên': 'Administrator',
  'Phòng khám': 'Clinic room', 'Dịch vụ': 'Service', 'Chuyên khoa': 'Specialty',
  'Xét nghiệm': 'Test', 'Cận lâm sàng': 'Paraclinical service', 'Hóa đơn': 'Invoice',
  'Lịch hẹn': 'Appointment', 'Ngày khám': 'Visit date', 'Giờ khám': 'Visit time',
  'Nam': 'Male', 'Nữ': 'Female', 'Giới tính': 'Gender', 'Ngày sinh': 'Date of birth',
  'Số điện thoại': 'Phone number', 'Địa chỉ': 'Address', 'Ghi chú': 'Notes',
  'Giá dịch vụ': 'Service price', 'Đơn giá': 'Unit price', 'Tổng tiền': 'Total',
  'Thanh toán': 'Payment', 'Đã thanh toán': 'Paid', 'Chưa thanh toán': 'Unpaid',
  'Kết quả': 'Result', 'Kết luận': 'Conclusion', 'Lưu nháp': 'Save draft',
  'Chi tiết': 'Details', 'Xem chi tiết': 'View details', 'Quay lại': 'Back',
};

const phrases = [
  ['Vui lòng', 'Please'], ['Không thể', 'Unable to'], ['Không tìm thấy', 'Could not find'],
  ['Danh sách', 'List of'], ['Quản lý', 'Manage'], ['Tạo mới', 'Create'], ['Thêm', 'Add'],
  ['Chọn', 'Select'], ['Nhập', 'Enter'], ['Tìm', 'Search'], ['thành công', 'successfully'],
  ['thất bại', 'failed'], ['bệnh nhân', 'patient'], ['khách hàng', 'customer'],
  ['bác sĩ', 'doctor'], ['y tá', 'nurse'], ['phòng khám', 'clinic room'], ['dịch vụ', 'service'],
  ['chuyên khoa', 'specialty'], ['xét nghiệm', 'test'], ['hóa đơn', 'invoice'],
  ['lịch hẹn', 'appointment'], ['trạng thái', 'status'], ['ngày', 'date'], ['giờ', 'time'],
];

const translate = value => {
  if (typeof value === 'string') {
    if (exact[value]) return exact[value];
    return phrases.reduce((text, [source, target]) => text.split(source).join(target), value);
  }
  if (Array.isArray(value)) return value.map(translate);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, translate(item)]));
  }
  return value;
};

export default translate;
