#!/usr/bin/env python3
"""
Backend API Testing for Shared Expense Tracker
Tests all API endpoints as specified in the review request.
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Use the actual backend URL from frontend environment
BASE_URL = "https://shared-expense-log.preview.emergentagent.com/api"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        self.users = {}
        self.items = {}
        
    def test_endpoint(self, method: str, endpoint: str, data: Optional[Dict] = None, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Test an API endpoint and return the result"""
        url = f"{BASE_URL}{endpoint}"
        
        try:
            if method == "GET":
                response = self.session.get(url, params=params)
            elif method == "POST":
                response = self.session.post(url, json=data, params=params)
            elif method == "PUT":
                response = self.session.put(url, json=data, params=params)
            elif method == "DELETE":
                response = self.session.delete(url, params=params)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return {
                'status_code': response.status_code,
                'success': response.status_code < 400,
                'response': response.json() if response.content else {},
                'url': url,
                'method': method
            }
        except requests.exceptions.RequestException as e:
            return {
                'status_code': 0,
                'success': False,
                'error': str(e),
                'url': url,
                'method': method
            }
        except json.JSONDecodeError:
            return {
                'status_code': response.status_code,
                'success': response.status_code < 400,
                'response': response.text,
                'url': url,
                'method': method
            }

    def test_health_check(self):
        """Test basic API health"""
        print("🔍 Testing API Health Check...")
        result = self.test_endpoint("GET", "/")
        
        if result['success']:
            print("✅ API is accessible")
            print(f"   Response: {result['response']}")
        else:
            print("❌ API health check failed")
            if 'error' in result:
                print(f"   Error: {result['error']}")
            else:
                print(f"   Status: {result['status_code']}")
        
        return result['success']

    def test_users_init(self):
        """Test 1: POST /api/users/init - Initialize users"""
        print("\n🔍 Test 1: POST /api/users/init - Initialize users (Matias and Agustina)")
        result = self.test_endpoint("POST", "/users/init")
        
        if result['success']:
            users_data = result['response']
            if 'users' in users_data and len(users_data['users']) == 2:
                self.users = {user['name']: user for user in users_data['users']}
                print("✅ Users initialized successfully")
                print(f"   Created: {list(self.users.keys())}")
                for name, user in self.users.items():
                    print(f"   {name}: ID = {user['id']}")
                return True
            else:
                print("❌ Unexpected response format")
                print(f"   Response: {users_data}")
        else:
            print("❌ Failed to initialize users")
            if 'error' in result:
                print(f"   Error: {result['error']}")
            else:
                print(f"   Status: {result['status_code']}, Response: {result['response']}")
        
        return False

    def test_get_users(self):
        """Test 2: GET /api/users - Get all users"""
        print("\n🔍 Test 2: GET /api/users - Get all users")
        result = self.test_endpoint("GET", "/users")
        
        if result['success']:
            users = result['response']
            if isinstance(users, list) and len(users) >= 2:
                print("✅ Successfully retrieved users")
                print(f"   Found {len(users)} users:")
                for user in users:
                    print(f"   - {user.get('name', 'Unknown')}: {user.get('id', 'No ID')}")
                return True
            else:
                print("❌ Unexpected users format or insufficient users")
                print(f"   Response: {users}")
        else:
            print("❌ Failed to get users")
            if 'error' in result:
                print(f"   Error: {result['error']}")
            else:
                print(f"   Status: {result['status_code']}, Response: {result['response']}")
        
        return False

    def test_create_cart_item(self):
        """Test 3: POST /api/items - Create a cart item"""
        print("\n🔍 Test 3: POST /api/items - Create a cart item")
        
        if not self.users:
            print("❌ Cannot create item - no users available")
            return False
            
        # Use Matias as the creator
        matias_id = self.users.get('Matias', {}).get('id')
        if not matias_id:
            print("❌ Matias user not found")
            return False
        
        item_data = {
            "name": "Premium Coffee Beans",
            "amount": 125.75,
            "type": "cart",
            "createdBy": matias_id
        }
        
        result = self.test_endpoint("POST", "/items", data=item_data)
        
        if result['success']:
            item = result['response']
            if item.get('id') and item.get('name') == "Premium Coffee Beans":
                self.items['test_item'] = item
                print("✅ Cart item created successfully")
                print(f"   Item ID: {item['id']}")
                print(f"   Name: {item['name']}")
                print(f"   Amount: {item['amount']} {item.get('currency', 'DKK')}")
                print(f"   Type: {item['type']}")
                print(f"   Created By: {item['createdBy']}")
                return True
            else:
                print("❌ Unexpected item format")
                print(f"   Response: {item}")
        else:
            print("❌ Failed to create cart item")
            if 'error' in result:
                print(f"   Error: {result['error']}")
            else:
                print(f"   Status: {result['status_code']}, Response: {result['response']}")
        
        return False

    def test_get_cart_items(self):
        """Test 4: GET /api/items?type=cart - Get cart items"""
        print("\n🔍 Test 4: GET /api/items?type=cart - Get cart items")
        
        result = self.test_endpoint("GET", "/items", params={"type": "cart"})
        
        if result['success']:
            items = result['response']
            if isinstance(items, list):
                cart_items = [item for item in items if item.get('type') == 'cart']
                print(f"✅ Successfully retrieved cart items")
                print(f"   Found {len(cart_items)} cart items")
                for item in cart_items[:3]:  # Show first 3
                    print(f"   - {item.get('name')}: {item.get('amount')} {item.get('currency', 'DKK')}")
                return True
            else:
                print("❌ Unexpected response format")
                print(f"   Response: {items}")
        else:
            print("❌ Failed to get cart items")
            if 'error' in result:
                print(f"   Error: {result['error']}")
            else:
                print(f"   Status: {result['status_code']}, Response: {result['response']}")
        
        return False

    def test_move_to_expense(self):
        """Test 5: PUT /api/items/{item_id}/move-to-expense?paid_by={user_id} - Move item to expense"""
        print("\n🔍 Test 5: PUT /api/items/{item_id}/move-to-expense?paid_by={user_id} - Move item to expense")
        
        if not self.items.get('test_item'):
            print("❌ No test item available to move to expense")
            return False
            
        if not self.users:
            print("❌ No users available")
            return False
        
        item_id = self.items['test_item']['id']
        agustina_id = self.users.get('Agustina', {}).get('id')
        
        if not agustina_id:
            print("❌ Agustina user not found")
            return False
        
        result = self.test_endpoint("PUT", f"/items/{item_id}/move-to-expense", 
                                   params={"paid_by": agustina_id})
        
        if result['success']:
            updated_item = result['response']
            if updated_item.get('type') == 'expense' and updated_item.get('paidBy') == agustina_id:
                self.items['test_item'] = updated_item  # Update our reference
                print("✅ Item successfully moved to expense")
                print(f"   Item ID: {updated_item['id']}")
                print(f"   Type: {updated_item['type']}")
                print(f"   Paid By: {updated_item['paidBy']}")
                return True
            else:
                print("❌ Item not properly updated")
                print(f"   Response: {updated_item}")
        else:
            print("❌ Failed to move item to expense")
            if 'error' in result:
                print(f"   Error: {result['error']}")
            else:
                print(f"   Status: {result['status_code']}, Response: {result['response']}")
        
        return False

    def test_get_expense_items(self):
        """Test 6: GET /api/items?type=expense - Get expense items"""
        print("\n🔍 Test 6: GET /api/items?type=expense - Get expense items")
        
        result = self.test_endpoint("GET", "/items", params={"type": "expense"})
        
        if result['success']:
            items = result['response']
            if isinstance(items, list):
                expense_items = [item for item in items if item.get('type') == 'expense']
                print(f"✅ Successfully retrieved expense items")
                print(f"   Found {len(expense_items)} expense items")
                for item in expense_items[:3]:  # Show first 3
                    paid_by_name = "Unknown"
                    for name, user in self.users.items():
                        if user.get('id') == item.get('paidBy'):
                            paid_by_name = name
                            break
                    print(f"   - {item.get('name')}: {item.get('amount')} {item.get('currency', 'DKK')} (Paid by: {paid_by_name})")
                return True
            else:
                print("❌ Unexpected response format")
                print(f"   Response: {items}")
        else:
            print("❌ Failed to get expense items")
            if 'error' in result:
                print(f"   Error: {result['error']}")
            else:
                print(f"   Status: {result['status_code']}, Response: {result['response']}")
        
        return False

    def test_toggle_divided(self):
        """Test 7: PUT /api/items/{item_id}/toggle-divided - Toggle the divided status"""
        print("\n🔍 Test 7: PUT /api/items/{item_id}/toggle-divided - Toggle the divided status")
        
        if not self.items.get('test_item'):
            print("❌ No test item available to toggle divided status")
            return False
        
        item_id = self.items['test_item']['id']
        original_divided = self.items['test_item'].get('isDivided', False)
        
        result = self.test_endpoint("PUT", f"/items/{item_id}/toggle-divided")
        
        if result['success']:
            updated_item = result['response']
            new_divided = updated_item.get('isDivided')
            if new_divided != original_divided:
                self.items['test_item'] = updated_item  # Update our reference
                print("✅ Divided status toggled successfully")
                print(f"   Item ID: {updated_item['id']}")
                print(f"   Original isDivided: {original_divided}")
                print(f"   New isDivided: {new_divided}")
                return True
            else:
                print("❌ Divided status not properly toggled")
                print(f"   Original: {original_divided}, New: {new_divided}")
        else:
            print("❌ Failed to toggle divided status")
            if 'error' in result:
                print(f"   Error: {result['error']}")
            else:
                print(f"   Status: {result['status_code']}, Response: {result['response']}")
        
        return False

    def test_delete_item(self):
        """Test 8: DELETE /api/items/{item_id} - Delete the item"""
        print("\n🔍 Test 8: DELETE /api/items/{item_id} - Delete the item")
        
        if not self.items.get('test_item'):
            print("❌ No test item available to delete")
            return False
        
        item_id = self.items['test_item']['id']
        
        result = self.test_endpoint("DELETE", f"/items/{item_id}")
        
        if result['success']:
            response = result['response']
            if isinstance(response, dict) and 'message' in response:
                print("✅ Item deleted successfully")
                print(f"   Message: {response['message']}")
                
                # Verify the item is actually deleted by trying to get it
                verify_result = self.test_endpoint("GET", f"/items/{item_id}")
                if verify_result['status_code'] == 404:
                    print("✅ Verified: Item no longer exists")
                    del self.items['test_item']  # Remove from our reference
                    return True
                else:
                    print("❌ Warning: Item still exists after deletion")
                    return False
            else:
                print("❌ Unexpected deletion response")
                print(f"   Response: {response}")
        else:
            print("❌ Failed to delete item")
            if 'error' in result:
                print(f"   Error: {result['error']}")
            else:
                print(f"   Status: {result['status_code']}, Response: {result['response']}")
        
        return False

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Shared Expense Tracker Backend API Tests")
        print(f"📍 Base URL: {BASE_URL}")
        print("=" * 70)
        
        results = []
        
        # Health check first
        if not self.test_health_check():
            print("\n❌ API is not accessible. Stopping tests.")
            return False
        
        # Run all API tests
        test_methods = [
            self.test_users_init,
            self.test_get_users,
            self.test_create_cart_item,
            self.test_get_cart_items,
            self.test_move_to_expense,
            self.test_get_expense_items,
            self.test_toggle_divided,
            self.test_delete_item
        ]
        
        for test_method in test_methods:
            try:
                result = test_method()
                results.append(result)
            except Exception as e:
                print(f"\n❌ Test {test_method.__name__} failed with exception: {str(e)}")
                results.append(False)
        
        # Print summary
        print("\n" + "=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        
        passed = sum(results)
        total = len(results)
        
        print(f"✅ Passed: {passed}/{total}")
        print(f"❌ Failed: {total - passed}/{total}")
        
        if passed == total:
            print("🎉 All tests passed! Backend API is working correctly.")
        else:
            print("⚠️  Some tests failed. Check the output above for details.")
        
        return passed == total

def main():
    """Main function to run the tests"""
    tester = APITester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()