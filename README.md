# KujiLingo Frontend

Monorepo cho phần frontend của **KujiLingo** — ứng dụng học ngôn ngữ, bao gồm ứng dụng **Web** (Next.js) và **Mobile** (React Native / Expo).

## Cấu trúc dự án

```
KujiLingo_FE/
├── apps/
│   ├── web/          # Ứng dụng web — Next.js 16, React 19, TailwindCSS 4
│   └── mobile/       # Ứng dụng mobile — Expo SDK 57, React Native 0.86
├── packages/
│   ├── api/          # Shared API client
│   ├── config/       # Shared configuration
│   ├── constants/    # Shared constants
│   ├── types/        # Shared TypeScript types
│   ├── utils/        # Shared utilities
│   └── validation/   # Shared validation logic
├── turbo.json        # Turborepo pipeline config
├── package.json      # Root workspace scripts
└── pnpm-lock.yaml
```

## Yêu cầu hệ thống

| Công cụ  | Phiên bản tối thiểu |
| -------- | -------------------- |
| Node.js  | >= 18                |
| pnpm     | >= 10                |
| Git      | >= 2.x               |

> [!TIP]
> Nếu chưa cài pnpm, chạy: `npm install -g pnpm`

## Cài đặt

```bash
# 1. Clone repository
git clone https://github.com/LeDuyCoder/KujiLingo_FE.git
cd KujiLingo_FE

# 2. Cài đặt dependencies cho toàn bộ monorepo
pnpm install
```

> [!NOTE]
> `pnpm install` ở root sẽ tự động cài dependencies cho cả `apps/web`, `apps/mobile` và các package trong `packages/`.

## Chạy dự án

### 🌐 Web (Next.js)

```bash
# Từ thư mục root
pnpm dev:web
```

Ứng dụng web sẽ chạy tại **http://localhost:3000**.

### 📱 Mobile (Expo)

```bash
# Từ thư mục root
pnpm dev:mobile
```

Sau khi Expo dev server khởi động:

- Nhấn **`a`** để mở trên Android Emulator
- Nhấn **`i`** để mở trên iOS Simulator (chỉ macOS)
- Quét **QR code** bằng ứng dụng **Expo Go** trên điện thoại thật

### 🚀 Chạy cả hai cùng lúc (Turborepo)

```bash
pnpm turbo dev
```

Turborepo sẽ khởi chạy dev server cho cả web và mobile song song.

## Build production

```bash
# Build toàn bộ workspace
pnpm turbo build

# Hoặc chỉ build web
pnpm --filter web build
```

## Các lệnh hữu ích

| Lệnh                        | Mô tả                                  |
| ---------------------------- | --------------------------------------- |
| `pnpm dev:web`               | Chạy dev server cho web                 |
| `pnpm dev:mobile`            | Chạy Expo dev server cho mobile         |
| `pnpm turbo dev`             | Chạy dev cho tất cả apps                |
| `pnpm turbo build`           | Build production cho tất cả apps        |
| `pnpm --filter web lint`     | Lint code cho web                       |
| `pnpm --filter mobile lint`  | Lint code cho mobile                    |
| `pnpm install`               | Cài đặt tất cả dependencies            |

## Tech Stack

- **Monorepo**: [pnpm Workspaces](https://pnpm.io/workspaces) + [Turborepo](https://turbo.build/)
- **Web**: [Next.js 16](https://nextjs.org/) · [React 19](https://react.dev/) · [TailwindCSS 4](https://tailwindcss.com/)
- **Mobile**: [Expo SDK 57](https://expo.dev/) · [React Native 0.86](https://reactnative.dev/)
- **Language**: TypeScript

## License

MIT
