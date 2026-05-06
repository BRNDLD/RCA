# RCA (Flask + React)

Prototipo rápido basado en el formato **FADM02-1** (Excel) para crear y gestionar un RCA/SAM con un flujo tipo wizard.

## URLs en Producción

- **Backend**: https://rca-backend-api-b6bjg8dmgsbzdfak.canadacentral-01.azurewebsites.net
- **Frontend**: https://orange-sand-073dbbc1e.7.azurestaticapps.net

## Estructura

- `backend/`: API REST en Flask + SQLite
- `frontend/`: UI React (Vite) con variable `VITE_API_BASE` para conectar al backend

## Requisitos (Desarrollo Local)

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

**Endpoints principales:**
- `GET /api/health` - Verificar salud
- `GET /api/options` - Opciones internas (orígenes, sistemas, categorías, etc.)
- `GET /api/rcas?status=draft|published` - Listar RCAs
- `POST /api/rcas` - Crear RCA
- `PUT /api/rcas/{id}` - Actualizar RCA
- `POST /api/rcas/{id}/publish` - Publicar RCA

> Nota: Si cambias el modelo, puede que necesites borrar `backend/rca.sqlite3` (es un prototipo sin migraciones).

## Frontend (React)

### 1) Instalar dependencias

```powershell
cd .\frontend
npm install
```

### 2) Iniciar dev server

```powershell
cd .\frontend
npm run dev
```

Abrir: `http://localhost:5173`

El frontend usa `VITE_API_BASE` para llamar al backend.

## Azure (Despliegue CI/CD Automático)

### Backend: Azure App Service

- Deployado desde rama `main` → GitHub Actions automático
- Startup Command: `gunicorn wsgi:app --bind 0.0.0.0:$PORT --workers 2`
- Database: SQLite local

### Frontend: Azure Static Web Apps

- Deployado automáticamente desde rama `main` vía GitHub Actions
- Build: `npm run build` en directorio `./frontend`
- Output: `frontend/dist`

**Variable de entorno (en GitHub Actions workflow):**

```yaml
env:
  VITE_API_BASE: https://rca-backend-api-b6bjg8dmgsbzdfak.canadacentral-01.azurewebsites.net
```

El frontend usa esta variable para conectar al backend en Azure.

## Desarrollo Local (2 terminales)

**Terminal 1 (Backend):**
```powershell
cd .\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
py .\wsgi.py
```

**Terminal 2 (Frontend):**
```powershell
cd .\frontend
npm install
npm run dev
```

## Notas

- En desarrollo, el frontend hace proxy a `/api` hacia el backend local
- En producción, el frontend usa `VITE_API_BASE` para conectar a Azure
- Base de datos: SQLite (cambios al modelo pueden requerir borrar `backend/rca.sqlite3`)
