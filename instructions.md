# Instruções do Projeto TCG Ledger

Este documento descreve as convenções, requisitos e fluxos do projeto para alinhamento com agentes e desenvolvedores.

## Visão geral

TCG Ledger é um portfolio tracker para colecionadores de TCG. Permite scan de cartas, gestão de coleção, preços, alertas e exportação.

## Stack técnico

- **Backend:** Python 3.12, FastAPI, PostgreSQL, Redis, Celery
- **Mobile:** React Native (Expo), TypeScript, Zustand

## Convenções de código

1. **Backend:** Use Pydantic para schemas, SQLAlchemy 2.x para ORM. Padronize em `src.*`.
2. **Mobile:** Use tokens do design system (`src/theme/tokens.ts`). Sem valores hardcoded.
3. **Testes:** Cada módulo novo deve ter testes. Priorize exemplos reais.
4. **Documentação:** Atualize `CHANGELOG.md` em alterações relevantes.

## Fluxos principais

### Scan → Coleção
1. Usuário escolhe imagem (galeria)
2. API retorna candidatos (OCR + matching)
3. Usuário toca "Adicionar à coleção" em um candidato
4. Modal com quantidade, condição, foil, notas
5. POST `/collection/items`

### Busca manual
- Tela `/(tabs)/search` acessível via link "Buscar manualmente"
- GET `/catalog/cards/search?q=...`
- Mesmo modal de adicionar à coleção

### Exports
- Botão "Exportar" na tela Coleção
- POST `/exports?format=json` ou `format=csv`
- Compartilhamento via Share API

### Alertas
- Tela "Alertas" nas tabs
- Regras tipo portfolio com `threshold_pct`
- Eventos gerados pelo worker `process_alert_detection`

## Variáveis de ambiente

### Backend
- `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY` (obrigatórios em produção)
- `DEBUG=true` em desenvolvimento (desativa validação SECRET_KEY)
- `CORS_ORIGINS` para produção (ex: `https://app.example.com`)

### Mobile
- `EXPO_PUBLIC_API_URL`: base da API (ex: `http://10.0.2.2:8000/api/v1` para Android emulador)

## Segurança

- Scanner e auth exigem autenticação
- Rate limit: login 10/min, register 5/min, scan 20/min
- Senha mínima 8 caracteres

## Checklist para alterações

- [ ] Alinhado com este documento
- [ ] Testes adicionados/atualizados
- [ ] CHANGELOG atualizado
- [ ] Sem valores hardcoded (mobile)
