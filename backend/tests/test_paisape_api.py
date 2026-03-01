"""
PaisaPe API Backend Tests
Testing: Auth, Users, Commission, Routing, Operators, API Config, Reports
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://paisape-recharge-1.preview.emergentagent.com')

# Store shared data between tests
class TestData:
    admin_token = None
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
        """Test fetching all users - should return 4 seeded users"""
        response = requests.get(f"{BASE_URL}/api/users", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) >= 4, f"Expected at least 4 users, got {len(data)}"
    
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
        """Test crediting wallet for retailer"""
        response = requests.post(f"{BASE_URL}/api/users/{TestData.retailer_id}/adjust-wallet",
            json={"amount": 100, "type": "credit", "remarks": "Test credit from pytest"},
            headers={"Authorization": f"Bearer {TestData.admin_token}"}
        )
        assert response.status_code == 200 or response.status_code == 201, f"Expected 200/201, got {response.status_code}: {response.text}"
        data = response.json()
        assert "balance" in data, "Response should have balance"
        assert "message" in data, "Response should have message"
    
    def test_toggle_user_status(self):
        """Test toggling user active status"""
        # Get initial status
        get_response = requests.get(f"{BASE_URL}/api/users", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        users = get_response.json()
        retailer = next((u for u in users if u["id"] == TestData.retailer_id), None)
        initial_status = retailer["isActive"]
        
        # Toggle status
        toggle_response = requests.patch(f"{BASE_URL}/api/users/{TestData.retailer_id}/toggle-status", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert toggle_response.status_code == 200, f"Expected 200, got {toggle_response.status_code}"
        
        # Toggle back
        requests.patch(f"{BASE_URL}/api/users/{TestData.retailer_id}/toggle-status", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })


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
        """Test fetching all operators"""
        response = requests.get(f"{BASE_URL}/api/operators", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        if len(data) > 0:
            TestData.test_operator_id = data[0].get("id")


class TestAPIConfig:
    """API Configuration endpoint tests"""
    
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
    
    def test_create_commission(self):
        """Test creating a new commission rule"""
        # First get an operator to use
        ops_response = requests.get(f"{BASE_URL}/api/operators", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        operators = ops_response.json()
        if not operators or len(operators) == 0:
            pytest.skip("No operators available to create commission")
        
        operator_id = operators[0]["id"]
        
        response = requests.post(f"{BASE_URL}/api/commission",
            json={
                "role": "retailer",
                "operatorId": operator_id,
                "service": "mobile",
                "commissionType": "percentage",
                "commissionValue": 2.5
            },
            headers={"Authorization": f"Bearer {TestData.admin_token}"}
        )
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data, "Response should have id"
        TestData.test_commission_id = data["id"]
    
    def test_delete_commission(self):
        """Test deleting a commission rule"""
        if not TestData.test_commission_id:
            pytest.skip("No test commission to delete")
        
        response = requests.delete(f"{BASE_URL}/api/commission/{TestData.test_commission_id}", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"


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
    
    def test_create_routing_rule(self):
        """Test creating a new routing rule with apiPriority"""
        # Get APIs first
        apis_response = requests.get(f"{BASE_URL}/api/api-config", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        apis = apis_response.json()
        
        api_priority = [api["id"] for api in apis[:2]] if len(apis) >= 2 else ([apis[0]["id"]] if apis else [])
        
        if not api_priority:
            pytest.skip("No APIs available to create routing rule")
        
        response = requests.post(f"{BASE_URL}/api/routing",
            json={
                "role": "retailer",
                "apiPriority": api_priority,
                "minAmount": 10,
                "maxAmount": 5000
            },
            headers={"Authorization": f"Bearer {TestData.admin_token}"}
        )
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        data = response.json()
        assert "id" in data, "Response should have id"
        TestData.test_routing_id = data["id"]
    
    def test_delete_routing_rule(self):
        """Test deleting a routing rule"""
        if not TestData.test_routing_id:
            pytest.skip("No test routing rule to delete")
        
        response = requests.delete(f"{BASE_URL}/api/routing/{TestData.test_routing_id}", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"


class TestReports:
    """Reports endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def ensure_token(self):
        if not TestData.admin_token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": "admin@paisape.com",
                "password": "admin123"
            })
            TestData.admin_token = response.json()["access_token"]
    
    def test_get_admin_dashboard(self):
        """Test fetching admin dashboard stats"""
        response = requests.get(f"{BASE_URL}/api/reports/admin-dashboard", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    
    def test_get_transactions(self):
        """Test fetching transactions report"""
        response = requests.get(f"{BASE_URL}/api/reports/transactions", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
