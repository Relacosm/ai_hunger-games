# 🎮 AI Hunger Games

**May the Best Algorithm Win!**

A Hunger Games-inspired battle royale where 8 AI personalities compete by answering questions and voting each other off until only one remains victorious.

![AI Hunger Games Banner](https://img.shields.io/badge/AI-Hunger%20Games-amber?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask)
![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python)

## 🌟 Features

- **8 Unique AI Personalities** - Each with distinct traits and perspectives
- **Dynamic Question System** - Ask any question and watch AIs respond in character
- **Elimination Voting** - AIs vote each other off based on answer quality
- **Dystopian Theme** - Capitol-style broadcast interface inspired by Hunger Games
- **Real-time Updates** - Watch answers and votes appear live
- **Rate Limiting** - Fair play with 1 game per 12 hours per IP
- **Request Tracking** - Redis-based monitoring to manage API costs

## 🚀 Live Demo

**[Play Now](https://ai-hunger-games.vercel.app)** | **[Backend API](https://ai-hunger-games.onrender.com)**

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **Redis** (for request tracking)
- **HuggingFace Account** (for API access)

## 🛠️ Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/relacosm/ai_hunger-games.git
cd ai_hunger-games
```

### 2️⃣ Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
touch .env
```

**Configure your `.env` file:**

```env
# HuggingFace API Token (REQUIRED)
HF_TOKEN=your_huggingface_token_here

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Request Limits
REQUEST_LIMIT=200

# Admin Key (for resetting counters)
ADMIN_KEY=your_secret_admin_key
```

**Get your HuggingFace Token:**
1. Go to [HuggingFace Settings](https://huggingface.co/settings/tokens)
2. Create a new token with "Read" permissions
3. Copy and paste it into your `.env` file

### 3️⃣ Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
touch .env
```

**Configure frontend `.env` file:**

```env
VITE_API_URL=http://localhost:5000
```

### 4️⃣ Redis Setup

**Option A: Local Redis (Recommended for Development)**

```bash
# On Mac:
brew install redis
brew services start redis

# On Ubuntu/Debian:
sudo apt-get install redis-server
sudo systemctl start redis

# On Windows:
# Download from: https://github.com/microsoftarchive/redis/releases
```

**Option B: Cloud Redis (Production)**

Use [Redis Cloud](https://redis.com/try-free/) or [Upstash](https://upstash.com/) and update `REDIS_URL` in your `.env` file.

## ▶️ Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python server.py
```

Server will start at `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Frontend will start at `http://localhost:5173`

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

**Backend:**
```bash
cd backend
gunicorn server:app --bind 0.0.0.0:5000
```

## 🎯 How to Play

1. **Start the Game** - Visit the application URL
2. **Ask a Question** - Enter any question or scenario for the AI personalities
3. **Watch Responses** - Each AI responds according to their personality trait
4. **Voting Phase** - AIs vote to eliminate the response they disagree with most
5. **Elimination** - The AI with the most votes is eliminated
6. **Victory** - Last AI standing wins the Hunger Games!

## 🏗️ Project Structure

```
ai_hunger-games/
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React component
│   │   ├── main.jsx         # React entry point
│   │   └── index.css        # Tailwind styles
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── server.py            # Flask API server
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables
└── README.md
```

## 🔧 API Endpoints

### `POST /api/answers`
Generate personality-based responses to a question.

**Request:**
```json
{
  "question": "What is the meaning of life?",
  "personalities": [
    {"id": 1, "name": "The Philosopher", "trait": "Deep thinker"}
  ]
}
```

**Response:**
```json
{
  "responses": [
    {"id": 1, "answer": "Life's meaning is found in..."}
  ]
}
```

### `POST /api/vote`
Generate elimination votes from each AI.

**Request:**
```json
{
  "question": "original question",
  "responses": [
    {"id": 1, "answer": "response text"}
  ]
}
```

**Response:**
```json
{
  "votes": [
    {
      "voter": 1,
      "votedFor": 3,
      "reason": "Their logic is flawed"
    }
  ]
}
```

### `GET /api/status`
Check API usage and request limits.

### `GET /health`
Health check endpoint.

## 🚢 Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variable:
   - `VITE_API_URL`: Your backend URL
5. Deploy!

### Backend (Render)

1. Go to [Render](https://render.com)
2. Create new Web Service
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn server:app`
5. Add environment variables:
   - `HF_TOKEN`
   - `REDIS_URL` (use Render's Redis or external service)
   - `REQUEST_LIMIT`
   - `ADMIN_KEY`
6. Deploy!

### Redis (Upstash/Redis Cloud)

1. Create account at [Upstash](https://upstash.com) or [Redis Cloud](https://redis.com)
2. Create new Redis database
3. Copy connection URL
4. Update `REDIS_URL` in your backend `.env`

## ⚙️ Configuration

### 🏠 Local Development (No Limits!)

**Good news!** When running locally, you're using **your own HuggingFace API key**, so you can:
- ✅ **Remove all rate limits** - Play unlimited games!
- ✅ **Skip Redis setup** - Request tracking is optional for local dev
- ✅ **Disable the 12-hour limit** - Test as much as you want

**To disable rate limiting for local development:**

In `backend/server.py`, comment out or remove the rate limiter decorator:

```python
@app.route('/api/answers', methods=['POST'])
# @limiter.limit("1 per 12 hours")  # <-- Comment this line out!
def get_answers():
    # ... rest of the code
```

Or change it to something more generous:

```python
@limiter.limit("100 per hour")  # Much more relaxed for testing
```

**Why the limits exist:**
- The rate limits and request tracking are **only for production/deployment**
- They protect the **deployed public version** from expensive API overuse
- Since you're paying for your own HuggingFace API calls locally, **you control the limits**!

### 🚀 Production Rate Limiting

For deployed versions, rate limiting prevents abuse and manages costs:
- **1 game per 12 hours** per IP address (configurable in `server.py`)
- **Total request limit** via Redis (default: 200 requests)
- Auto-disables API when limit reached

**Reset Production Counter:**
```bash
curl -X POST https://your-api-url.com/api/reset-counter \
  -H "X-Admin-Key: your_admin_key"
```

## 🤖 AI Model

The app uses **Mistral-7B-Instruct-v0.2** via HuggingFace's Inference API:
- Fast response times
- Character-consistent personalities
- Contextual voting decisions

## 🎨 Customization

### Add New Personalities

Edit `PERSONALITIES` array in `frontend/src/App.jsx`:

```javascript
const PERSONALITIES = [
  { 
    id: 9, 
    name: 'The Comedian', 
    trait: 'Humorous, light-hearted', 
    color: 'bg-red-500', 
    alive: true 
  },
  // ... more personalities
];
```

### Adjust Model Settings

In `backend/server.py`, modify `generate_response()`:

```python
completion = client.chat.completions.create(
    model=MODEL_ID,
    max_tokens=150,      # Response length
    temperature=0.8,      # Creativity (0-1)
    top_p=0.9            # Diversity
)
```

## 🐛 Troubleshooting

### Backend won't start
- Verify `HF_TOKEN` is set in `.env`
- Check Redis is running: `redis-cli ping`
- Ensure all dependencies installed: `pip install -r requirements.txt`

### Frontend shows "Error connecting to server"
- Verify backend is running on port 5000
- Check `VITE_API_URL` in frontend `.env`
- Look for CORS errors in browser console

### Rate limit errors
- Wait 12 hours between games
- Or reset counter with admin key
- Check IP isn't behind proxy affecting rate limiting

### Redis connection failed
- Verify Redis is running: `redis-cli ping`
- Check `REDIS_URL` in backend `.env`
- App will work without Redis (tracking disabled)

## 📝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Suzanne Collins' *The Hunger Games*
- Built with [React](https://react.dev/) and [Flask](https://flask.palletsprojects.com/)
- Powered by [HuggingFace](https://huggingface.co/) AI models
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## 📧 Contact

**Relacosm** - [@relacosm](https://github.com/relacosm)

**Project Link:** [https://github.com/relacosm/ai_hunger-games](https://github.com/relacosm/ai_hunger-games)

---

⭐ **Star this repo if you enjoyed the AI Hunger Games!** ⭐

*May the odds be ever in your favor!* 🏹
