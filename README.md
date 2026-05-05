# RCA (Flask + React)

Prototipo rápido basado en el formato **FADM02-1** (Excel) para crear y gestionar un RCA/SAM con un flujo tipo wizard (como el mock).

## Estructura

- `backend/`: API REST en Flask + SQLite
- `frontend/`: UI React (Vite) con proxy a `/api`

## Requisitos

- Windows
- Python 3.11+ (probado con Python 3.13)
- Node.js 18+ (probado con Node 22)

## Backend (Flask)

### 1) Crear entorno virtual e instalar dependencias

```powershell
cd .\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2) Iniciar API

```powershell
cd .\backend
.\.venv\Scripts\Activate.ps1
py .\wsgi.py
```

La API queda en `http://127.0.0.1:5000`.

Endpoints principales:
- `GET /api/health`
- `GET /api/options` (listas internas; el Excel es solo guía)
- `GET /api/rcas?status=draft|published`
- `POST /api/rcas`
- `PUT /api/rcas/{id}`
- `POST /api/rcas/{id}/publish`

> Nota: si cambias el modelo, puede que necesites borrar `backend/rca.sqlite3` (es un prototipo sin migraciones).

## Frontend (React)

### 1) Instalar dependencias

```powershell
cd .\frontend
npm install
```

### 2) Iniciar UI

```powershell
cd .\frontend
npm run dev
```

Abrir: `http://localhost:5173`

El frontend usa proxy de Vite para llamar al backend en `/api`.

## Azure (despliegue rápido)

### Backend: Azure App Service (Linux)

- Publica solo la carpeta `backend/`.
- En App Service configura el **Startup Command**:

```bash
gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 2
```

Opcional (recomendado para producción): define `DATABASE_URL` apuntando a un DB administrado (Azure Database for PostgreSQL/Azure SQL). Si no, usa SQLite (sirve para demo / una sola instancia).

### Frontend: Azure Static Web Apps

- Build: `npm run build`
- Output: `frontend/dist`

Para que el frontend llame al backend en Azure, define esta variable de entorno en el build de Static Web Apps:

- `VITE_API_BASE=https://<TU-APP>.azurewebsites.net`

(En local puedes dejarla vacía: el proxy de Vite usa `/api` hacia `http://127.0.0.1:5000`.)

## Comandos rápidos (2 terminales)

**Terminal 1 (API):**
```powershell
cd .\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
py .\wsgi.py
```

**Terminal 2 (UI):**
```powershell
cd .\frontend
npm install
npm run dev
```


Deploy:

```

rm -rf RCA
git clone https://github.com/BRNDLD/RCA.git
cd RCA/backen


az webapp config appsettings set \
  --resource-group rca-backend-api_group-b22b \
  --name rca-backend-api \
  --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true

az webapp config appsettings set \
  --resource-group rca-backend-api_group-b22b \
  --name rca-backend-api \
  --settings DATABASE_URL="sqlite:////home/site/rca.db"

az webapp config set \
  --resource-group rca-backend-api_group-b22b \
  --name rca-backend-api \
  --startup-file "gunicorn --bind=0.0.0.0 --timeout 600 wsgi:app"

zip -r backend.zip . \
  -x "*.git*" "__pycache__/*" "*.pyc" "app.py"

unzip -l backend.zip | head

az webapp deploy \
  --resource-group rca-backend-api_group-b22b \
  --name rca-backend-api \
  --src-path backend.zip \
  --type zip \
  --clean true

curl https://rca-backend-api-b6bjg8dmgsbzdfak.canadacentral-01.azurewebsites.net/api/health
```

