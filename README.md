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
- **Request Tracking** - Redis-based monitoring to manage API costs

## 🚀 Live Demo

**[Play Now](https://ai-hunger-games.vercel.app)**

## 📋 Prerequisites

- **Node.js** (v18+)
- **Python** (v3.9+)
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
python -m venv venv

# Activate virtual environment
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
```

**Create `.env` file:**

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
npm install
```

**Create `.env` file:**

```env
VITE_API_URL=http://localhost:5000
```

### 4️⃣ Redis Setup

**Local Redis:**

```bash
# Mac: brew install redis && brew services start redis
# Ubuntu: sudo apt-get install redis-server && sudo systemctl start redis
# Windows: Download from https://github.com/microsoftarchive/redis/releases
```

**Cloud Redis:** Use [Redis Cloud](https://redis.com/try-free/) or [Upstash](https://upstash.com/) and update `REDIS_URL` in `.env`.

## ▶️ Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python server.py
```
Server starts at `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend starts at `http://localhost:5173`

## 🎯 How to Play

1. **Ask a Question** - Enter any question or scenario
2. **Watch Responses** - Each AI responds in character
3. **Voting Phase** - AIs vote to eliminate disagreeable responses
4. **Elimination** - AI with most votes is eliminated
5. **Victory** - Last AI standing wins!

## 🔧 API Endpoints

- `POST /api/answers` - Generate personality-based responses
- `POST /api/vote` - Generate elimination votes
- `GET /api/status` - Check API usage and limits
- `POST /api/reset-counter` - Reset request counter (admin only)
- `GET /health` - Health check endpoint
- `GET /ping` - Keep-alive endpoint

## 🚢 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add environment variable: `VITE_API_URL`
4. Deploy!

### Backend (Render)

1. Create Web Service on [Render](https://render.com)
2. **Build Command**: `pip install -r requirements.txt`
3. **Start Command**: `gunicorn server:app`
4. Add environment variables: `HF_TOKEN`, `REDIS_URL`, `REQUEST_LIMIT`, `ADMIN_KEY`
5. Deploy!

### Redis

Use [Upstash](https://upstash.com) or [Redis Cloud](https://redis.com), copy connection URL to `REDIS_URL`.

## ⚙️ Configuration

### 🏠 Local Development

**Good news!** When running locally with your own HuggingFace API key:
- ✅ **No built-in rate limits** - Play unlimited games!
- ✅ **Redis is optional** - App works without it (tracking disabled)
- ✅ **You control the costs** - Your API key, your limits

The request tracking is **only for production** to protect deployed public versions from abuse.

### 🚀 Production Limits

- **Total request limit** via Redis (default: 200 requests)
- Auto-disables API when limit reached

**Reset Counter:**
```bash
curl -X POST https://your-api-url.com/api/reset-counter \
  -H "X-Admin-Key: your_admin_key"
```

## 🤖 AI Model

Uses **Mistral-7B-Instruct-v0.2** via HuggingFace's Inference API for fast, character-consistent responses.

## 🎨 Customization

### Add New Personalities

Edit `PERSONALITIES` in `frontend/src/App.jsx`:

```javascript
{ 
  id: 9, 
  name: 'The Comedian', 
  trait: 'Humorous, light-hearted', 
  color: 'bg-red-500', 
  alive: true 
}
```

### Adjust Model Settings

In `backend/server.py`, modify `generate_response()`:

```python
max_tokens=150,      # Response length
temperature=0.8,     # Creativity (0-1)
top_p=0.9           # Diversity
```

## 🐛 Troubleshooting

**Backend won't start:**
- Verify `HF_TOKEN` is set in `.env`
- Check Redis: `redis-cli ping`
- Install dependencies: `pip install -r requirements.txt`

**Frontend shows connection error:**
- Verify backend is running on port 5000
- Check `VITE_API_URL` in frontend `.env`

**Redis connection failed:**
- Verify Redis is running: `redis-cli ping`
- Check `REDIS_URL` in backend `.env`
- App works without Redis (tracking disabled)

## 📝 Contributing

Contributions welcome! Fork, create a feature branch, commit changes, and open a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Suzanne Collins' *The Hunger Games*
- Built with [React](https://react.dev/) and [Flask](https://flask.palletsprojects.com/)
- Powered by [HuggingFace](https://huggingface.co/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## 📧 Contact

**Relacosm** - [@relacosm](https://github.com/relacosm)

**Project Link:** [https://github.com/relacosm/ai_hunger-games](https://github.com/relacosm/ai_hunger-games)

---

⭐ **Star this repo if you enjoyed the AI Hunger Games!** ⭐

*May the odds be ever in your favor!* 🏹
