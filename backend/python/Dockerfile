FROM python:3.11-slim
WORKDIR /app
COPY backend/python/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/python ./backend/python
WORKDIR /app/backend/python
CMD ["python", "example_ml.py"]
