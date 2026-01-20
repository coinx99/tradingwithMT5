# Sử dụng Python slim để nhẹ
FROM python:3.13.2-slim

# Đặt thư mục làm việc trong container
WORKDIR /fastapp

# Copy pyproject và lock trước để cài dependencies
COPY pyproject.toml uv.lock ./

# Cài công cụ uv để cài dependencies nhanh
RUN pip install uv && uv sync --frozen

# Copy toàn bộ source code vào container
COPY . .

# Expose cổng uvicorn
EXPOSE 8080

# Lệnh chạy container (có thể đổi host/port)
CMD ["uv", "run", "main.py"]
