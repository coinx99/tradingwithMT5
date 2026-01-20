# Quick Start - Shared Types

## TL;DR

```bash
# Setup
pnpm install
pnpm build:packages

# Import và dùng
import { UserRole, UserStatus, type User } from '@marketing-agency/shared-types';
```

## Commands

```bash
# Build shared-types
cd packages/shared-types && pnpm build

# Watch mode (auto rebuild)
cd packages/shared-types && pnpm dev

# Build all packages
pnpm build:packages
```

## Import Examples

### Backend (NestJS)

```typescript
import { UserRole, UserStatus } from '@marketing-agency/shared-types';

// Re-export nếu cần backward compatibility
export { UserRole, UserStatus };
```

### Frontend (React)

```typescript
import { 
  UserRole, 
  UserStatus, 
  type User,
  type AuthResponse 
} from '@marketing-agency/shared-types';
```

## Available Types

### User Domain

**Enums:**
- `UserRole`: USER, SELLER, ADMIN, SUPER_ADMIN
- `UserStatus`: ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION

**Interfaces:**
- `User`: Complete user object
- `AuthResponse`: Login/register response
- `LoginInput`: Login credentials
- `CreateUserInput`: User creation data
- `UpdateUserInput`: User update data

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Module not found | `pnpm install && cd packages/shared-types && pnpm build` |
| Types not updating | Rebuild: `cd packages/shared-types && pnpm build` |
| IDE errors | Restart TypeScript server |

## File Structure

```
packages/shared-types/
├── src/
│   ├── user/
│   │   ├── enums.ts      # Enums
│   │   ├── types.ts      # Interfaces
│   │   └── index.ts      # Re-exports
│   └── index.ts          # Main entry
└── dist/                 # Compiled output
```

## Adding New Types

```bash
# 1. Create files
mkdir packages/shared-types/src/product
touch packages/shared-types/src/product/{enums,types,index}.ts

# 2. Define types
# Edit enums.ts, types.ts

# 3. Export
# Edit product/index.ts and src/index.ts

# 4. Build
cd packages/shared-types && pnpm build

# 5. Use
import { ProductStatus } from '@marketing-agency/shared-types';
```

## Links

- [README.md](./README.md) - Full documentation
- [SETUP.md](./SETUP.md) - Setup guide
- [/docs/architecture/SHARED_TYPES.md](../../docs/architecture/SHARED_TYPES.md) - Architecture
