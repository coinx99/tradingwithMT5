# tradingwithMT5
công cụ giao dịch với MT5 thông qua python uv fastapi, có giao diện web giao tiếp graphql

## trading
- python 
- uv 
- fastapi
- strawberry
- mt5
- redis
```bash
uv sync
uv run main.py
```


## web frontend
- vitejs, react typescript
- antd
- graphql
- apollo client
```bash
cd ui
pnpm install

cd packages/shared-types
pnpm build

cd ../../trading
pnpm dev
```
