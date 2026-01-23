#!/bin/bash

echo "🚀 Building React UI..."
cd ui/trading
pnpm build

if [ $? -eq 0 ]; then
    echo "✅ UI build successful!"
    echo "🚀 Starting FastAPI backend..."
    cd ../../trading
    uv run main.py
else
    echo "❌ UI build failed!"
    exit 1
fi
