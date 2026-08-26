# Paradigm backend (Django + DRF)

## Requirements

- Python 3.9+
- Node.js for the frontend (separate)

By default the backend uses **SQLite** (`db.sqlite3`). For PostgreSQL:

```bash
docker compose up -d
# then in .env:
DATABASE_URL=postgres://paradigm:paradigm@localhost:5432/paradigm
```

Then `migrate` + `seed_content` again.

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

python manage.py migrate
python manage.py seed_content
python manage.py runserver
```

- API: http://127.0.0.1:8000/api/
- Admin: http://127.0.0.1:8000/admin/
- Student cabinet: http://127.0.0.1:8000/cabinet/

### Demo users (password from `DEMO_PASSWORD`, default `demo1234`)

| User | Role | Where |
|------|------|--------|
| `admin` | admin | `/admin/` |
| `manager` | manager | `/admin/` (CRM + students) |
| `student` | student | `/cabinet/` |

## Frontend

In `frontend/.env`:

```
VITE_API_URL=http://127.0.0.1:8000/api
```

Then `npm run dev` in `frontend/`.

## Public API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/courses` | List courses |
| GET | `/api/courses/:id` | Course detail |
| GET | `/api/reviews?course=&_page=&_per_page=` | Text reviews (json-server pagination) |
| GET | `/api/faq` | FAQ |
| GET | `/api/pricing` | Pricing plans |
| GET | `/api/socials` | Social links |
| GET | `/api/video` | Video reviews |
| POST | `/api/leads` | Lead form (`name`, `tel`, `message`) |
