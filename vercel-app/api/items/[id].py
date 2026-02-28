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
    # Extract item ID from path like /api/items/abc123
    parts = path.split('/')
    # Remove query string if present
    item_id = parts[-1].split('?')[0]
    return item_id

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
            item_id = get_item_id(self.path)
            item = db.items.find_one({"id": item_id}, {'_id': 0})
            if item:
                if 'createdAt' in item and isinstance(item['createdAt'], datetime):
                    item['createdAt'] = item['createdAt'].isoformat()
                response = item
            else:
                response = {"error": "Item not found"}
        except Exception as e:
            response = {"error": str(e)}
        
        self.wfile.write(json.dumps(response).encode())
        return

    def do_PUT(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        try:
            db = get_db()
            item_id = get_item_id(self.path)
            
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length) if content_length > 0 else b'{}'
            data = json.loads(body) if body else {}
            
            # Build update
            update_data = {}
            for key in ['name', 'amount', 'type', 'paidBy', 'isDivided']:
                if key in data:
                    update_data[key] = data[key]
            
            if update_data:
                db.items.update_one({"id": item_id}, {"$set": update_data})
            
            item = db.items.find_one({"id": item_id}, {'_id': 0})
            if item:
                if 'createdAt' in item and isinstance(item['createdAt'], datetime):
                    item['createdAt'] = item['createdAt'].isoformat()
                response = item
            else:
                response = {"error": "Item not found"}
        except Exception as e:
            response = {"error": str(e)}
        
        self.wfile.write(json.dumps(response).encode())
        return

    def do_DELETE(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        try:
            db = get_db()
            item_id = get_item_id(self.path)
            result = db.items.delete_one({"id": item_id})
            if result.deleted_count > 0:
                response = {"message": "Item deleted successfully"}
            else:
                response = {"error": "Item not found"}
        except Exception as e:
            response = {"error": str(e)}
        
        self.wfile.write(json.dumps(response).encode())
        return
