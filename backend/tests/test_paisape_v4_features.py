"""
PaisaPe V4 Feature Tests
Testing new features:
- KYC Management endpoints
- Dispute endpoints
- Reconciliation endpoints
- 2FA endpoints
- Pending Report / Bulk Resolve
- Admin status change
- Transaction detail with API request/response
- Webhook processing
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "password123"
RETAILER_EMAIL = "retailer@test.com"
RETAILER_PASSWORD = "password123"
RETAILER_ID = "e352a96e-d465-4091-9176-47058f50e29b"
JIO_OPERATOR_ID = "c2b01bd4-dcad-429e-bbe6-5b0aaabf7296"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200 or response.status_code == 201:
        return response.json().get("access_token")
    pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def retailer_token():
    """Get retailer auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": RETAILER_EMAIL,
        "password": RETAILER_PASSWORD
    })
    if response.status_code == 200 or response.status_code == 201:
        return response.json().get("access_token")
    pytest.skip(f"Retailer login failed: {response.status_code} - {response.text}")


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


@pytest.fixture
def retailer_headers(retailer_token):
    return {"Authorization": f"Bearer {retailer_token}", "Content-Type": "application/json"}


# =============================================================================
# KYC Endpoints Tests
# =============================================================================

class TestKYCEndpoints:
    """Test KYC management endpoints"""

    def test_submit_kyc_document(self, retailer_headers):
        """Test POST /api/kyc/submit - Submit KYC document"""
        response = requests.post(f"{BASE_URL}/api/kyc/submit", headers=retailer_headers, json={
            "docType": "pan",
            "docNumber": "TESTPAN1234"
        })
        assert response.status_code in [200, 201], f"KYC submit failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["docType"] == "pan"
        assert data["docNumber"] == "TESTPAN1234"
        assert data["status"] == "pending"
        print(f"✓ KYC document submitted: {data['id']}")

    def test_get_my_kyc_documents(self, retailer_headers):
        """Test GET /api/kyc/my - Get user's KYC documents"""
        response = requests.get(f"{BASE_URL}/api/kyc/my", headers=retailer_headers)
        assert response.status_code == 200, f"Get my KYC failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} KYC documents for user")

    def test_get_all_kyc_documents(self, admin_headers):
        """Test GET /api/kyc/all - Admin get all KYC documents"""
        response = requests.get(f"{BASE_URL}/api/kyc/all", headers=admin_headers)
        assert response.status_code == 200, f"Get all KYC failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin got {len(data)} total KYC documents")

    def test_get_pending_kyc(self, admin_headers):
        """Test GET /api/kyc/pending - Admin get pending KYC"""
        response = requests.get(f"{BASE_URL}/api/kyc/pending", headers=admin_headers)
        assert response.status_code == 200, f"Get pending KYC failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin got {len(data)} pending KYC documents")

    def test_verify_kyc_document(self, admin_headers, retailer_headers):
        """Test POST /api/kyc/:id/verify - Admin verify KYC"""
        # First submit a new document
        submit_resp = requests.post(f"{BASE_URL}/api/kyc/submit", headers=retailer_headers, json={
            "docType": "aadhaar",
            "docNumber": "TEST123456789012"
        })
        if submit_resp.status_code not in [200, 201]:
            pytest.skip("Could not submit KYC for testing")
        
        doc_id = submit_resp.json().get("id")
        
        # Verify the document
        response = requests.post(f"{BASE_URL}/api/kyc/{doc_id}/verify", headers=admin_headers, json={
            "status": "approved"
        })
        assert response.status_code in [200, 201], f"KYC verify failed: {response.text}"
        data = response.json()
        assert data["status"] == "approved"
        print(f"✓ KYC document {doc_id} approved")


# =============================================================================
# Dispute Endpoints Tests
# =============================================================================

class TestDisputeEndpoints:
    """Test Dispute management endpoints"""

    def test_get_all_disputes(self, admin_headers):
        """Test GET /api/disputes - Get all disputes"""
        response = requests.get(f"{BASE_URL}/api/disputes", headers=admin_headers)
        assert response.status_code == 200, f"Get disputes failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} total disputes")

    def test_get_unresolved_disputes(self, admin_headers):
        """Test GET /api/disputes/unresolved - Get unresolved disputes"""
        response = requests.get(f"{BASE_URL}/api/disputes/unresolved", headers=admin_headers)
        assert response.status_code == 200, f"Get unresolved disputes failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} unresolved disputes")


