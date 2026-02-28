from http.server import BaseHTTPRequestHandler
import json
import os
from pymongo import MongoClient
import uuid

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

    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        try:
            db = get_db()
            users_to_create = ["Matias", "Agustina"]
            created_users = []
            
            for name in users_to_create:
                existing = db.users.find_one({"name": name})
                if existing:
                    existing['_id'] = str(existing['_id'])
                    created_users.append(existing)
                else:
                    user_obj = {"id": str(uuid.uuid4()), "name": name}
                    db.users.insert_one(user_obj)
                    created_users.append({"id": user_obj["id"], "name": name})
            
            response = {"users": created_users}
        except Exception as e:
            response = {"error": str(e)}
        
        self.wfile.write(json.dumps(response).encode())
        return
