# AI Microservice - FindIt Multimodal Matching Engine (FastAPI + PyTorch + OpenCLIP + S-BERT)
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed for Pillow and curl healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy service source code
COPY . .

# Expose FastAPI port
EXPOSE 8001

ENV PORT=8001
ENV HOST=0.0.0.0
ENV PYTHONUNBUFFERED=1

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8001/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