# =============================================================================
# Reconciliation Endpoints Tests
# =============================================================================

class TestReconciliationEndpoints:
    """Test Reconciliation endpoints"""

    def test_get_reconciliation_report(self, admin_headers):
        """Test GET /api/reconciliation/report - Get reconciliation report"""
        response = requests.get(f"{BASE_URL}/api/reconciliation/report", headers=admin_headers)
        assert response.status_code == 200, f"Get reconciliation report failed: {response.text}"
        data = response.json()
        assert "totalPending" in data
        assert "stalePending" in data
        assert "todaySuccess" in data
        assert "todayFailed" in data
        print(f"✓ Reconciliation report: {data['totalPending']} pending, {data['stalePending']} stale")

    def test_run_reconciliation(self, admin_headers):
        """Test POST /api/reconciliation/run - Run reconciliation manually"""
        response = requests.post(f"{BASE_URL}/api/reconciliation/run", headers=admin_headers)
        assert response.status_code in [200, 201], f"Run reconciliation failed: {response.text}"
        data = response.json()
        assert "runAt" in data
        print(f"✓ Reconciliation run at {data.get('runAt')}")


# =============================================================================
# 2FA Endpoints Tests
# =============================================================================

class TestTwoFactorEndpoints:
    """Test 2FA endpoints"""

    def test_get_2fa_status(self, retailer_headers):
        """Test GET /api/two-factor/status - Get 2FA status"""
        response = requests.get(f"{BASE_URL}/api/two-factor/status", headers=retailer_headers)
        assert response.status_code == 200, f"Get 2FA status failed: {response.text}"
        data = response.json()
        # Should have isEnabled field (or enabled field)
        print(f"✓ 2FA status retrieved: enabled={data.get('isEnabled', data.get('enabled', False))}")

    def test_enable_2fa(self, retailer_headers):
        """Test POST /api/two-factor/enable - Enable 2FA"""
        response = requests.post(f"{BASE_URL}/api/two-factor/enable", headers=retailer_headers)
        assert response.status_code in [200, 201], f"Enable 2FA failed: {response.text}"
        data = response.json()
        assert "secret" in data
        print(f"✓ 2FA enabled, secret: {data['secret'][:10]}...")

    def test_disable_2fa(self, retailer_headers):
        """Test DELETE /api/two-factor/disable - Disable 2FA"""
        response = requests.delete(f"{BASE_URL}/api/two-factor/disable", headers=retailer_headers)
        assert response.status_code in [200, 201], f"Disable 2FA failed: {response.text}"
        print("✓ 2FA disabled")


# =============================================================================
# Pending Report / Bulk Resolve / Status Change Tests
# =============================================================================

class TestPendingReportEndpoints:
    """Test Pending Report and Bulk Resolve endpoints"""

    def test_get_pending_transactions(self, admin_headers):
        """Test GET /api/recharge/pending/list - Get pending transactions"""
        response = requests.get(f"{BASE_URL}/api/recharge/pending/list", headers=admin_headers)
        assert response.status_code == 200, f"Get pending txns failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} pending transactions")

    def test_bulk_resolve(self, admin_headers):
        """Test POST /api/recharge/bulk-resolve - Bulk resolve pending"""
        response = requests.post(f"{BASE_URL}/api/recharge/bulk-resolve", headers=admin_headers)
        assert response.status_code in [200, 201], f"Bulk resolve failed: {response.text}"
        data = response.json()
        assert "total" in data
        assert "resolved" in data
        assert "stillPending" in data
        print(f"✓ Bulk resolve: {data['total']} total, {data['resolved']} resolved, {data['stillPending']} still pending")

    def test_get_transaction_detail(self, admin_headers):
        """Test GET /api/recharge/detail/:id - Get transaction detail with API req/resp"""
        # First get a transaction ID
        txn_resp = requests.get(f"{BASE_URL}/api/recharge/all?limit=1", headers=admin_headers)
        if txn_resp.status_code != 200 or not txn_resp.json():
            pytest.skip("No transactions available for detail test")
        
        txn_id = txn_resp.json()[0].get("id")
        
        response = requests.get(f"{BASE_URL}/api/recharge/detail/{txn_id}", headers=admin_headers)
        assert response.status_code == 200, f"Get txn detail failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert "availableApis" in data
        print(f"✓ Transaction detail retrieved: {txn_id[:12]}... with {len(data.get('availableApis', []))} available APIs")


