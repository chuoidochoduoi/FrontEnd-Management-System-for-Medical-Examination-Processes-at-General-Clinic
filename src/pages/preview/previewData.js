export const previewServiceGroups = [
  {
    id: 'internal',
    name: 'Nội khoa',
    eyebrow: 'Chăm sóc nền tảng',
    description: 'Thăm khám tổng quát và theo dõi các bệnh lý nội khoa thường gặp.',
    accent: 'from-[#DDF5F1] to-[#F7FCFB]',
    services: ['Khám Nội tổng quát', 'Khám Tim mạch cơ bản', 'Khám Tiêu hóa', 'Khám Hô hấp'],
  },
  {
    id: 'surgery',
    name: 'Ngoại khoa',
    eyebrow: 'Xử trí an toàn',
    description: 'Đánh giá chấn thương và chăm sóc vết thương theo quy trình chuẩn.',
    accent: 'from-[#E5F6F2] to-[#FAFDFC]',
    services: ['Khám Ngoại tổng quát', 'Khám chấn thương phần mềm', 'Khám vết thương', 'Thay băng'],
  },
  {
    id: 'pediatrics',
    name: 'Nhi khoa',
    eyebrow: 'Đồng hành cùng trẻ',
    description: 'Không gian thân thiện và phác đồ phù hợp từng giai đoạn phát triển.',
    accent: 'from-[#D6F1EB] to-[#F4FBF9]',
    services: ['Khám Nhi tổng quát', 'Khám hô hấp trẻ em', 'Khám tiêu hóa trẻ em', 'Khám sốt'],
  },
  {
    id: 'obstetrics',
    name: 'Sản phụ khoa',
    eyebrow: 'Chăm sóc riêng tư',
    description: 'Tư vấn và thăm khám tận tâm trong không gian kín đáo, thoải mái.',
    accent: 'from-[#E8F7F4] to-[#FCFEFD]',
    services: ['Khám Phụ khoa', 'Khám Thai', 'Tư vấn kế hoạch hóa gia đình', 'Khám viêm nhiễm'],
  },
  {
    id: 'dermatology',
    name: 'Da liễu',
    eyebrow: 'Làn da khỏe mạnh',
    description: 'Chẩn đoán các vấn đề da thường gặp và xây dựng lộ trình chăm sóc.',
    accent: 'from-[#CFEDE7] to-[#F2FAF8]',
    services: ['Khám Da liễu', 'Khám mụn trứng cá', 'Khám viêm da, dị ứng', 'Khám nấm da'],
  },
  {
    id: 'clinical',
    name: 'Cận lâm sàng',
    eyebrow: 'Kết quả tin cậy',
    description: 'Xét nghiệm và chẩn đoán hình ảnh hỗ trợ bác sĩ đưa ra kết luận.',
    accent: 'from-[#D9F3EE] to-[#F6FBFA]',
    services: ['Công thức máu', 'Sinh hóa máu', 'X-quang ngực', 'Siêu âm ổ bụng'],
  },
];

export const previewDoctors = [
  { id: 1, name: 'TS.BS. Nguyễn Trí Dũng', specialty: 'Nội khoa', experience: '16 năm kinh nghiệm', quote: 'Lắng nghe kỹ là bước đầu tiên của một chẩn đoán tốt.', initials: 'ND', tone: 'from-[#CDEFE8] via-[#EAF8F5] to-white' },
  { id: 2, name: 'ThS.BS. Trần Thu Hà', specialty: 'Nhi khoa', experience: '12 năm kinh nghiệm', quote: 'Mỗi em bé cần một cách tiếp cận riêng và thật dịu dàng.', initials: 'TH', tone: 'from-[#D9F3EE] via-[#F0FAF8] to-white' },
  { id: 3, name: 'BS.CKI. Phạm Văn Minh', specialty: 'Ngoại khoa', experience: '14 năm kinh nghiệm', quote: 'An toàn, rõ ràng và đúng chỉ định trong từng xử trí.', initials: 'PM', tone: 'from-[#BFE7DF] via-[#E6F6F2] to-white' },
  { id: 4, name: 'BS. Lê Hoàng Yến', specialty: 'Sản phụ khoa', experience: '10 năm kinh nghiệm', quote: 'Một không gian tin cậy giúp người bệnh chia sẻ dễ dàng hơn.', initials: 'LY', tone: 'from-[#E3F7F3] via-[#F4FBF9] to-white' },
];

export const previewJourneySteps = [
  { title: 'Tiếp nhận', description: 'Xác nhận thông tin và nhu cầu khám của bạn.', status: 'Hoàn thành' },
  { title: 'Thanh toán', description: 'Hoàn tất chi phí dịch vụ đã lựa chọn.', status: 'Hoàn thành' },
  { title: 'Khám Nội khoa', description: 'Đang chờ được mời vào Phòng Nội 02.', status: 'Đang chờ' },
  { title: 'Cận lâm sàng', description: 'Thực hiện khi có chỉ định của bác sĩ.', status: 'Sắp tới' },
  { title: 'Nhận kết luận', description: 'Bác sĩ tổng kết và hướng dẫn điều trị.', status: 'Sắp tới' },
];

export const previewTestimonials = [
  { content: 'Tôi biết mình đang ở bước nào và phải đi đâu tiếp theo. Trải nghiệm rất nhẹ nhàng.', name: 'Nguyễn Minh Anh', role: 'Khách hàng Nội khoa' },
  { content: 'Không gian dễ chịu, bác sĩ giải thích kỹ và lịch khám được sắp xếp rõ ràng.', name: 'Trần Hoài Nam', role: 'Phụ huynh bệnh nhi' },
  { content: 'Kết quả xét nghiệm được trình bày dễ hiểu, tôi có thể xem lại ngay trên hệ thống.', name: 'Lê Thu Hương', role: 'Khách hàng Da liễu' },
];

export const previewWorkingHours = [
  ['Ca Sáng', '00:00 – 08:00'],
  ['Ca Chiều', '08:00 – 16:00'],
  ['Ca Tối', '16:00 – 23:59'],
];
