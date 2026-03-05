"""ERP Manufacturing System - Backend API Tests"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def auth_token():
    resp = requests.post(f"{BASE_URL}/api/auth/login/", json={"username": "admin", "password": "admin123"})
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    data = resp.json()
    return data.get("access") or data.get("token")

@pytest.fixture(scope="module")
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}

# Auth tests
class TestAuth:
    def test_login_success(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login/", json={"username": "admin", "password": "admin123"})
        assert resp.status_code == 200
        data = resp.json()
        assert "access" in data or "token" in data
        assert "role" in data or "user" in data

    def test_login_invalid(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login/", json={"username": "admin", "password": "wrongpass"})
        assert resp.status_code in [400, 401]

    def test_me_endpoint(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/auth/me/", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "username" in data or "email" in data

# Master - Raw Materials
class TestRawMaterials:
    def test_get_raw_materials(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/master/raw-materials/", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_create_raw_material(self, auth_headers):
        payload = {
            "item_id": "TEST_RM001",
            "item_name": "TEST Raw Material",
            "unit": "KG",
            "default_cost": 100.0,
            "reorder_level": 10.0,
            "status": True
        }
        resp = requests.post(f"{BASE_URL}/api/master/raw-materials/", json=payload, headers=auth_headers)
        assert resp.status_code in [200, 201], f"Create RM failed: {resp.text}"
        data = resp.json()
        assert data.get("item_id") == "TEST_RM001"
        return data.get("id")

    def test_get_raw_material_detail(self, auth_headers):
        # Create first
        payload = {"item_id": "TEST_RM002", "item_name": "TEST RM Detail", "unit": "PCS", "default_cost": 50.0, "reorder_level": 5.0}
        create_resp = requests.post(f"{BASE_URL}/api/master/raw-materials/", json=payload, headers=auth_headers)
        if create_resp.status_code in [200, 201]:
            item_id = create_resp.json().get("id")
            resp = requests.get(f"{BASE_URL}/api/master/raw-materials/{item_id}/", headers=auth_headers)
            assert resp.status_code == 200

# Master - Products
class TestProducts:
    def test_get_products(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/master/products/", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_create_product(self, auth_headers):
        payload = {
            "model_id": "TEST_PM001",
            "model_name": "TEST Pump Model",
            "category": "RO Pump",
            "selling_price": 500.0,
            "status": True
        }
        resp = requests.post(f"{BASE_URL}/api/master/products/", json=payload, headers=auth_headers)
        assert resp.status_code in [200, 201], f"Create product failed: {resp.text}"
        data = resp.json()
        assert data.get("model_id") == "TEST_PM001"

# BOM
class TestBOM:
    def test_get_bom(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/bom/", headers=auth_headers)
        assert resp.status_code == 200

# Inventory
class TestInventory:
    def test_get_stock(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/inventory/stock/", headers=auth_headers)
        assert resp.status_code == 200

# Dashboard
class TestDashboard:
    def test_get_dashboard(self, auth_headers):
        resp = requests.get(f"{BASE_URL}/api/dashboard/", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "kpis" in data
        assert "monthly_production_trend" in data
        kpis = data["kpis"]
        assert "rm_stock_value" in kpis
        assert "fg_total" in kpis
        assert "today_produced" in kpis
        assert "reorder_alerts" in kpis

    def test_dashboard_unauthenticated(self):
        resp = requests.get(f"{BASE_URL}/api/dashboard/")
        assert resp.status_code in [401, 403]
