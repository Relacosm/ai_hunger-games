from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from openai import OpenAI
import random
import time
import redis
from werkzeug.middleware.proxy_fix import ProxyFix
from functools import wraps

# Load environment variables
load_dotenv()

app = Flask(__name__)

app.wsgi_app = ProxyFix(
    app.wsgi_app, 
    x_for=1, 
    x_proto=1, 
    x_host=1, 
    x_prefix=1
)

# Replace 'CORS(app)' with this:
CORS(app, 
    resources={r"/api/*": {
        "origins": [
            "https://ai-hunger-games.vercel.app",  # Your actual Vercel Production URL
            "https://ai-hunger-games.relacosm.tech",
            "http://localhost:5173"              # Your local development URL
        ]
    }},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "Retry-After"]
)

# Redis setup for request tracking
redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
try:
    redis_client = redis.from_url(redis_url, decode_responses=True)
    redis_client.ping()  # Test connection
    print("✓ Redis connected successfully")
except Exception as e:
    print(f"⚠️  Redis connection failed: {e}")
    print("Request tracking will be disabled")
    redis_client = None

REQUEST_LIMIT = int(os.getenv('REQUEST_LIMIT', 200))
RATE_LIMIT_WINDOW = 12 * 60 * 60  # 12 hours in seconds

def get_client_ip():
    """Get the client's IP address"""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    return request.remote_addr

def check_rate_limit(ip_address):
    """Check if IP has exceeded rate limit"""
    if not redis_client:
        return True, 0, RATE_LIMIT_WINDOW
    
    try:
        key = f"rate_limit:{ip_address}"
        current = redis_client.get(key)
        
        if current is None:
            # First request from this IP
            redis_client.setex(key, RATE_LIMIT_WINDOW, 1)
            return True, 1, RATE_LIMIT_WINDOW
        
        current = int(current)
        if current >= 1:  # Only 1 game per 12 hours
            ttl = redis_client.ttl(key)
            return False, current, ttl
        
        # Increment counter
        redis_client.incr(key)
        return True, current + 1, redis_client.ttl(key)
        
    except Exception as e:
        print(f"Redis rate limit error: {e}")
        return True, 0, RATE_LIMIT_WINDOW

def rate_limit_decorator(f):
    """Decorator to apply rate limiting to routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        ip = get_client_ip()
        allowed, count, ttl = check_rate_limit(ip)
        
        if not allowed:
            hours = ttl // 3600
            minutes = (ttl % 3600) // 60
            retry_after = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
            
            return jsonify({
                'error': 'Rate limit exceeded',
                'message': 'You can only play one game every 12 hours. Please try again later.',
                'retry_after': retry_after,
                'retry_after_seconds': ttl
            }), 429
        
        return f(*args, **kwargs)
    
    return decorated_function

def increment_and_check():
    """Increment counter and check if limit reached"""
    if not redis_client:
        return True, 0  # Allow if Redis not available
    
    try:
        # Check if disabled
        if redis_client.get('api_disabled') == 'true':
            count = int(redis_client.get('request_count') or 0)
            return False, count
        
        # Increment counter
        count = redis_client.incr('request_count')
        
        if count >= REQUEST_LIMIT:
            redis_client.set('api_disabled', 'true')
            print(f"\n⚠️ REQUEST LIMIT REACHED! API disabled after {count} requests\n")
            return False, count
        
        return True, count
    except Exception as e:
        print(f"Redis error: {e}")
        return True, 0  # Allow if Redis fails

# Get HuggingFace API key from environment
HF_API_KEY = os.getenv('HF_TOKEN')
if not HF_API_KEY:
    raise ValueError("HF_TOKEN not found in environment variables! Please add it to your .env file")

# Initialize OpenAI client with HuggingFace endpoint
client = OpenAI(
    base_url="https://router.huggingface.co/v1",
    api_key=HF_API_KEY
)

# Model to use
MODEL_ID = "mistralai/Mistral-7B-Instruct-v0.2:featherless-ai"

def generate_response(prompt, max_tokens=150, temperature=0.8, retry=3):
    """Generate a response using HuggingFace Inference API via OpenAI client"""
    
    for attempt in range(retry):
        try:
            completion = client.chat.completions.create(
                model=MODEL_ID,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=0.9
            )
            
            response = completion.choices[0].message.content.strip()
            return response
            
        except Exception as e:
            print(f"Error generating response (attempt {attempt + 1}/{retry}): {e}")
            if "loading" in str(e).lower():
                print("Model is loading, waiting...")
                time.sleep(10)
            elif attempt < retry - 1:
                time.sleep(2)
            else:
                return "I'm having trouble responding right now."
    
    return "I need a moment to think about this."

@app.route('/api/answers', methods=['POST'])
@rate_limit_decorator
def get_answers():
    """Generate answers from each AI personality"""
    
    # Check request limit
    allowed, count = increment_and_check()
    if not allowed:
        return jsonify({
            'error': 'Service temporarily unavailable',
            'message': f'API request limit reached ({REQUEST_LIMIT} requests). Please contact administrator.',
            'requests_used': count
        }), 503
    
    data = request.json
    question = data['question']
    personalities = data['personalities']
    
    responses = []
    
    for person in personalities:
        # Create a personality-specific prompt
        prompt = f"""You are {person['name']}, an AI personality with this trait: {person['trait']}.

