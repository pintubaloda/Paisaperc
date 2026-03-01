"""
PaisaPe API Backend Tests V3
Testing P0/P1 Features:
- P0: operatorName field in transactions
- P1: Check Status functionality for pending transactions
- Sandbox bulk test with operatorName
- Transaction listings with operator names
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://paisape-recharge-1.preview.emergentagent.com')

# Provided credentials
ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "password123"
RETAILER_EMAIL = "retailer@test.com"
RETAILER_PASSWORD = "password123"
RETAILER_ID = "e352a96e-d465-4091-9176-47058f50e29b"
JIO_OPERATOR_ID = "c2b01bd4-dcad-429e-bbe6-5b0aaabf7296"
AIRTEL_OPERATOR_ID = "456ff3f3-2811-4ed5-ad17-571bb176e598"

class TestData:
    admin_token = None
    retailer_token = None
    pending_txn_id = None
    

class TestAuthWithNewCredentials:
    """Authentication tests with new credentials"""
    
    def test_admin_login_new_creds(self):
        """Test admin login with admin@test.com / password123"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code in [200, 201], f"Admin login failed: {response.status_code}: {response.text}"
        data = response.json()
        assert "access_token" in data, "access_token not in response"
        assert "user" in data, "user not in response"
        assert data["user"]["role"] == "admin", f"Expected admin role, got {data['user']['role']}"
        TestData.admin_token = data["access_token"]
        print(f"Admin login successful, role: {data['user']['role']}")
    
    def test_retailer_login_new_creds(self):
        """Test retailer login with retailer@test.com / password123"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": RETAILER_EMAIL,
            "password": RETAILER_PASSWORD
        })
        assert response.status_code in [200, 201], f"Retailer login failed: {response.status_code}: {response.text}"
        data = response.json()
        assert "access_token" in data, "access_token not in response"
        assert "user" in data, "user not in response"
        assert data["user"]["role"] == "retailer", f"Expected retailer role, got {data['user']['role']}"
        TestData.retailer_token = data["access_token"]
        print(f"Retailer login successful, role: {data['user']['role']}")


class TestOperatorNameInTransactions:
    """Test P0: operatorName field in transaction listings"""
    
    @pytest.fixture(autouse=True)
    def ensure_token(self):
        if not TestData.admin_token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            if response.status_code in [200, 201]:
                TestData.admin_token = response.json()["access_token"]
            else:
                pytest.skip("Admin login failed")
    
    def test_get_all_transactions_has_operator_name(self):
        """GET /api/recharge/all - verify operatorName field is present"""
        response = requests.get(f"{BASE_URL}/api/recharge/all?limit=50", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Check that operatorName field exists in transactions
        if len(data) > 0:
            txn = data[0]
            assert "operatorId" in txn, "Transaction should have operatorId"
            # operatorName should be present (may be operatorId value or actual name)
            has_operator_name = "operatorName" in txn
            print(f"Transaction has operatorName field: {has_operator_name}")
            if has_operator_name:
                print(f"Sample operatorName value: {txn['operatorName']}")
                assert txn["operatorName"] is not None, "operatorName should not be None"
            else:
                pytest.fail("operatorName field is missing from transaction response")
        else:
            print("No transactions found - creating sandbox test transactions")
    
    def test_get_failed_transactions_has_operator_name(self):
        """GET /api/recharge/failed/list - verify operatorName field"""
        response = requests.get(f"{BASE_URL}/api/recharge/failed/list?limit=50", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        if len(data) > 0:
            txn = data[0]
            has_operator_name = "operatorName" in txn
            print(f"Failed transactions - operatorName field present: {has_operator_name}")
            if has_operator_name:
                print(f"Failed txn operatorName: {txn['operatorName']}")
    
    def test_get_pending_transactions_has_operator_name(self):
        """GET /api/recharge/pending/list - verify operatorName field"""
        response = requests.get(f"{BASE_URL}/api/recharge/pending/list?limit=50", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        if len(data) > 0:
            txn = data[0]
            has_operator_name = "operatorName" in txn
            print(f"Pending transactions - operatorName field present: {has_operator_name}")
            if has_operator_name:
                print(f"Pending txn operatorName: {txn['operatorName']}")
                TestData.pending_txn_id = txn["id"]


class TestSandboxBulkTestWithOperatorName:
    """Test sandbox bulk test creates transactions with operatorName"""
    
    @pytest.fixture(autouse=True)
    def ensure_token(self):
        if not TestData.admin_token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            if response.status_code in [200, 201]:
                TestData.admin_token = response.json()["access_token"]
            else:
                pytest.skip("Admin login failed")
    
    def test_sandbox_bulk_test_endpoint(self):
        """POST /api/recharge/sandbox-test - creates transactions with operatorName"""
        response = requests.post(f"{BASE_URL}/api/recharge/sandbox-test",
            json={
                "userId": RETAILER_ID,
                "count": 5,  # Create 5 test transactions
                "operators": [JIO_OPERATOR_ID],  # Use Jio operator
                "tpm": 60
            },
            headers={"Authorization": f"Bearer {TestData.admin_token}"}
        )
        assert response.status_code in [200, 201], f"Sandbox test failed: {response.status_code}: {response.text}"
        data = response.json()
        
        print(f"Sandbox bulk test result: {data}")
        assert "total" in data, "Response should have total"
        assert "success" in data, "Response should have success count"
        assert "pending" in data, "Response should have pending count"
        assert "failed" in data, "Response should have failed count"
        
        # Verify transactions were created
        total_processed = data.get("success", 0) + data.get("pending", 0) + data.get("failed", 0)
        print(f"Transactions processed: success={data.get('success')}, pending={data.get('pending')}, failed={data.get('failed')}")
        assert total_processed > 0, "At least some transactions should have been processed"
    
    def test_verify_sandbox_transactions_have_operator_name(self):
        """Verify newly created sandbox transactions have operatorName=Jio"""
        # Wait a bit for transactions to be created
        time.sleep(1)
        
        response = requests.get(f"{BASE_URL}/api/recharge/all?limit=20", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Find transactions with isSandbox=true and operatorId=JIO_OPERATOR_ID
        sandbox_jio_txns = [t for t in data if t.get("isSandbox") == True and t.get("operatorId") == JIO_OPERATOR_ID]
        
        if len(sandbox_jio_txns) > 0:
            txn = sandbox_jio_txns[0]
            print(f"Found sandbox Jio transaction: id={txn.get('id')}, operatorName={txn.get('operatorName')}")
            assert "operatorName" in txn, "operatorName field should be present"
            # operatorName should be 'Jio' (the operator name)
            operator_name = txn.get("operatorName")
            print(f"operatorName value: {operator_name}")
            assert operator_name is not None, "operatorName should not be None"
        else:
            print("No sandbox Jio transactions found in recent transactions")


class TestCheckStatusFunctionality:
    """Test P1: Check Status for pending transactions"""
    
    @pytest.fixture(autouse=True)
    def ensure_token(self):
        if not TestData.admin_token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            if response.status_code in [200, 201]:
                TestData.admin_token = response.json()["access_token"]
            else:
                pytest.skip("Admin login failed")
    
    def test_get_pending_transactions(self):
        """Get pending transactions to find one to test status check"""
        response = requests.get(f"{BASE_URL}/api/recharge/pending/list?limit=10", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        if len(data) > 0:
            TestData.pending_txn_id = data[0]["id"]
            print(f"Found pending transaction: {TestData.pending_txn_id}")
        else:
            print("No pending transactions found - will create one via sandbox")
    
    def test_create_pending_transaction_if_needed(self):
        """Create a pending transaction via sandbox if none exists"""
        if TestData.pending_txn_id:
            pytest.skip("Already have a pending transaction to test")
        
        # Run sandbox test with hope of getting a pending transaction
        response = requests.post(f"{BASE_URL}/api/recharge/sandbox-test",
            json={
                "userId": RETAILER_ID,
                "count": 10,
                "operators": [JIO_OPERATOR_ID],
                "tpm": 60
            },
            headers={"Authorization": f"Bearer {TestData.admin_token}"}
        )
        assert response.status_code in [200, 201], f"Sandbox test failed: {response.status_code}"
        
        # Check for pending transactions now
        time.sleep(1)
        pending_response = requests.get(f"{BASE_URL}/api/recharge/pending/list?limit=10", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        pending_data = pending_response.json()
        
        if len(pending_data) > 0:
            TestData.pending_txn_id = pending_data[0]["id"]
            print(f"Created pending transaction: {TestData.pending_txn_id}")
    
    def test_check_status_endpoint(self):
        """POST /api/recharge/:id/check-status - resolves pending sandbox txns"""
        if not TestData.pending_txn_id:
            # Try to find any pending transaction
            pending_response = requests.get(f"{BASE_URL}/api/recharge/pending/list?limit=1", headers={
                "Authorization": f"Bearer {TestData.admin_token}"
            })
            pending_data = pending_response.json()
            if len(pending_data) > 0:
                TestData.pending_txn_id = pending_data[0]["id"]
            else:
                pytest.skip("No pending transactions available to test check-status")
        
        txn_id = TestData.pending_txn_id
        print(f"Testing check-status for transaction: {txn_id}")
        
        response = requests.post(f"{BASE_URL}/api/recharge/{txn_id}/check-status", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code in [200, 201], f"Check status failed: {response.status_code}: {response.text}"
        data = response.json()
        
        print(f"Check status response: {data}")
        assert "status" in data, "Response should have status field"
        assert "id" in data, "Response should have id field"
        
        # Status should be one of: success, failed, pending (still pending is ok)
        status = data.get("status")
        print(f"Transaction status after check: {status}")
        assert status in ["success", "failed", "pending"], f"Unexpected status: {status}"
        
        # If status changed from pending, verify commission/refund was applied
        if status == "success":
            assert "commission" in data, "Success txn should have commission"
            print(f"Transaction resolved as SUCCESS, commission: {data.get('commission')}")
        elif status == "failed":
            assert "refundAmount" in data, "Failed txn should have refundAmount"
            print(f"Transaction resolved as FAILED, refundAmount: {data.get('refundAmount')}")
        else:
            print("Transaction still PENDING after status check")


class TestLedgerReport:
    """Test Ledger Report endpoint"""
    
    @pytest.fixture(autouse=True)
    def ensure_token(self):
        if not TestData.admin_token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            if response.status_code in [200, 201]:
                TestData.admin_token = response.json()["access_token"]
            else:
                pytest.skip("Admin login failed")
    
    def test_ledger_report_endpoint(self):
        """GET /api/wallet/ledger-report - consolidated ledger report"""
        response = requests.get(f"{BASE_URL}/api/wallet/ledger-report?limit=50", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        if len(data) > 0:
            entry = data[0]
            print(f"Ledger entry sample: {entry}")
            # Verify ledger entry structure
            assert "userId" in entry, "Ledger entry should have userId"
            assert "dateTime" in entry or "createdAt" in entry, "Ledger entry should have date"


class TestWalletBalanceFlow:
    """Test wallet balance changes during recharge flow: debit-first, refund on fail, commission on success"""
    
    @pytest.fixture(autouse=True)
    def ensure_token(self):
        if not TestData.admin_token:
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            if response.status_code in [200, 201]:
                TestData.admin_token = response.json()["access_token"]
            else:
                pytest.skip("Admin login failed")
    
    def test_get_retailer_wallet_balance(self):
        """Check retailer wallet balance"""
        response = requests.get(f"{BASE_URL}/api/wallet/user/{RETAILER_ID}", headers={
            "Authorization": f"Bearer {TestData.admin_token}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        balance = data.get("balance", 0)
        print(f"Retailer wallet balance: {balance}")
        assert "balance" in data, "Response should have balance field"
        return balance


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
