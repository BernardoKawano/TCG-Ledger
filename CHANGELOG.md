# Changelog

## [1.3.0] - 2025-03-06

### Melhorias implementadas (Lacunas do plano)

**Fluxo Scan → Coleção**
- Botão "Adicionar à coleção" em cada candidato do scan
- Modal com quantidade, condição, foil e notas antes de adicionar

**Busca manual**
- Nova tela `/(tabs)/search` para buscar cartas por nome
- Link "Buscar manualmente" no Scan e na Coleção vazia

**Exports**
- Botão "Exportar" na Coleção com opções JSON e CSV
- Integração com expo-file-system e expo-sharing

**Coleção**
- Editar itens (quantidade, condição, foil, notas)
- Remover itens com confirmação

**Backend**
- Scanner exige autenticação
- Workers Celery implementados: update_prices_from_source, process_alert_detection, generate_export
- Rate limiting: auth (5–10/min), scan (20/min)
- Validação de senha mínima 8 caracteres
- CORS configurável; SECRET_KEY validada em produção
- max_upload_bytes parametrizado

**Tela de Alertas**
- Nova aba Alertas com regras e eventos
- Criar regras tipo portfolio com threshold_pct

**UX**
- Copy corrigido: "galeria" em vez de "câmera" no Scan
- Redirecionamento para login em 401
- Empty state de erro com retry em Collection e Portfolio

**Documentação**
- `instructions.md` criado

**Testes**
- test_catalog.py, test_collection.py, test_scanner.py

## [1.2.0] - 2025-03-06

### Design Phase 2 e 3 — UI/UX

- Phase 2: tcgRow radius unificado, Scan com ScrollView, paddingBottom na Collection
- Phase 3: Empty states com CTA "Escanear carta" (Collection, Portfolio)
- Formatação pt-BR para valores (toLocaleString)
- Collection: preço com moeda USD em vez de $ fixo
- Pressable em lugar de TouchableOpacity (Home, Scan, Auth, empty states)
- Feedback tátil (opacity) em todos os elementos pressionáveis

## [1.1.0] - 2025-03-06

### Design Phase 1 — UI/UX

- Design system: tokens em `src/theme/tokens.ts` (cores, spacing, radius, typography)
- StatusBar light, SafeAreaProvider no root
- SafeAreaInsets em todas as telas (auth, tabs)
- Login/Register: consistência título/subtítulo, placeholderTextColor
- Home: ScrollView, tokens, cards sem borda
- Tabs: ícones Ionicons (home, scan, folder-open, pie-chart)
- Collection: contentContainerStyle flexGrow, tokens
- Scan, Portfolio: SafeArea, tokens
- Cores e espaçamentos migrados para tokens em todas as telas

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