Question: {question}

Respond as {person['name']} in 2-3 sentences, reflecting your personality trait. Be concise and stay in character."""
        
        answer = generate_response(prompt, max_tokens=100, temperature=0.85)
        
        # Clean up the answer
        if answer:
            # Take first 2-3 sentences
            sentences = answer.split('.')
            if len(sentences) > 3:
                answer = '.'.join(sentences[:3]) + '.'
        
        if not answer or len(answer) < 15:
            # Fallback response based on personality
            fallbacks = {
                "The Philosopher": "This question touches the very essence of existence. We must examine it through multiple lenses of understanding.",
                "The Pragmatist": "Let's focus on practical solutions here. What matters most is what actually works in practice.",
                "The Optimist": "I see great potential in this! Every challenge is an opportunity for growth and positive change.",
                "The Skeptic": "I question the premise of this question. We need more evidence before drawing conclusions.",
                "The Empath": "I sense there are deeper emotional layers here. We should consider how this affects everyone involved.",
                "The Rebel": "Why accept the conventional answer? Let's challenge the status quo and think differently.",
                "The Analyst": "Based on logical analysis, we need to examine the data and metrics systematically.",
                "The Visionary": "Looking toward the future, this could lead to innovative and transformative possibilities."
            }
            answer = fallbacks.get(person['name'], "Let me consider this carefully and provide my perspective.")
        
        responses.append({
            'id': person['id'],
            'answer': answer
        })
        
        # Small delay to avoid rate limiting
        time.sleep(0.3)
    
    return jsonify({'responses': responses})

@app.route('/api/vote', methods=['POST'])
def get_votes():
    """Generate votes from each AI personality"""
    
    # Check request limit
    allowed, count = increment_and_check()
    if not allowed:
        return jsonify({
            'error': 'Service temporarily unavailable',
            'message': f'API request limit reached ({REQUEST_LIMIT} requests). Please contact administrator.',
            'requests_used': count
        }), 503
    
    data = request.json
    question = data['question']
    responses = data['responses']
    
    votes = []
    response_map = {r['id']: r['answer'] for r in responses}
    
    for voter in responses:
        voter_id = voter['id']
        
        # Build context of other responses
        other_responses = "\n".join([
            f"AI {r['id']}: {r['answer']}"
            for r in responses if r['id'] != voter_id
        ])
        
        prompt = f"""You are AI personality {voter_id}. You must vote to eliminate ONE other AI whose answer you most disagree with.

Question was: {question}

Your answer: {voter['answer']}

Other AI responses:
{other_responses}

Vote to eliminate the AI whose answer contradicts your perspective the most. Respond in exactly this format:
Vote: [number between 1-8, not {voter_id}]
Reason: [one brief sentence explaining why]

