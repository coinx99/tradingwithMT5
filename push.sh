
git add .
git status
git commit -m "feat: Fix MT5 connection and account management

- Fix MT5 login type conversion (int to string) for connection
- Replace non-existent account_name with login@server in responses  
- Add proper GraphQL response types (LoginResponse, etc.)
- Fix UpdateAccountInput schema (accountId vs account_id)
- Implement proper error handling without raising exceptions
- Add UI auto-refresh after MT5 account connection
- Fix React Router SPA routing with catch-all handler
- Serve static UI from FastAPI backend
- Remove unused imports and fix TypeScript errors
- Add password encryption security improvements

Features working:
✅ MT5 account CRUD operations
✅ MT5 connection with real-time updates
✅ Login with proper error messages
✅ Single server deployment (UI + API)
✅ Auto-refresh UI on state changes"
git push 