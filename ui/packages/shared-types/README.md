# @marketing-agency/shared-types

Shared TypeScript types and enums used across the marketing agency monorepo.

## Purpose

This package provides a single source of truth for common types, enums, and interfaces used by both:
- Backend services (NestJS)
- Frontend applications (React)

## Usage

### Installation

This package is automatically linked via pnpm workspace. Just add to your `package.json`:

```json
{
  "dependencies": {
    "@marketing-agency/shared-types": "workspace:*"
  }
}
```

### Import Examples

```typescript
// Import enums
import { UserRole, UserStatus } from '@marketing-agency/shared-types';

// Import types
import { User, AuthResponse, LoginInput } from '@marketing-agency/shared-types';

// Use in code
const role: UserRole = UserRole.ADMIN;
const user: User = {
  id: '123',
  email: 'user@example.com',
  roles: [UserRole.USER],
  status: UserStatus.ACTIVE,
  // ... other fields
};
```

## Development

### Build

```bash
pnpm build
```

### Watch Mode

```bash
pnpm dev
```

## 📦 Package Structure

```
packages/shared-types/
├── src/
│   ├── user/
│   │   ├── enums.ts      # UserRole, UserStatus enums
│   │   ├── types.ts      # User interface and related types
│   │   └── index.ts      # Re-exports
│   └── index.ts          # Main entry point
├── dist/                 # Compiled ES modules (gitignored)
├── package.json          # type: "module" for ES modules
├── tsconfig.json         # module: "ESNext" for ES output
└── README.md
```

**Note:** This package outputs **ES modules** for compatibility with both Node.js (NestJS) and browsers (Vite).

## Structure

```
src/
├── user/
│   ├── enums.ts      # User-related enums (UserRole, UserStatus)
│   ├── types.ts      # User-related interfaces
│   └── index.ts      # Re-exports
└── index.ts          # Main entry point
```

## Adding New Types

1. Create a new folder under `src/` for your domain (e.g., `product/`, `order/`)
2. Add your enums and types
3. Export them in the folder's `index.ts`
4. Re-export in the main `src/index.ts`
5. Run `pnpm build`
