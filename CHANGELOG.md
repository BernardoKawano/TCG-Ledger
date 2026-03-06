# Changelog

## [1.0.0] - 2025-03-06

### Implementado

**Backend (Python/FastAPI)**
- Epic E1: Infra & Auth — FastAPI, Docker, PostgreSQL, Redis, JWT, migrações Alembic
- Epic E2: Catálogo — Modelos TCG, CardSet, Card, CardVariant, VariantAttribute, seed, busca
- Epic E3: Scanner — POST /scan, integração Vision (Google/AWS), storage S3, matching fuzzy
- Epic E4: Preços — PriceSource, PriceSnapshot, GET /prices, workers Celery (stub)
- Epic E5: Coleção — CollectionItem, CRUD completo, GET /collection
- Epic E6: Portfólio — GET /collection/portfolio, valor total, mudanças diária/semanal
- Epic E7: Alertas — AlertRule, AlertEvent, GET/POST /alerts
- Epic E8: Exports — POST /exports (JSON/CSV síncrono)

**Mobile (React Native/Expo)**
- Setup Expo Router, Zustand, Axios
- Telas: Login, Registro, Home, Scan (galeria), Coleção, Portfólio
- Auth com SecureStore, API client com JWT

### Próximos passos
- Integração real com fontes de preço (TCGplayer, LigaMagic)
- Workers Celery para atualização de preços e alertas
- Sync offline (WatermelonDB) no mobile
- Câmera nativa para scan (além da galeria)
