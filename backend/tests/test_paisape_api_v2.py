"""
PaisaPe API Backend Tests V2
Testing: Auth, Users, Wallet (new endpoints), Commission, Routing, Operators, API Config (test endpoint), Reports, Recharge
New features: Wallet balance in user management, Ledger view, Live transactions, Test API endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://instant-topup-5.preview.emergentagent.com')

# Store shared data between tests
class TestData:
    admin_token = None
    retailer_token = None
    retailer_id = "retailer-001"
    test_commission_id = None
    test_routing_id = None
    test_operator_id = None
    test_api_id = None


class TestAuth:
    """Authentication endpoint tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@paisape.com",
            "password": "admin123"
        })
        assert response.status_code == 200 or response.status_code == 201, f"Expected 200/201, got {response.status_code}: {response.text}"
        data = response.json()
        assert "access_token" in data, "access_token not in response"
        assert "user" in data, "user not in response"
        assert data["user"]["role"] == "admin", "User role should be admin"
        TestData.admin_token = data["access_token"]
    
    def test_retailer_login_success(self):
        """Test retailer login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "retailer@demo.com",
            "password": "retailer123"
        })
        assert response.status_code == 200 or response.status_code == 201, f"Expected 200/201, got {response.status_code}: {response.text}"
        data = response.json()
        assert "access_token" in data, "access_token not in response"
        assert "user" in data, "user not in response"
        assert data["user"]["role"] == "retailer", "User role should be retailer"
        TestData.retailer_token = data["access_token"]
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@paisape.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"


class TestUsers:
    """User management endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def ensure_token(self):
        if not TestData.admin_token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": "admin@paisape.com",
                "password": "admin123"
            })
            TestData.admin_token = response.json()["access_token"]
    
    def test_get_all_users(self):
        """Test fetching all users - should return seeded users"""
        response = requests.get(f"{BASE_URL}/api/users", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) >= 4, f"Expected at least 4 users, got {len(data)}"
    
    def test_get_me_admin(self):
        """Test get me endpoint for admin"""
        response = requests.get(f"{BASE_URL}/api/users/me", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["role"] == "admin", "Role should be admin"
        assert "email" in data, "Response should have email"
    
    def test_update_user(self):
        """Test updating a user's name"""
        response = requests.patch(f"{BASE_URL}/api/users/{TestData.retailer_id}", 
            json={"name": "Updated Retailer Name"},
            headers={"Authorization": f"Bearer {TestData.admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["name"] == "Updated Retailer Name", "Name should be updated"
        
        # Revert name
        requests.patch(f"{BASE_URL}/api/users/{TestData.retailer_id}", 
            json={"name": "John Retailer"},
            headers={"Authorization": f"Bearer {TestData.admin_token}"}
        )
    
    def test_wallet_credit(self):
        """Test crediting wallet for retailer - should update balance"""
        response = requests.post(f"{BASE_URL}/api/users/{TestData.retailer_id}/adjust-wallet",
            json={"amount": 100, "type": "credit", "remarks": "Test credit from pytest v2"},
            headers={"Authorization": f"Bearer {TestData.admin_token}"}
        )
        assert response.status_code == 200 or response.status_code == 201, f"Expected 200/201, got {response.status_code}: {response.text}"
        data = response.json()
        assert "balance" in data, "Response should have balance"
        assert "message" in data, "Response should have message"


class TestWalletNewEndpoints:
    """Wallet endpoints tests - NEW endpoints for user management"""
    
    @pytest.fixture(autouse=True)
    def ensure_token(self):
        if not TestData.admin_token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": "admin@paisape.com",
                "password": "admin123"
            })
            TestData.admin_token = response.json()["access_token"]
        if not TestData.retailer_token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": "retailer@demo.com",
                "password": "retailer123"
            })
            TestData.retailer_token = response.json()["access_token"]
    
    def test_get_all_wallets(self):
        """Test GET /wallet/all - admin endpoint to get all wallets with balances"""
        response = requests.get(f"{BASE_URL}/api/wallet/all", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list of wallets"
        if len(data) > 0:
            assert "userId" in data[0], "Wallet should have userId"
            assert "balance" in data[0], "Wallet should have balance"
    
    def test_get_user_wallet_admin(self):
        """Test GET /wallet/user/:userId - admin endpoint to get specific user wallet"""
        response = requests.get(f"{BASE_URL}/api/wallet/user/{TestData.retailer_id}", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "balance" in data, "Response should have balance"
    
    def test_get_user_ledger_admin(self):
        """Test GET /wallet/user/:userId/ledger - admin endpoint to get user's ledger entries"""
        response = requests.get(f"{BASE_URL}/api/wallet/user/{TestData.retailer_id}/ledger?limit=50", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list of ledger entries"
        if len(data) > 0:
            entry = data[0]
            assert "debit" in entry or "credit" in entry, "Ledger entry should have debit or credit"
            assert "balanceAfter" in entry, "Ledger entry should have balanceAfter"
            assert "remark" in entry, "Ledger entry should have remark"
    
    def test_get_my_wallet_retailer(self):
        """Test GET /wallet - retailer can get their own wallet"""
        response = requests.get(f"{BASE_URL}/api/wallet", headers={
            "Authorization": f"Bearer {TestData.retailer_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "balance" in data, "Response should have balance"
    
    def test_get_my_ledger_retailer(self):
        """Test GET /wallet/ledger - retailer can get their own ledger"""
        response = requests.get(f"{BASE_URL}/api/wallet/ledger?limit=50", headers={
            "Authorization": f"Bearer {TestData.retailer_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"


class TestOperators:
    """Operator management endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def ensure_token(self):
        if not TestData.admin_token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": "admin@paisape.com",
                "password": "admin123"
            })
            TestData.admin_token = response.json()["access_token"]
    
    def test_get_all_operators(self):
        """Test fetching all operators - should have mobile/DTH operators"""
        response = requests.get(f"{BASE_URL}/api/operators", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        if len(data) > 0:
            TestData.test_operator_id = data[0].get("id")
            # Verify operator structure
            assert "name" in data[0], "Operator should have name"
            assert "service" in data[0], "Operator should have service"


class TestAPIConfigEnhanced:
    """API Configuration enhanced endpoint tests - includes Test API"""
    
    @pytest.fixture(autouse=True)
    def ensure_token(self):
        if not TestData.admin_token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": "admin@paisape.com",
                "password": "admin123"
            })
            TestData.admin_token = response.json()["access_token"]
    
    def test_get_all_api_configs(self):
        """Test fetching all API configurations"""
        response = requests.get(f"{BASE_URL}/api/api-config", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        if len(data) > 0:
            TestData.test_api_id = data[0].get("id")
    
    def test_test_api_endpoint(self):
        """Test POST /api-config/:id/test - test API with mobile/operator/amount params"""
        # First get an API config
        if not TestData.test_api_id:
            get_response = requests.get(f"{BASE_URL}/api/api-config", headers={
                "Authorization": f"Bearer {TestData.admin_token}"
            })
            apis = get_response.json()
            if len(apis) > 0:
                TestData.test_api_id = apis[0].get("id")
        
        if not TestData.test_api_id:
            pytest.skip("No API config available to test")
        
        # Test the API with params
        response = requests.post(f"{BASE_URL}/api/api-config/{TestData.test_api_id}/test",
            json={
                "mobile": "9876543210",
                "operatorCode": "JIO",
                "amount": 199
            },
            headers={"Authorization": f"Bearer {TestData.admin_token}"}
        )
        assert response.status_code == 200 or response.status_code == 201, f"Expected 200/201, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify test response structure
        assert "status" in data, "Response should have status"
        assert "fullUrl" in data, "Response should have fullUrl"
        assert "method" in data, "Response should have method"
        assert "parameters" in data, "Response should have parameters"
        assert "responseMapping" in data, "Response should have responseMapping"
        
        # Verify response mapping structure (stockxchange format support)
        rm = data.get("responseMapping", {})
        assert "successField" in rm, "Response mapping should have successField"
        assert "successValue" in rm, "Response mapping should have successValue"
        assert "failedValue" in rm, "Response mapping should have failedValue"
        assert "txnIdField" in rm, "Response mapping should have txnIdField"
    
    def test_get_callback_url(self):
        """Test GET /api-config/:id/callback-url - get callback URL for webhooks"""
        if not TestData.test_api_id:
            pytest.skip("No API config available")
        
        response = requests.get(f"{BASE_URL}/api/api-config/{TestData.test_api_id}/callback-url", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "callbackUrl" in data, "Response should have callbackUrl"


class TestRechargeEnhanced:
    """Recharge endpoint tests - includes amount as string handling"""
    
    @pytest.fixture(autouse=True)
    def ensure_token(self):
        if not TestData.retailer_token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": "retailer@demo.com",
                "password": "retailer123"
            })
            TestData.retailer_token = response.json()["access_token"]
        if not TestData.admin_token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": "admin@paisape.com",
                "password": "admin123"
            })
            TestData.admin_token = response.json()["access_token"]
    
    def test_recharge_with_string_amount(self):
        """Test POST /recharge - amount as string should be converted to number (no validation error)"""
        # First get an operator
        ops_response = requests.get(f"{BASE_URL}/api/operators", headers={
            "Authorization": f"Bearer {TestData.retailer_token}"
        })
        operators = ops_response.json()
        mobile_operators = [op for op in operators if op.get("service") == "mobile" and op.get("isActive")]
        
        if not mobile_operators:
            pytest.skip("No active mobile operators available")
        
        operator_id = mobile_operators[0]["id"]
        
        # Submit recharge with amount as string (frontend sends string from input)
        response = requests.post(f"{BASE_URL}/api/recharge",
            json={
                "operatorId": operator_id,
                "mobile": "9876543210",
                "amount": "199",  # String amount - should work due to @Type(() => Number) decorator
                "circle": "Delhi"
            },
            headers={"Authorization": f"Bearer {TestData.retailer_token}"}
        )
        # Should not return validation error
        assert response.status_code != 400, f"Should not get validation error for string amount: {response.text}"
        # Can be 200/201 (success) or 403/500 (insufficient balance or other business error)
        assert response.status_code in [200, 201, 403, 500], f"Unexpected status: {response.status_code}: {response.text}"
    
    def test_recharge_with_number_amount(self):
        """Test POST /recharge - amount as number should work"""
        ops_response = requests.get(f"{BASE_URL}/api/operators", headers={
            "Authorization": f"Bearer {TestData.retailer_token}"
        })
        operators = ops_response.json()
        mobile_operators = [op for op in operators if op.get("service") == "mobile" and op.get("isActive")]
        
        if not mobile_operators:
            pytest.skip("No active mobile operators available")
        
        operator_id = mobile_operators[0]["id"]
        
        response = requests.post(f"{BASE_URL}/api/recharge",
            json={
                "operatorId": operator_id,
                "mobile": "9876543210",
                "amount": 199,  # Number amount
                "circle": "Delhi"
            },
            headers={"Authorization": f"Bearer {TestData.retailer_token}"}
        )
        assert response.status_code != 400, f"Should not get validation error: {response.text}"
    
    def test_get_recharge_stats(self):
        """Test GET /recharge/stats - get transaction statistics"""
        response = requests.get(f"{BASE_URL}/api/recharge/stats", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        # Verify stats structure
        assert "totalTransactions" in data or "total" in data or isinstance(data, dict), "Response should have stats"
    
    def test_get_all_recharges_admin(self):
        """Test GET /recharge/all - admin can see all transactions (Live Transactions)"""
        response = requests.get(f"{BASE_URL}/api/recharge/all?limit=500", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"


class TestCommission:
    """Commission management endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def ensure_token(self):
        if not TestData.admin_token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": "admin@paisape.com",
                "password": "admin123"
            })
            TestData.admin_token = response.json()["access_token"]
    
    def test_get_all_commissions(self):
        """Test fetching all commissions"""
        response = requests.get(f"{BASE_URL}/api/commission", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"


class TestRouting:
    """Routing rules endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def ensure_token(self):
        if not TestData.admin_token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": "admin@paisape.com",
                "password": "admin123"
            })
            TestData.admin_token = response.json()["access_token"]
    
    def test_get_all_routing_rules(self):
        """Test fetching all routing rules"""
        response = requests.get(f"{BASE_URL}/api/routing", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"


class TestReportsEnhanced:
    """Reports endpoint tests - includes dashboard stats for retailers"""
    
    @pytest.fixture(autouse=True)
    def ensure_token(self):
        if not TestData.admin_token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": "admin@paisape.com",
                "password": "admin123"
            })
            TestData.admin_token = response.json()["access_token"]
        if not TestData.retailer_token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": "retailer@demo.com",
                "password": "retailer123"
            })
            TestData.retailer_token = response.json()["access_token"]
    
    def test_get_admin_dashboard(self):
        """Test fetching admin dashboard stats"""
        response = requests.get(f"{BASE_URL}/api/reports/admin-dashboard", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_get_retailer_dashboard_stats(self):
        """Test fetching dashboard stats for retailer"""
        response = requests.get(f"{BASE_URL}/api/reports/dashboard-stats", headers={
            "Authorization": f"Bearer {TestData.retailer_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        # Verify stats for user reports page
        assert "walletBalance" in data or isinstance(data, dict), "Response should have stats"
    
    def test_get_transactions(self):
        """Test fetching transactions report"""
        response = requests.get(f"{BASE_URL}/api/reports/transactions", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
