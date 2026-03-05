# PUMP.OS — Manufacturing ERP System
## Product Requirements Document

**Created:** 2026-02-17  
**Last Updated:** 2026-02-20  
**Status:** Active Development

---

## Original Problem Statement
Manufacturing ERP system for Domestic RO Booster Pumps factory:
- 7–8 pump models, ~57 raw materials per model
- Focus: Production tracking, BOM deduction, inventory accuracy, manufacturing cost
- No sales module, no customers, no selling price, no PO/GRN, no BOM versioning

## User Choices
- **Tech Stack:** React + Django REST Framework + PostgreSQL
- **Auth:** JWT-based custom login with roles (Admin, Production Manager, Store Manager, Accountant)
- **BOM Import:** Both Excel (.xlsx) and CSV with sample file download
- **Mobile:** Responsive Web only

## Architecture
- **Frontend:** React (Create React App), Tailwind CSS, Recharts, Sonner toasts
- **Backend:** Django 4.2 + DRF 3.15 + Simple JWT — running via uvicorn ASGI on port 8001
- **Database:** PostgreSQL 15 (local, erp_db, erp_user / erp_pass_2024)
- **Django Apps:** authentication, master, bom, inventory, production, dashboard, reports
- **Supervisor:** manages frontend, backend, postgresql, mongodb, nginx

## Default Credentials
- **Admin:** username=`admin`, password=`admin123`

## IMPORTANT: PostgreSQL Auto-Start
PostgreSQL is managed by supervisor via `/etc/supervisor/conf.d/postgresql.conf`.
On pod restart: supervisor auto-starts PostgreSQL. If backend fails, check PostgreSQL is up.
Fallback manual start: `pg_ctlcluster 15 main start`

---

## What's Been Implemented

### Backend (Django REST Framework)
- [x] Custom User model with 4 roles, JWT auth (access 24h, refresh 30d)
- [x] Raw Material Master CRUD with current_stock, moving_avg_cost
- [x] Product Model Master CRUD with auto-calculated manufacturing_cost from BOM
- [x] BOM Management: Create, Edit (replace items), Import Excel/CSV, Export Excel, Sample download
- [x] Purchase Entry: Simple purchase with atomic stock update + moving average cost recalculation
- [x] Stock Ledger: Full audit trail per item (PURCHASE, PRODUCTION, ADJUSTMENT, OPENING)
- [x] Manual Inventory Adjustments: ADD/SUBTRACT with reason logging
- [x] Production Order: Atomic processing — deducts RM stock, adds FG stock, handles scrap, calculates batch cost
- [x] Finished Goods Stock tracking (from production)
- [x] Scrap Stock tracking (from rejected production)
- [x] Dashboard API: KPIs, 6-month trend, model-wise, top consumed materials, scrap summary, reorder alerts
- [x] Reports: RM Stock, FG Stock, Monthly Production, Daily Production, BOM Cost, Wastage, Reorder, Stock Movement
- [x] **Bulk Opening Stock Import** (NEW 2026-02-20): POST /api/inventory/opening-stock-import/ — accepts Excel/CSV, creates new materials + sets opening stock for zero-stock items, skips items with existing stock, returns created/updated/skipped/error counts with StockLedger entries (type=OPENING)
- [x] **Opening Stock Sample Template** (NEW 2026-02-20): GET /api/inventory/opening-stock-sample/ — styled Excel template with sample rows

### Frontend (React)
- [x] Login page with factory image, default credentials hint
- [x] Protected routes with role-based access
- [x] Collapsible sidebar navigation (mobile-friendly with hamburger menu)
- [x] Dashboard with KPI cards + BarChart + Reorder Alerts + Model-wise table
- [x] Raw Materials CRUD with search, stats, reorder alerts
- [x] **Bulk Import Modal** (NEW 2026-02-20): drag-drop file upload, Download Sample Template link, result summary (created/updated/skipped/errors with expandable lists)
- [x] Product Models CRUD with BOM status indicator
- [x] BOM Management: Model selector, editable item grid, live cost preview, import/export/sample buttons
- [x] Purchase Entry: Form with auto-calculated total, purchase history table
- [x] Production Orders: Create with BOM-based validation, detail view with material usage
- [x] Inventory: 4 tabs (RM Stock, FG Stock, Adjustments, Stock Ledger)
- [x] Reports: 8 report types with filters + charts (FG tab crash fixed 2026-02-20)
- [x] User Management: Admin-only CRUD for users
- [x] Promise.all .catch() error handlers added to Purchase, Production, Inventory pages (2026-02-20)

---

## Prioritized Backlog

### P0 — Critical for production use
- [ ] Add product models (7-8 pump models) via UI or seed script
- [ ] BOM creation for each model (once raw materials are imported)
- [ ] Opening stock import with real factory data (~57 materials)

### P1 — Important enhancements
- [ ] BOM items inline edit (current UX: save/replace all)
- [ ] Production order status workflow (PLANNED → IN_PROGRESS → COMPLETED)
- [ ] Batch-wise FG stock tracking (deduct FG stock on dispatch)
- [ ] Print/PDF export for reports
- [ ] Password change flow for non-admin users

### P2 — Nice to have
- [ ] Role-Based UI restrictions (hide/disable features by role in frontend)
- [ ] Dashboard date range filter
- [ ] Email alerts for reorder levels
- [ ] Audit log viewer (who changed what)
- [ ] Dark mode

---

## Next Action Items
1. User to import ~57 raw materials via Bulk Import (Raw Materials → Bulk Import button)
2. Add product models (7-8 pump models) via Product Models page
3. Import BOM for each product model via BOM Management → Import button
4. Create production users (Production Manager, Store Manager, Accountant) via User Management
5. Test full production workflow: Purchase Entry → Production Order → Reports
