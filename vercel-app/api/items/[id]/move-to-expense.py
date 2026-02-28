from http.server import BaseHTTPRequestHandler
import json
import os
from pymongo import MongoClient
from urllib.parse import urlparse, parse_qs
from datetime import datetime

def get_db():
    mongo_url = os.environ.get('MONGO_URL', '')
    client = MongoClient(mongo_url)
    return client['shared_expenses']

def get_item_id(path):
    # Path: /api/items/abc123/move-to-expense?paid_by=xyz
    parts = path.split('/')
    for i, part in enumerate(parts):
        if part == 'items' and i + 1 < len(parts):
            return parts[i + 1]
    return None

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        return

    def do_PUT(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        try:
            db = get_db()
            item_id = get_item_id(self.path)
            
            # Get paid_by from query string
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            paid_by = params.get('paid_by', [None])[0]
            
            item = db.items.find_one({"id": item_id})
            if item:
                db.items.update_one(
                    {"id": item_id}, 
                    {"$set": {"type": "expense", "paidBy": paid_by}}
                )
                
                updated_item = db.items.find_one({"id": item_id}, {'_id': 0})
                if 'createdAt' in updated_item and isinstance(updated_item['createdAt'], datetime):
                    updated_item['createdAt'] = updated_item['createdAt'].isoformat()
                response = updated_item
            else:
                response = {"error": "Item not found"}
        except Exception as e:
            response = {"error": str(e)}
        
        self.wfile.write(json.dumps(response).encode())
        return
