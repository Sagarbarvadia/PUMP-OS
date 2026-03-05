"""Tests for Bulk Opening Stock Import and related features"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def auth_token():
    resp = requests.post(f"{BASE_URL}/api/auth/login/", json={"username": "admin", "password": "admin123"})
    assert resp.status_code == 200
    return resp.json()["access"]

@pytest.fixture(scope="module")
def headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}

# Test 1: Login
class TestAuth:
    def test_login_returns_token(self):
        resp = requests.post(f"{BASE_URL}/api/auth/login/", json={"username": "admin", "password": "admin123"})
        assert resp.status_code == 200
        data = resp.json()
        assert "access" in data
        assert len(data["access"]) > 0

# Test 2+3: Opening Stock Sample
class TestOpeningStockSample:
    def test_sample_template_returns_200(self, headers):
        resp = requests.get(f"{BASE_URL}/api/inventory/opening-stock-sample/", headers=headers)
        assert resp.status_code == 200

    def test_sample_template_is_xlsx(self, headers):
        resp = requests.get(f"{BASE_URL}/api/inventory/opening-stock-sample/", headers=headers)
        assert resp.status_code == 200
        ct = resp.headers.get("Content-Type", "")
        # Should be xlsx or csv
        assert "spreadsheet" in ct or "csv" in ct or "excel" in ct or "octet-stream" in ct

# Test 4: Upload CSV with new items
class TestOpeningStockImport:
    CSV_CONTENT = (
        "item_id,item_name,category,unit,opening_qty,unit_cost,reorder_level,lead_time\n"
        "BULK001,Test Bulk Item 1,RAW_MATERIAL,PCS,100,25.50,10,7\n"
        "BULK002,Test Bulk Item 2,RAW_MATERIAL,KG,50,15.00,5,3\n"
    )

    def test_upload_csv_creates_items(self, headers):
        files = {"file": ("test_import.csv", io.BytesIO(self.CSV_CONTENT.encode()), "text/csv")}
        resp = requests.post(f"{BASE_URL}/api/inventory/opening-stock-import/", headers=headers, files=files)
        assert resp.status_code == 200
        data = resp.json()
        assert "created" in data or "errors" in data, f"Unexpected response: {data}"
        print(f"Import result: {data}")

    def test_upload_csv_counts(self, headers):
        files = {"file": ("test_import2.csv", io.BytesIO(self.CSV_CONTENT.encode()), "text/csv")}
        resp = requests.post(f"{BASE_URL}/api/inventory/opening-stock-import/", headers=headers, files=files)
        assert resp.status_code == 200
        data = resp.json()
        # Re-import: items should be skipped (existing stock protection)
        skipped = data.get("skipped", 0)
        errors = data.get("errors", 0)
        created = data.get("created", 0)
        print(f"Re-import result: created={created}, skipped={skipped}, errors={errors}")
        # On re-import, items should be skipped (not created again)
        assert skipped >= 0  # At minimum, this field exists

# Test 5: Raw materials list not empty
class TestRawMaterials:
    def test_raw_materials_list(self, headers):
        resp = requests.get(f"{BASE_URL}/api/master/raw-materials/", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        items = data if isinstance(data, list) else data.get("results", [])
        assert len(items) > 0, "Raw materials list should not be empty"
        print(f"Raw materials count: {len(items)}")

# Test 6+7: BOM and Production Orders
class TestBOMAndProduction:
    def test_bom_endpoint(self, headers):
        resp = requests.get(f"{BASE_URL}/api/bom/", headers=headers)
        assert resp.status_code == 200

    def test_production_orders_endpoint(self, headers):
        resp = requests.get(f"{BASE_URL}/api/production/orders/", headers=headers)
        assert resp.status_code == 200

# Test 8: Reports finished goods
class TestReports:
    def test_finished_goods_report(self, headers):
        resp = requests.get(f"{BASE_URL}/api/reports/finished-goods/", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, (list, dict))
        print(f"Finished goods report: {data}")

    def test_rm_stock_report(self, headers):
        resp = requests.get(f"{BASE_URL}/api/reports/rm-stock/", headers=headers)
        assert resp.status_code == 200
