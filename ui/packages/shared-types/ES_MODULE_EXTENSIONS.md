# ES Module File Extensions Fix

## Problem

After migrating to ES modules, Node.js threw an error:

```
Error [ERR_UNSUPPORTED_DIR_IMPORT]: Directory import '/app/packages/shared-types/dist/user' 
is not supported resolving ES modules imported from /app/packages/shared-types/dist/index.js
```

## Root Cause

In ES modules, Node.js requires **explicit file extensions** in import statements. Directory imports (without file extension) are not supported.

**CommonJS (old):**
```javascript
// Works in CommonJS
import { UserRole } from './user';  // ✅ Resolves to ./user/index.js automatically
```

**ES Modules (new):**
```javascript
// Fails in ES modules
import { UserRole } from './user';  // ❌ Error: Directory import not supported

// Must be explicit
import { UserRole } from './user/index.js';  // ✅ Works
```

## Solution

Add `.js` extensions to all relative imports in TypeScript source files.

### Changes Made

#### 1. `src/index.ts`

**Before:**
```typescript
export * from './user';
```

**After:**
```typescript
export * from './user/index.js';
```

#### 2. `src/user/index.ts`

**Before:**
```typescript
export * from './enums';
export * from './types';
```

**After:**
```typescript
export * from './enums.js';
export * from './types.js';
```

#### 3. `src/user/types.ts`

**Before:**
```typescript
import { UserRole, UserStatus } from './enums';
```

**After:**
```typescript
import { UserRole, UserStatus } from './enums.js';
```

## Important Notes

### TypeScript Behavior

TypeScript **does NOT** automatically add `.js` extensions when compiling to ES modules. You must:

1. Write `.js` extensions in your `.ts` source files
2. TypeScript will preserve these extensions in the output `.js` files

**Example:**

```typescript
// src/index.ts (source)
export * from './user/index.js';  // Note: .js extension in .ts file!

// dist/index.js (compiled)
export * from './user/index.js';  // Extension preserved
```

### Why `.js` and not `.ts`?

Even though you're importing from `.ts` files, you must use `.js` extensions because:

1. TypeScript compiles `.ts` → `.js`
2. At runtime, Node.js loads `.js` files
3. Import paths are **not rewritten** by TypeScript
4. So imports must reference the **output** file extensions, not source

### Module Resolution

With `"moduleResolution": "node"` in `tsconfig.json`:

- TypeScript understands `.js` refers to `.ts` during compilation
- Node.js resolves `.js` to actual `.js` files at runtime

## Verification

### Build Output

After rebuild, check the compiled files:

```bash
cd packages/shared-types
pnpm build

# Check output
cat dist/index.js
# Output: export * from './user/index.js';

cat dist/user/index.js
# Output: 
# export * from './enums.js';
# export * from './types.js';
```

### Test in Node.js

```bash
# Backend (NestJS in Docker)
docker compose logs user --tail=20
# Expected: [1:09:03 PM] Found 0 errors. Watching for file changes.
```

### Test in Browser

```bash
# Frontend (Vite)
cd apps/admin
pnpm dev
# Expected: Server running without errors
```

## Best Practices

### 1. Always Use Explicit Extensions

```typescript
// ✅ Good
import { UserRole } from './enums.js';
import { User } from '../types/user.js';

// ❌ Bad
import { UserRole } from './enums';
import { User } from '../types/user';
```

### 2. Use Index Files Explicitly

```typescript
// ✅ Good
export * from './user/index.js';

// ❌ Bad
export * from './user';  // Directory import
```

### 3. Configure TypeScript Properly

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node"
  }
}
```

## Common Errors

### Error 1: Directory Import

```
Error [ERR_UNSUPPORTED_DIR_IMPORT]: Directory import '/path/to/dir' is not supported
```

**Fix:** Add `/index.js` to the import path
```typescript
// Before
import * from './dir';

// After
import * from './dir/index.js';
```

### Error 2: Module Not Found

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/path/to/file'
```

**Fix:** Add `.js` extension
```typescript
// Before
import { X } from './file';

// After
import { X } from './file.js';
```

### Error 3: TypeScript Can't Find Module

```
TS2307: Cannot find module './file.js' or its corresponding type declarations.
```

**Fix:** Ensure `moduleResolution` is set to `"node"` in `tsconfig.json`

## References

- [Node.js ES Modules Documentation](https://nodejs.org/api/esm.html)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [ES Modules: A cartoon deep-dive](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/)

## Summary

✅ **Always use explicit `.js` extensions** in ES module imports
✅ **Write `.js` in `.ts` files** - TypeScript will preserve them
✅ **Use `/index.js`** instead of directory imports
✅ **Configure `moduleResolution: "node"`** in tsconfig.json

This ensures compatibility across:
- ✅ Node.js (NestJS backend)
- ✅ Browsers (Vite frontend)
- ✅ Docker containers
- ✅ TypeScript compiler

ES modules are strict but predictable! 🎯
