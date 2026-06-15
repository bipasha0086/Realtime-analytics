import os
import time
import random
from datetime import datetime
from threading import Thread

from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from pymongo import MongoClient
from dotenv import load_dotenv

from models import MetricModel
from routes import create_routes

# Load env variables
load_dotenv()

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# MongoDB connection
# Default to local if env var not provided to prevent crashing on unreachable remote
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/metricdb")

print(f"Connecting to MongoDB at: {MONGO_URI}")
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.server_info() # trigger connection check
    db = client.get_default_database()
    if db.name == 'test':
        db = client['metricdb'] # force db name if not specified in URI
    print('Connected to MongoDB')
except Exception as e:
    print('MongoDB connection error:', e)
    # create a dummy db object so the app doesn't immediately crash if DB is down
    db = client['metricdb']

# Register blueprints
app.register_blueprint(create_routes(db), url_prefix='/api')

metrics_config = {
    'Active Users': {'min': 50, 'max': 200},
    'Transactions': {'min': 10, 'max': 50},
    'Sales': {'min': 1000, 'max': 5000},
    'Response Time': {'min': 100, 'max': 500},
    'Error Rate': {'min': 0, 'max': 5},
    'CPU Usage': {'min': 20, 'max': 80}
}

metric_state = [
    MetricModel.create(name, random.randint(rng['min'], rng['max']))
    for name, rng in metrics_config.items()
]

def simulate_metrics():
    """Background thread to simulate metrics updates every 3 seconds"""
    global metric_state
    while True:
        time.sleep(3)
        updated_state = []
        for metric in metric_state:
            delta = random.randint(-5, 5)
            new_value = max(0, metric['value'] + delta)
            
            new_metric = MetricModel.create(metric['name'], new_value)
            updated_state.append(new_metric)
            
            try:
                db.metrics.insert_one(new_metric.copy())
                # SocketIO emit needs serializable datetime
                emit_data = new_metric.copy()
                if '_id' in emit_data:
                    del emit_data['_id']
                emit_data['timestamp'] = emit_data['timestamp'].isoformat()
                socketio.emit('metric_update', emit_data)
            except Exception as e:
                print('Error saving metric:', e)
        
        metric_state = updated_state

@socketio.on('connect')
def handle_connect():
    print('Client connected:', request.sid)
    serializable_state = []
    for m in metric_state:
        m_copy = m.copy()
        if '_id' in m_copy:
            del m_copy['_id']
        m_copy['timestamp'] = m_copy['timestamp'].isoformat()
        serializable_state.append(m_copy)
    socketio.emit('initial_metrics', serializable_state)

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected:', request.sid)

if __name__ == '__main__':
    # Start background thread
    thread = Thread(target=simulate_metrics, daemon=True)
    thread.start()
    
    port = int(os.environ.get('PORT', 5000))
    print(f"Server running on port {port}")
    socketio.run(app, host='0.0.0.0', port=port)