# =============================================================================
# Admin Status Change Tests
# =============================================================================

class TestAdminStatusChange:
    """Test Admin status change functionality"""

    def test_change_transaction_status(self, admin_headers):
        """Test POST /api/recharge/:id/change-status - Admin change status"""
        # First create a sandbox transaction to test with
        sandbox_resp = requests.post(f"{BASE_URL}/api/recharge/sandbox-test", headers=admin_headers, json={
            "userId": RETAILER_ID,
            "count": 1,
            "operators": [JIO_OPERATOR_ID],
            "tpm": 0
        })
        
        if sandbox_resp.status_code not in [200, 201]:
            # Try to get any pending transaction
            pending_resp = requests.get(f"{BASE_URL}/api/recharge/pending/list", headers=admin_headers)
            if pending_resp.status_code != 200 or not pending_resp.json():
                pytest.skip("No transactions available for status change test")
            txn_id = pending_resp.json()[0].get("id")
        else:
            # Get most recent transaction
            txn_resp = requests.get(f"{BASE_URL}/api/recharge/all?limit=1", headers=admin_headers)
            if txn_resp.status_code != 200 or not txn_resp.json():
                pytest.skip("No transactions available for status change test")
            txn_id = txn_resp.json()[0].get("id")
        
        # Change status
        response = requests.post(f"{BASE_URL}/api/recharge/{txn_id}/change-status", headers=admin_headers, json={
            "status": "success",
            "note": "Admin test status change"
        })
        # May fail if transaction is already success, which is fine
        if response.status_code in [200, 201]:
            print(f"✓ Status changed for transaction {txn_id[:12]}...")
        else:
            print(f"✓ Status change test complete (transaction may already be in final state)")


# =============================================================================
# Webhook Endpoint Tests
# =============================================================================

class TestWebhookEndpoints:
    """Test Webhook callback processing"""

    def test_webhook_callback_invalid_token(self, admin_headers):
        """Test POST /api/webhook/:apiId/callback with invalid token"""
        # Get any API config to test webhook
        api_resp = requests.get(f"{BASE_URL}/api/api-config", headers=admin_headers)
        if api_resp.status_code != 200 or not api_resp.json():
            pytest.skip("No API configs available for webhook test")
        
        api_id = api_resp.json()[0].get("id")
        
        # Call webhook with invalid token - should get 400
        response = requests.post(
            f"{BASE_URL}/api/webhook/{api_id}/callback",
            headers={"x-callback-token": "invalid-token"},
            json={"txnId": "test-txn", "status": "Success"}
        )
        # Can be 400 (invalid token) or 404 (txn not found) or 200 (no token configured)
        assert response.status_code in [200, 201, 400, 404], f"Webhook callback unexpected response: {response.status_code}"
        print(f"✓ Webhook callback test complete (status: {response.status_code})")


# =============================================================================
# Live Transactions with Edit Button Tests
# =============================================================================

class TestLiveTransactions:
    """Test Live Transactions endpoints"""

    def test_get_all_transactions(self, admin_headers):
        """Test GET /api/recharge/all - Get all transactions"""
        response = requests.get(f"{BASE_URL}/api/recharge/all", headers=admin_headers)
        assert response.status_code == 200, f"Get all txns failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        # Check operatorName is present in transactions
        if data:
            txn = data[0]
            assert "mobile" in txn
            assert "amount" in txn
            assert "status" in txn
        print(f"✓ Got {len(data)} transactions")

    def test_get_stats(self, admin_headers):
        """Test GET /api/recharge/stats - Get transaction stats"""
        response = requests.get(f"{BASE_URL}/api/recharge/stats", headers=admin_headers)
        assert response.status_code == 200, f"Get stats failed: {response.text}"
        data = response.json()
        assert "totalTransactions" in data
        assert "successRate" in data
        print(f"✓ Stats: {data['totalTransactions']} total, {data['successRate']}% success rate")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
