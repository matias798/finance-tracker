from http.server import BaseHTTPRequestHandler
import json
import os
from pymongo import MongoClient

def get_db():
    mongo_url = os.environ.get('MONGO_URL', '')
    client = MongoClient(mongo_url)
    return client['shared_expenses']

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        return

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        try:
            db = get_db()
            users = list(db.users.find({}, {'_id': 0}))
            response = users
        except Exception as e:
            response = {"error": str(e)}
        
        self.wfile.write(json.dumps(response).encode())
        return
