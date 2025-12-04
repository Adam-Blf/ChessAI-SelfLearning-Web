from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import time
import requests
import os
from ai_engine import ChessEngine, SelfTrainer

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Initialize Engine
engine = ChessEngine()
trainer = SelfTrainer(engine)

# --- Background Tasks ---
def start_background_tasks():
    # 1. Self Training
    trainer.start()

    # 2. Keep Alive
    def keep_alive():
        while True:
            time.sleep(14 * 60) # 14 minutes
            try:
                # Replace with your actual Render URL in production
                url = "http://localhost:5000/ping" 
                if os.environ.get("RENDER_EXTERNAL_URL"):
                    url = os.environ.get("RENDER_EXTERNAL_URL") + "/ping"
                
                requests.get(url)
                print("Keep-alive ping sent.")
            except Exception as e:
                print(f"Keep-alive failed: {e}")

    keep_alive_thread = threading.Thread(target=keep_alive, daemon=True)
    keep_alive_thread.start()

# Start threads only if not in reloader mode (to avoid duplicates during dev)
if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or os.environ.get("RENDER"):
    start_background_tasks()

# --- Routes ---
@app.route('/ping', methods=['GET'])
def ping():
    return "Pong", 200

@app.route('/move', methods=['POST'])
def get_move():
    data = request.json
    fen = data.get('fen')
    target_elo = data.get('elo', 1500)
    
    if not fen:
        return jsonify({"error": "Missing FEN"}), 400

    try:
        best_move = engine.get_move(fen, int(target_elo))
        return jsonify({"move": best_move, "fen": fen})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/', methods=['GET'])
def home():
    return "Chess AI Backend is Running. Use the Frontend to play.", 200

if __name__ == '__main__':
    # On Render, PORT is set by environment
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
