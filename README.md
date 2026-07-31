# EarlyB Salon

Salon booking and product marketplace platform with a Django REST API backend and a React frontend.

## Structure

- `backend/` — Django 6 + Django REST Framework API (PostgreSQL, JWT cookie auth)
- `frontend/` — React 19 + Vite + TanStack Query + Tailwind CSS (shadcn/ui)

## Backend

Requirements: Python 3.12+, PostgreSQL.

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create a PostgreSQL database and configure via env or backend/.env:
#   DB_NAME=earlyb_salon  DB_USER=postgres  DB_PASSWORD=...  DB_HOST=localhost  DB_PORT=5432
#   JWT_SECRET=<random-secret>

python manage.py migrate
python manage.py seed_data   # optional demo data
python manage.py runserver  # http://localhost:8000
```

### Auth endpoints

- `POST /api/auth/login` — login by `unionId` or `email` (+ password); auto-creates the user
- `GET /api/auth/me` — current user (session cookie)
- `POST /api/auth/logout`
- `POST /api/auth/google` / `POST /api/auth/google/callback`
- `POST /api/auth/apple` / `POST /api/auth/apple/callback`

### Shop endpoints

- `GET /api/shop/products` / `GET /api/shop/products/<id>`
- `GET /api/shop/salons` / `GET /api/shop/salons/<id>`
- `GET /api/shop/services` / `GET /api/shop/services/<id>`
- `GET /api/shop/hairstyles`

### Admin endpoints (role-gated)

- `GET /api/admin/dashboard`, `/api/admin/platform-stats`, `/api/admin/top-salons`
- `GET /api/admin/users`, `PATCH /api/admin/users/<id>/role`, `POST /api/admin/users/<id>/suspend`
- `GET /api/admin/stylists`, `GET /api/admin/kyc/pending`, `POST /api/admin/kyc/<id>/approve`
- `GET /api/admin/transactions`, `/api/admin/disputes`
- `GET /api/admin/reviews`, `POST /api/admin/reviews/<id>/moderate`

## Frontend

Requirements: Node 20+.

```bash
cd frontend
npm install
npm run dev   # http://localhost:3000, proxies /api to http://localhost:8000
```

Production build:

```bash
npm run build   # outputs to frontend/dist
npm run check   # type check (tsc -b)
```
