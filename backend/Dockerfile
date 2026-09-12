FROM python:3.12-slim

WORKDIR /app

# libpq is needed at runtime by psycopg (the sync driver Alembic uses);
# asyncpg is pure-Python/C-extension and needs no separate system library.
RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml README.md ./
RUN pip install --no-cache-dir -e ".[dev]"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