Do not vote for yourself (AI {voter_id})."""
        
        vote_response = generate_response(prompt, max_tokens=80, temperature=0.7)
        
        # Parse the vote
        try:
            voted_for = None
            reason = "Their perspective differs from mine"
            
            # Extract vote number
            import re
            vote_match = re.search(r'Vote:\s*(\d+)', vote_response, re.IGNORECASE)
            if vote_match:
                potential_vote = int(vote_match.group(1))
                if potential_vote != voter_id and potential_vote in response_map:
                    voted_for = potential_vote
            
            # Extract reason
            reason_match = re.search(r'Reason:\s*(.+?)(?:\n|$)', vote_response, re.IGNORECASE)
            if reason_match:
                reason = reason_match.group(1).strip()
                # Limit reason length
                if len(reason) > 100:
                    reason = reason[:97] + "..."
            
            # If no valid vote found, vote randomly (excluding self)
            if voted_for is None:
                valid_targets = [r['id'] for r in responses if r['id'] != voter_id]
                voted_for = random.choice(valid_targets)
                reason = "I fundamentally disagree with their approach"
            
            votes.append({
                'voter': voter_id,
                'votedFor': voted_for,
                'reason': reason
            })
            
        except Exception as e:
            print(f"Error parsing vote from AI {voter_id}: {e}")
            print(f"Response was: {vote_response}")
            # Fallback: random vote
            valid_targets = [r['id'] for r in responses if r['id'] != voter_id]
            votes.append({
                'voter': voter_id,
                'votedFor': random.choice(valid_targets),
                'reason': "Our perspectives are incompatible"
            })
        
        # Small delay to avoid rate limiting
        time.sleep(0.3)
    
    return jsonify({'votes': votes})

@app.route('/api/status', methods=['GET'])
def api_status():
    """Check API usage status"""
    if not redis_client:
        return jsonify({
            'error': 'Redis not configured',
            'message': 'Request tracking is disabled'
        }), 503
    
    try:
        count = int(redis_client.get('request_count') or 0)
        disabled = redis_client.get('api_disabled') == 'true'
        
        return jsonify({
            'requests_used': count,
            'request_limit': REQUEST_LIMIT,
            'remaining': max(0, REQUEST_LIMIT - count),
            'disabled': disabled,
            'percentage_used': round((count / REQUEST_LIMIT) * 100, 2)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reset-counter', methods=['POST'])
def reset_counter():
    """Reset request counter (for admin use)"""
    if not redis_client:
        return jsonify({'error': 'Redis not configured'}), 503
    
    # Simple auth - check for admin key
    admin_key = request.headers.get('X-Admin-Key')
    if admin_key != os.getenv('ADMIN_KEY'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        redis_client.set('request_count', 0)
        redis_client.set('api_disabled', 'false')
        return jsonify({'message': 'Counter reset successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model': MODEL_ID,
        'api_key_configured': bool(HF_API_KEY),
        'redis_connected': redis_client is not None,
        'request_limit': REQUEST_LIMIT
    })

@app.route('/ping', methods=['GET'])
def ping():
    """Cron job endpoint to keep server awake - returns immediately"""
    return jsonify({
        'status': 'alive',
        'timestamp': time.time()
    }), 200

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🎮 AI Hunger Games Server Started!")
    print("="*50)
    print(f"Model: {MODEL_ID}")
    print(f"API Key: {'✓ Configured' if HF_API_KEY else '✗ Missing'}")
    print(f"Redis: {'✓ Connected' if redis_client else '✗ Not Connected'}")
    print(f"Request Limit: {REQUEST_LIMIT}")
    print(f"Rate Limit: 1 game per 12 hours per IP")
    print(f"Server: http://localhost:5000")
    print("="*50 + "\n")
    
    if not HF_API_KEY:
        print("⚠️  WARNING: HF_TOKEN not found!")
        print("Please create a .env file with: HF_TOKEN=your_key_here\n")
    
    app.run(debug=True, port=5000, host='0.0.0.0')
