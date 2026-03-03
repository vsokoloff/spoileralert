# Spoiler Alert Backend API

FastAPI backend for the Spoiler Alert food tracking app.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. Set up PostgreSQL database:
```bash
createdb spoiler_alert
```

4. Run migrations (if using Alembic):
```bash
alembic upgrade head
```

5. Run the server:
```bash
python run.py
# or
uvicorn app.main:app --reload
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/items` - Get all items (with filters)
- `POST /api/items` - Create item
- `PUT /api/items/{id}` - Update item
- `DELETE /api/items/{id}` - Delete item
- `GET /api/items/deleted/recent` - Get recently deleted items
- `POST /api/items/deleted/{id}/restore` - Restore deleted item
- `POST /api/receipt/scan` - Scan receipt
- `POST /api/spoy/chat` - Chat with SPOY AI
- `GET /api/notifications` - Get notifications
