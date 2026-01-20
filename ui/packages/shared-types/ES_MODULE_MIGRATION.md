# ES Module Migration for Shared Types

## Problem

Shared-types package was initially configured to output CommonJS modules (`module: "commonjs"`), which caused issues when importing in browser/Vite environments:

```
SyntaxError: The requested module does not provide an export named 'UserRole'
```

## Root Cause

- **CommonJS output**: Uses `exports.UserRole = ...` syntax
- **Vite/Browser**: Expects ES modules with `export` syntax
- **NestJS**: Works with both CommonJS and ES modules

## Solution

Convert shared-types package to output ES modules to support both backend (NestJS) and frontend (Vite/React).

### 1. Update tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",  // Changed from "commonjs"
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node"  // Added
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 2. Update package.json

```json
{
  "name": "@marketing-agency/shared-types",
  "version": "1.0.0",
  "type": "module",  // Added - declares this as ES module package
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {  // Added - modern package exports
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "~5.8.3"
  }
}
```

### 3. Rebuild Package

```bash
cd packages/shared-types
pnpm build
```

## Verification

### Check Output Format

Before (CommonJS):
```javascript
// dist/user/enums.js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
})(UserRole = exports.UserRole || (exports.UserRole = {}));
```

After (ES Module):
```javascript
// dist/user/enums.js
export var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
})(UserRole || (UserRole = {}));
```

### Test Import

**Backend (NestJS):**
```typescript
import { UserRole, UserStatus } from '@marketing-agency/shared-types';
// ✅ Works
```

**Frontend (Vite/React):**
```typescript
import { UserRole, UserStatus, type User } from '@marketing-agency/shared-types';
// ✅ Works
```

## Additional Changes Required

### User Model Migration

The User model was also updated from single `role` to multiple `roles`:

**Before:**
```typescript
interface User {
  role: string;  // Single role
}
```

**After:**
```typescript
interface User {
  roles: UserRole[];  // Multiple roles
}
```

### Code Updates

Created helper functions in `apps/admin/src/utils/roleHelpers.ts`:

```typescript
// Check if user has a specific role
export const hasRole = (user: User | null | undefined, role: UserRole): boolean => {
  if (!user || !user.roles) return false;
  return user.roles.includes(role);
};

// Check if user has any of the specified roles
export const hasAnyRole = (user: User | null | undefined, roles: UserRole[]): boolean => {
  if (!user || !user.roles) return false;
  return roles.some(role => user.roles.includes(role));
};

// Check if user is admin
export const isAdmin = (user: User | null | undefined): boolean => {
  return hasAnyRole(user, [UserRole.ADMIN, UserRole.SUPER_ADMIN]);
};

// Get primary role
export const getPrimaryRole = (user: User | null | undefined): UserRole | null => {
  if (!user || !user.roles || user.roles.length === 0) return null;
  return user.roles[0];
};
```

### Updated Files

- ✅ `apps/admin/src/pages/jobs/JobList.tsx`
- ✅ `apps/admin/src/pages/PermissionTest.tsx`
- ✅ `apps/admin/src/pages/Profile.tsx`
- ✅ `apps/admin/src/utils/roleHelpers.ts` (new)

## Docker Integration

No changes needed for Docker. The ES modules work seamlessly:

```dockerfile
# Build shared-types package
RUN cd packages/shared-types && pnpm build
```

The built ES modules are compatible with both Node.js (NestJS) and browsers (Vite).

## Benefits

✅ **Universal compatibility**: Works in both Node.js and browsers
✅ **Modern standard**: ES modules are the JavaScript standard
✅ **Tree-shaking**: Better optimization in bundlers
✅ **Type safety**: Full TypeScript support maintained
✅ **Hot reload**: Works with both NestJS watch mode and Vite HMR

## Testing

### Backend
```bash
cd services/user
pnpm tsc --noEmit
# ✅ No errors
```

### Frontend
```bash
cd apps/admin
pnpm tsc --noEmit
# ✅ No errors

pnpm dev
# ✅ Dev server starts successfully
```

### Docker
```bash
docker compose -f infrastructure/docker/docker-compose.dev.yml logs user
# ✅ [12:18:37 PM] Found 0 errors. Watching for file changes.
```

## Summary

The migration from CommonJS to ES modules ensures shared-types package works seamlessly across:
- ✅ Backend services (NestJS)
- ✅ Frontend apps (Vite/React)
- ✅ Docker containers
- ✅ Development (hot reload)
- ✅ Production builds

All with a single source of truth for type definitions! 🎉
