# Coal CRM Backend (Lightweight)

A minimal Express + SQLite backend designed for single-user, low data volume scenarios. Optimized for easy deployment on Linux.

## Features
- SQLite file DB (no external database needed)
- REST endpoints: customers, suppliers, delivery batches, batch payments
- CORS enabled for the frontend at `http://localhost:3001`
- Dockerfile for simple Linux deployment

## Endpoints (summary)
- `GET /health`
- Customers: `GET /api/customers`, `POST /api/customers`, `PUT /api/customers/:id`, `DELETE /api/customers/:id`
- Suppliers: `GET /api/suppliers`, `POST /api/suppliers`, `PUT /api/suppliers/:id`, `DELETE /api/suppliers/:id`
- Batches: `GET /api/batches`, `POST /api/batches`
- Batch payments: `POST /api/batches/:id/payments`, `DELETE /api/batches/:id`

## Local Run
```bash
cd coal-crm-backend
npm install
cp .env.example .env
npm run start
# Server at http://localhost:4000
```

## Linux Deployment

### Option A: Docker
```bash
cd coal-crm-backend
docker build -t coal-crm-backend:latest .
docker run -d \
  -p 4000:4000 \
  -v $(pwd)/data:/app/data \
  --name coal-backend coal-crm-backend:latest
```

### Option B: Bare-metal (systemd)
1. Install Node.js 18+ on Linux
2. Copy folder to server and run `npm install`
3. Create `data/` directory and `.env`
4. Use `screen`/`tmux` or systemd service:

Example systemd unit `/etc/systemd/system/coal-backend.service`:
```
[Unit]
Description=Coal CRM Backend
After=network.target

[Service]
WorkingDirectory=/opt/coal-crm-backend
Environment=PORT=4000
Environment=DB_FILE=/opt/coal-crm-backend/data/app.db
ExecStart=/usr/bin/node /opt/coal-crm-backend/src/index.js
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now coal-backend
```

## Config
Edit `.env`:
```
PORT=4000
CORS_ORIGIN=http://localhost:3001
DB_FILE=./data/app.db
```

## Notes
- Data persists under `coal-crm-backend/data/app.db`
- For very low usage, `better-sqlite3` is efficient and simple
- Backup strategy: copy the `data/app.db` file periodically

