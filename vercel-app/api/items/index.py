from http.server import BaseHTTPRequestHandler
import json
import os
from pymongo import MongoClient
from urllib.parse import urlparse, parse_qs
import uuid
from datetime import datetime

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
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            
            query = {}
            if 'type' in params:
                query['type'] = params['type'][0]
            
            items = list(db.items.find(query, {'_id': 0}).sort('createdAt', -1))
            # Convert datetime to string
            for item in items:
                if 'createdAt' in item and isinstance(item['createdAt'], datetime):
                    item['createdAt'] = item['createdAt'].isoformat()
            response = items
        except Exception as e:
            response = {"error": str(e)}
        
        self.wfile.write(json.dumps(response).encode())
        return

    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)
            
            db = get_db()
            item = {
                "id": str(uuid.uuid4()),
                "name": data.get('name', ''),
                "amount": float(data.get('amount', 0)),
                "currency": "DKK",
                "type": data.get('type', 'cart'),
                "paidBy": data.get('paidBy'),
                "isDivided": data.get('isDivided', False),
                "createdAt": datetime.utcnow(),
                "createdBy": data.get('createdBy', '')
            }
            
            db.items.insert_one(item)
            item['_id'] = str(item.get('_id', ''))
            item['createdAt'] = item['createdAt'].isoformat()
            del item['_id']
            response = item
        except Exception as e:
            response = {"error": str(e)}
        
        self.wfile.write(json.dumps(response).encode())
        return
