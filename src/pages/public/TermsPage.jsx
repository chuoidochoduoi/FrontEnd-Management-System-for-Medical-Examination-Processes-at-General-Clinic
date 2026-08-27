import React from 'react';
import InfoLayout from '@/components/layout/InfoLayout';

const TermsPage = () => {
  return (
    <InfoLayout>
      <div className="mb-10">
        <p className="text-sm font-semibold text-slate-400 mb-2">Trang chủ &gt; Điều khoản dịch vụ</p>
        <h1 className="text-4xl font-bold text-slate-900 mb-6">Điều khoản dịch vụ</h1>
        <p className="text-slate-600 font-light text-lg leading-relaxed max-w-3xl">
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
          <h2 className="text-xl font-bold text-slate-900 mb-4">4. Thanh toán và hoàn tiền</h2>
          <p>
            Các chi phí dịch vụ sẽ được thông báo rõ ràng trước khi thanh toán. CARES chỉ hoàn tiền trong các trường hợp được quy định cụ thể theo chính sách hoàn tiền của phòng khám.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">5. Điều khoản khác</h2>
          <p>
            Mọi tranh chấp phát sinh sẽ được giải quyết trên tinh thần hợp tác. Trường hợp không thể thương lượng, tranh chấp sẽ được giải quyết theo quy định của pháp luật Việt Nam.
          </p>
        </section>
      </div>
    </InfoLayout>
  );
};

export default TermsPage;
