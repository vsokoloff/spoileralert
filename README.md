# Spoiler Alert - MVP

A food tracking app that helps users manage their fridge inventory, track expiration dates, and get AI-powered recipe suggestions to reduce food waste.

## Features

- **Fridge Inventory Management**: Track items with categories, locations, and expiration dates
- **Receipt Scanning**: Automatically extract items from grocery receipts using Google Vision API
- **SPOY AI Assistant**: Get personalized recipe recommendations based on what's in your fridge
- **Color-Coded Status**: Visual indicators for expiration urgency (red/yellow/green/blue/black)
- **In-App Notifications**: Get notified about expiring items
- **Undo Functionality**: Restore recently deleted items
- **Search & Filter**: Find items by category, location, or search term
- **Roommate Support**: Share fridge inventory with roommates (MVP ready)

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Python FastAPI
- **Database**: PostgreSQL
- **APIs**: Google Vision API (receipt scanning), OpenAI API (SPOY chatbot)
- **Deployment**: Vercel (frontend), Backend TBD

## Project Structure

```
Spoiler Alert /
├── backend/
│   ├── app/
│   │   ├── routers/      # API endpoints
│   │   ├── models.py     # Database models
│   │   ├── schemas.py    # Pydantic schemas
│   │   ├── database.py   # Database connection
│   │   ├── expiration_db.py  # Expiration date logic
│   │   └── main.py       # FastAPI app
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── pages/        # React pages
│   │   ├── components/   # React components
│   │   ├── api/          # API client functions
│   │   └── utils/        # Utility functions
│   └── package.json
└── data/                 # Food storage guidelines (PDFs, Excel)
```

## Setup Instructions

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL 14+
- Google Cloud account (for Vision API)
- OpenAI API key

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your credentials:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/spoiler_alert
   GOOGLE_APPLICATION_CREDENTIALS=path/to/google-credentials.json
   OPENAI_API_KEY=your_openai_api_key_here
   SECRET_KEY=your_secret_key_here
   ```

5. **Create PostgreSQL database:**
   ```bash
   createdb spoiler_alert
   ```

6. **Initialize database tables:**
   ```bash
   python init_db.py
   ```

7. **Run the backend server:**
   ```bash
   python run.py
   # or
   uvicorn app.main:app --reload
   ```

   Backend will run on `http://localhost:8000`


Click the button below to deploy your own instance of this backend and database for free:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file (optional):**
   ```bash
   VITE_API_URL=http://localhost:8000
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

   Frontend will run on `http://localhost:3000`

## API Endpoints

### Items
- `GET /api/items` - Get all items (with filters: category, location, search, expired_only)
- `POST /api/items` - Create new item
- `GET /api/items/{id}` - Get specific item
- `PUT /api/items/{id}` - Update item
- `DELETE /api/items/{id}` - Delete item
- `GET /api/items/deleted/recent` - Get recently deleted items
- `POST /api/items/deleted/{id}/restore` - Restore deleted item

### Categories
- `GET /api/categories` - Get all categories with item counts
- `GET /api/categories/{category}/items` - Get items by category

### Receipt Scanning
- `POST /api/receipt/scan` - Scan receipt image (base64)
- `POST /api/receipt/scan/confirm` - Confirm and save scanned items

### SPOY AI
- `POST /api/spoy/chat` - Chat with SPOY
- `GET /api/spoy/history` - Get conversation history

### Notifications
- `GET /api/notifications` - Get all notifications
- `PUT /api/notifications/{id}/read` - Mark as read
- `DELETE /api/notifications/{id}` - Delete notification

## Color Coding System

- **Red**: Expires in < 3 days or expired
- **Yellow**: Expires in 3-7 days
- **Green**: Expires in > 7 days
- **Blue**: Frozen items
- **Black**: Pantry items with > 6 months shelf life

## Categories

- Deli
- Eggs & Dairy
- Produce
- Freezer
- Pantry
- Meat
- Leftovers

## Development Notes

### MVP Status
- ✅ Core inventory management
- ✅ Receipt scanning (Google Vision API integration)
- ✅ SPOY AI chatbot (OpenAI integration)
- ✅ Color-coded expiration tracking
- ✅ Search and filter
- ✅ Undo functionality
- ✅ In-app notifications
- ⚠️ Roommate sharing (backend ready, frontend pending)
- ⚠️ Authentication (skipped for MVP, using default user_id=1)

### Testing

Backend tests (when implemented):
```bash
cd backend
pytest
```

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repo to Vercel
2. Set build command: `npm run build`
3. Set output directory: `frontend/dist`
4. Add environment variable: `VITE_API_URL=your_backend_url`

### Backend
Deploy to your preferred hosting (Railway, Render, AWS, etc.)
- Set environment variables
- Run database migrations
- Start with: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

## Future Enhancements

- User authentication
- Push notifications
- Recipe saving
- Meal planning
- Shopping list generation
- Barcode scanning
- Multi-language support

## License

MIT

## Team

Rhea Madhogarhia, Paulina DePaulo, Magnus Adams, Veronica Sokoloff, Esslam Ashour
