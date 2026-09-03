# CareS Frontend

Ứng dụng React cho hệ thống quản lý quy trình khám bệnh CareS.

## Chạy dự án

```powershell
npm install
npm run dev
```

Ứng dụng mặc định chạy tại `http://localhost:3000`. Địa chỉ backend được cấu hình bằng `VITE_API_URL`.

## Kiểm tra

```powershell
npm run lint
npm run check:dead-code
npm run build
```

Không xóa dependency chỉ dựa vào `depcheck`: Tailwind/PostCSS được sử dụng gián tiếp trong pipeline build.

## Tài liệu

- [Kiến trúc frontend](docs/frontend-architecture.md)
- [Route và vai trò](docs/routes-and-roles.md)
- [Quy ước giao diện](docs/ui-conventions.md)
- Tài liệu kiến trúc, domain, API và luồng nghiệp vụ tổng thể nằm trong repository backend.
