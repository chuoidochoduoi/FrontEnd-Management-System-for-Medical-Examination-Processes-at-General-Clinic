import React from 'react';
import InfoLayout from '@/components/layout/InfoLayout';

const TermsPage = () => {
  return (
    <InfoLayout>
      <div className="mb-10">
        <p className="text-sm font-semibold text-slate-400 mb-2">Trang chủ &gt; Điều khoản dịch vụ</p>
        <h1 className="text-4xl font-bold text-slate-900 mb-6">Điều khoản dịch vụ</h1>
        <p className="">
          Vui lòng đọc kỹ các điều khoản dưới đây khi sử dụng website và dịch vụ của Phòng khám đa khoa CARES.
        </p>
      </div>

      <div className="space-y-10 text-slate-600 font-light leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">1. Quy định chung</h2>
          <p>
            Khi sử dụng website và dịch vụ của Phòng khám đa khoa CARES, bạn đồng ý tuân thủ các điều khoản và điều kiện được quy định dưới đây. CARES có quyền thay đổi, bổ sung hoặc cập nhật các điều khoản này vào bất kỳ thời điểm nào mà không cần báo trước.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">2. Sử dụng dịch vụ</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Người dùng cam kết cung cấp thông tin chính xác, đầy đủ và cập nhật khi sử dụng dịch vụ.</li>
            <li>Không sử dụng dịch vụ với mục đích vi phạm pháp luật hoặc xâm phạm quyền lợi của tổ chức, cá nhân khác.</li>
            <li>CARES có quyền từ chối hoặc ngừng cung cấp dịch vụ đối với các hành vi vi phạm điều khoản.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">3. Quyền và trách nhiệm của CARES</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Đảm bảo cung cấp dịch vụ chất lượng, an toàn và bảo mật thông tin khách hàng.</li>
            <li>Có quyền thay đổi, tạm ngừng hoặc chấm dứt dịch vụ vì lý do kỹ thuật hoặc pháp lý.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">4. Thanh toán</h2>
          <p>
            Các chi phí dịch vụ được thông báo rõ ràng trước khi thanh toán. Hệ thống CareS hiện không hỗ trợ hoàn tiền trực tuyến. Trường hợp cần điều chỉnh giao dịch, khách hàng vui lòng liên hệ trực tiếp phòng khám để được xem xét theo quy định áp dụng. Việc hoàn tác giao dịch lỗi, nếu có, chỉ nhằm khôi phục trạng thái thanh toán và không phải là chức năng hoàn tiền cho hóa đơn đã thanh toán.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">5. Thẻ trả trước CareS</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Thẻ được sử dụng để thanh toán các dịch vụ đủ điều kiện tại CareS theo chính sách áp dụng tại từng thời điểm.</li>
            <li>Số dư được sử dụng ngay sau khi nạp thành công; quyền lợi ưu đãi của kỳ mới có hiệu lực từ 00:00 ngày kế tiếp theo giờ Việt Nam.</li>
            <li>Ưu đãi không áp dụng hồi tố cho hóa đơn được tạo trước ngày quyền lợi có hiệu lực.</li>
            <li>Số dư thẻ không được rút hoặc chuyển thành tiền mặt.</li>
            <li>Chủ thẻ có trách nhiệm bảo mật mã PIN và chỉ chia sẻ quyền sử dụng với thành viên gia đình được quản lý trên hệ thống.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">6. Điều khoản khác</h2>
          <p>
            Mọi tranh chấp phát sinh sẽ được giải quyết trên tinh thần hợp tác. Trường hợp không thể thương lượng, tranh chấp sẽ được giải quyết theo quy định của pháp luật Việt Nam.
          </p>
        </section>
      </div>
    </InfoLayout>
  );
};

export default TermsPage;
