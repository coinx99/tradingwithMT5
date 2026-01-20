# Setup Guide - Shared Types Package

## Đã hoàn thành

✅ Tạo package `@marketing-agency/shared-types`
✅ Migrate UserRole và UserStatus enums
✅ Migrate User interfaces và types
✅ Cấu hình TypeScript compilation
✅ Link package vào services/user và apps/admin
✅ Build package thành công

## Cách sử dụng

### 1. Sau khi clone repo

```bash
# Install dependencies
pnpm install

# Build shared packages
pnpm build:packages
```

### 2. Development workflow

Khi develop và cần update shared types:

```bash
# Option 1: Build một lần
cd packages/shared-types
pnpm build

# Option 2: Watch mode (tự động rebuild khi có thay đổi)
cd packages/shared-types
pnpm dev
```

### 3. Import trong code

**Backend (NestJS):**
```typescript
import { UserRole, UserStatus } from '@marketing-agency/shared-types';
```

**Frontend (React):**
```typescript
import { UserRole, UserStatus, type User } from '@marketing-agency/shared-types';
```

## Các files đã được update

### Backend
- ✅ `services/user/package.json` - Added dependency
- ✅ `services/user/src/users/entities/user.entity.ts` - Import from shared-types

### Frontend
- ✅ `apps/admin/package.json` - Added dependency
- ✅ `apps/admin/src/types/user.ts` - Import from shared-types
- ✅ `apps/admin/src/pages/users/UserList.tsx` - Already using types correctly
- ✅ `apps/admin/src/pages/users/UserDetail.tsx` - Already using types correctly

## Lưu ý quan trọng

1. **Luôn build shared-types trước khi chạy services:**
   ```bash
   pnpm build:packages
   ```

2. **Restart TypeScript server** trong IDE sau khi build để nhận types mới

3. **Không định nghĩa duplicate types** - Luôn import từ shared-types

4. **Khi thêm type mới:**
   - Thêm vào `packages/shared-types/src/`
   - Build package
   - Import và sử dụng

## Troubleshooting

### Lỗi: Cannot find module '@marketing-agency/shared-types'

**Giải pháp:**
```bash
# 1. Install dependencies
pnpm install

# 2. Build shared-types
cd packages/shared-types
pnpm build

# 3. Restart TypeScript server trong IDE
```

### Types không update

**Giải pháp:**
```bash
# 1. Rebuild shared-types
cd packages/shared-types
pnpm build

# 2. Restart dev server
# Backend
cd services/user
pnpm dev

# Frontend
cd apps/admin
pnpm dev
```

## Next Steps

Khi cần thêm types cho domains khác (Product, Order, etc.):

1. Tạo folder mới trong `packages/shared-types/src/`
2. Thêm enums.ts và types.ts
3. Export trong index.ts
4. Build package
5. Import và sử dụng

Xem thêm: `docs/architecture/SHARED_TYPES.md`
