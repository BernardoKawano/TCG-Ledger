# TCG Ledger

Portfolio tracker para colecionadores de TCG — scan de cartas, preços, gestão de coleção e alertas.

## Estrutura do projeto

```
TCG Ledger/
├── backend/          # API Python FastAPI
├── mobile/           # App React Native (Expo)
└── README.md
```

## Backend (Python)

### Requisitos
- Python 3.12+
- PostgreSQL 16
- Redis

### Setup

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
```

### Configuração

Copie `.env.example` para `.env` e preencha:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tcg_ledger
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=...  # openssl rand -hex 32
```

### Executar

```bash
# Com Docker (Postgres + Redis)
docker-compose up -d db redis

# Migrações
alembic upgrade head

# Seed do catálogo (opcional)
python scripts/seed_catalog.py

# API
uvicorn src.main:app --reload
```

API disponível em http://localhost:8000 — docs em `/docs`.

## Mobile (React Native / Expo)

### Setup

```bash
cd mobile
npm install
```

### Configuração

Crie `mobile/.env` (opcional):

```
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api/v1   # Android emulador
# ou
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1  # iOS sim / web
```

### Executar

```bash
npx expo start
```

Use o app Expo Go no celular ou emulador para testar.

## Endpoints principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /api/v1/auth/register | Registrar |
| POST | /api/v1/auth/login | Login |
| POST | /api/v1/scan | Enviar imagem para identificar carta |
| GET | /api/v1/catalog/cards/search | Buscar cartas |
| GET | /api/v1/prices | Preços de uma variante |
| POST | /api/v1/collection/items | Adicionar à coleção |
| GET | /api/v1/collection | Listar coleção |
| GET | /api/v1/collection/portfolio | Dashboard portfólio |
| POST | /api/v1/exports | Exportar coleção (JSON/CSV) |

## Changelog

- **v1.0** — MVP: Auth, catálogo, scan, preços, coleção, portfólio, alertas, exports, app mobile.
