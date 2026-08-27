# 📚 KujiLingo Frontend - Project Summary

## 1. Tổng quan dự án (Overview)
**KujiLingo_FE** là một monorepo quản lý mã nguồn frontend cho ứng dụng học ngôn ngữ KujiLingo. Dự án bao gồm hai phần chính:
- **Ứng dụng Web** dành cho trình duyệt.
- **Ứng dụng Mobile** dành cho Android & iOS.

Dự án sử dụng kiến trúc Monorepo để dễ dàng chia sẻ code (dù hiện tại các package chia sẻ vẫn đang trống).
- **Quản lý Monorepo:** [Turborepo](https://turbo.build/) và [pnpm workspaces](https://pnpm.io/workspaces).
- **Quản lý package:** pnpm@11.20.0.

---

## 2. Cấu trúc thư mục (Project Structure)

```text
KujiLingo_FE/
├── .github/
│   └── workflows/
│       └── ci.yml            # Workflow CI (GitHub Actions) cho web và mobile
├── apps/
│   ├── mobile/               # Mã nguồn ứng dụng Mobile (Expo)
│   └── web/                  # Mã nguồn ứng dụng Web (Next.js)
├── packages/                 # Thư mục chứa các shared module (hiện đang trống)
│   ├── api/                  # Shared API client 
│   ├── config/               # Shared configuration 
│   ├── constants/            # Shared constants 
│   ├── types/                # Shared TypeScript types 
│   ├── utils/                # Shared utilities 
│   └── validation/           # Shared validation logic 
├── package.json              # Khai báo scripts và dependency chung của Monorepo
├── pnpm-lock.yaml            # Lock file của pnpm cho toàn bộ dự án
└── turbo.json                # Cấu hình pipeline của Turborepo
```

---

## 3. Công nghệ sử dụng (Technology Stack)

### 🌐 Ứng dụng Web (`apps/web`)
Ứng dụng Web được xây dựng với cấu trúc App Router của Next.js thế hệ mới:
- **Core Framework:** [Next.js 16.3.0](https://nextjs.org/)
- **UI Library:** [React 19.2.8](https://react.dev/)
- **Styling:** [TailwindCSS v4](https://tailwindcss.com/) (thông qua `@tailwindcss/postcss`)
- **Ngôn ngữ:** TypeScript 5.x
- **Linter:** ESLint 9

### 📱 Ứng dụng Mobile (`apps/mobile`)
Ứng dụng di động được xây dựng bằng Expo với Expo Router để xử lý file-based routing:
- **Core Framework:** [Expo SDK 57](https://expo.dev/)
- **UI Library:** [React Native 0.86.2](https://reactnative.dev/) & [React 19.2.3](https://react.dev/)
- **Navigation:** `expo-router`
- **Animation & Cử chỉ:** `react-native-reanimated` (4.5.1), `react-native-gesture-handler`, `react-native-worklets`
- **Ngôn ngữ:** TypeScript 6.x
- **Linter:** ESLint 9

### 🛠 Cấu hình CI/CD (`.github/workflows/ci.yml`)
Dự án được thiết lập sẵn **GitHub Actions** với 2 Job chính sẽ chạy khi có lệnh Push hoặc Pull Request vào các nhánh `main` và `dev`:
1. **`ci-web`**: Cài đặt pnpm, kiểm tra TypeScript (`tsc --noEmit`), chạy Linter, và Build Next.js.
2. **`ci-mobile`**: Cài đặt pnpm, kiểm tra TypeScript (`tsc --noEmit`), và chạy Linter cho Expo.

---

## 4. Các điểm lưu ý quan trọng (Important Observations)

Dựa trên quá trình quét dự án, đây là một số vấn đề cần lưu ý trong cấu trúc hiện tại:

1. ⚠️ **Thiếu file `pnpm-workspace.yaml` ở thư mục gốc (Root):**
   Mặc dù trong `README.md` có ghi dự án dùng **pnpm workspaces**, nhưng file `pnpm-workspace.yaml` hiện không tồn tại ở thư mục gốc `KujiLingo_FE`. Điều này sẽ khiến lệnh `pnpm install` không tự động liên kết (symlink) các thư mục trong `apps/` và `packages/` theo chuẩn monorepo. Cần tạo file `pnpm-workspace.yaml` với nội dung khai báo các workspace.

2. ⚠️ **Thư mục `packages/` đang trống rỗng:**
   Các thư mục `api`, `config`, `constants`, `types`, `utils`, `validation` bên trong `packages/` hiện đang trống hoàn toàn (chưa có `package.json` hay file mã nguồn nào).

3. ⚠️ **File `pnpm-workspace.yaml` nằm sai vị trí:**
   Thay vì ở gốc dự án, lại có 2 file `pnpm-workspace.yaml` con nằm rải rác bên trong `apps/web/` và `apps/mobile/` (chỉ chứa cấu hình `allowBuilds`). Bạn có thể gộp chúng lại vào cấu hình gốc.
