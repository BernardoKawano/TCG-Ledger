# TCG Ledger — Auditoria de Design UI/UX

**Data:** 2025-03-06  
**Escopo:** App mobile (React Native / Expo)

---

## Observação preliminar

Os arquivos exigidos pelo protocolo (**DESIGN_SYSTEM**, **FRONTEND_GUIDELINES**, **APP_FLOW**, **PRD**, **TECH_STACK**, **progress**, **LESSONS**) **não existem** neste projeto. Esta auditoria foi baseada no código-fonte e no README. A criação de um **DESIGN_SYSTEM.md** com tokens formais é **obrigatória** antes de qualquer implementação de alterações visuais.

---

## DESIGN AUDIT RESULTS

### Overall Assessment

O app tem uma base escura coerente (slate) e hierarquia funcional, mas sofre de valores hardcoded, ausência de tokens de design, inconsistências de espaçamento/raio, falta de SafeArea, e estados vazios/loading pouco refinados. A sensação atual é de "funcional", não de "premium". A hierarquia visual e o ritmo podem ser elevados significativamente sem alterar funcionalidades.

---

## PHASE 1 — Crítico
*Problemas de hierarquia visual, usabilidade, responsividade ou consistência que prejudicam a experiência.*

| Tela/Componente | Problema | Solução | Motivo |
|-----------------|----------|---------|--------|
| **Todas as telas** | `paddingTop: 48` fixo; ausência de `SafeAreaView` | Usar `useSafeAreaInsets()` e `paddingTop: insets.top` (ou container com `SafeAreaProvider`) | Notches, ilhas dinâmicas e status bar podem sobrepor título; experiência ruim em iPhones modernos. |
| **Root Layout** | Sem `StatusBar` explícito | Adicionar `<StatusBar style="light" />` no `_layout.tsx` | Fundo escuro com barra de status clara prejudica leitura e contraste. |
| **Login / Register** | Ordem título/subtítulo invertida entre as telas | Padronizar: `Título principal` (nome da ação) + `TCG Ledger` (subtítulo) em ambas | Consistência e clareza do fluxo. |
| **Auth (Login/Register)** | Inputs sem `placeholderTextColor` | `placeholderTextColor: tokens.textMuted` | Placeholders invisíveis ou de baixo contraste em dark mode. |
| **Home** | Conteúdo em `View` sem scroll | Envolver em `ScrollView` quando necessário ou `KeyboardAwareScrollView` | Em telas pequenas ou com teclado, conteúdo pode ficar cortado. |
| **Collection (FlatList)** | `ListEmptyComponent` sem `contentContainerStyle` com `flexGrow` | `contentContainerStyle={{ flexGrow: 1 }}` na FlatList | Estado vazio centralizado verticalmente; layout mais estável. |
| **Scan** | Botão primário único ocupa pouco destaque visual | Manter como CTA principal, mas garantir que seja o elemento dominante (já é; validar hierarquia) | Ação principal deve ser óbvia em ~2 segundos. |
| **Tab Bar** | Sem ícones; só texto | Adicionar ícones (ex.: @expo/vector-icons) por tab | Navegação mais rápida e reconhecível; alinhado com padrão mobile. |
| **Cores hardcoded** | Valores hex espalhados em 7 arquivos | Extrair para `src/theme/tokens.ts` e referenciar em todos os estilos | Base para consistência, manutenção e futura theming. |

**Revisão Phase 1:** Prioridade máxima em SafeArea, StatusBar, tokens de cor e consistência entre Login/Register. São mudanças que impedem que o app pareça “quebrado” em dispositivos reais e garantem uma base visual sólida.

---

## PHASE 2 — Refino
*Ajustes de espaçamento, tipografia, cor, alinhamento e ícones.*

| Tela/Componente | Problema | Solução | Motivo |
|-----------------|----------|---------|--------|
| **Espaçamento** | `padding` e `margin` inconsistentes (12, 16, 20, 24, 48) | Usar escala de spacing do DESIGN_SYSTEM: 4, 8, 12, 16, 24, 32, 48 | Ritmo visual previsível; menos ruído. |
| **Border radius** | Mistura de 8, 12, 16 sem regra | Tokens: `radiusSm: 8`, `radiusMd: 12`, `radiusLg: 16`; cards = `radiusMd`, botões = `radiusMd`, modais/caixas = `radiusLg` | Consistência entre componentes. |
| **Tipografia** | Font sizes soltos (12–32) | Escala: `xs: 12`, `sm: 14`, `base: 16`, `lg: 18`, `xl: 24`, `2xl: 28`, `3xl: 32` | Hierarquia clara; menos variação arbitrária. |
| **Home** | Cards com `borderWidth: 1, borderColor`; outros sem | Escolher um padrão: ou todos com borda sutil ou todos sem; preferir sombra suave em vez de borda pesada | Consistência visual entre cards. |
| **Portfolio** | `changeBox` e `tcgRow` com `borderRadius` diferente (12 vs 8) | Unificar para `radiusMd` em elementos de lista/cards secundários | Alinhamento com o restante do sistema. |
| **Collection** | Cards sem separação visual entre lista e background | Manter contraste atual (card escuro em fundo mais escuro); garantir que `card` use token de surface | Clareza de agrupamento. |
| **Scan – candidatos** | `borderLeftWidth: 4` como único indicador | Manter, mas garantir que a cor use token `primary`; considerar hover/press feedback | Feedback visual consistente. |
| **Tab Bar** | `tabBarStyle` com `backgroundColor` hardcoded | Usar token `surface` ou equivalente do DESIGN_SYSTEM | Theming e manutenção. |

**Revisão Phase 2:** Estas alterações criam ritmo e consistência sem mudar fluxos. Devem ser aplicadas após Phase 1 estar estável.

---

## PHASE 3 — Polish
*Microinterações, transições, empty states, loading, erros e detalhes que elevam a sensação premium.*

| Tela/Componente | Problema | Solução | Motivo |
|-----------------|----------|---------|--------|
| **Loading** | `ActivityIndicator` + texto genérico | Skeleton ou layout placeholder que imita a tela real (ex.: Portfolio, Collection) | Sensação de progresso e menos "congelamento". |
| **Empty states** | Texto puro, sem CTA ou ilustração | Texto + botão de ação (ex.: "Escanear primeira carta" na Collection vazia) | Orientação clara para o próximo passo. |
| **Touch feedback** | `TouchableOpacity` com `opacity` padrão | Usar `Pressable` com `style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}` ou equivalente | Feedback tátil consistente. |
| **Input focus** | Sem `borderColor` ou `outline` em foco | `borderWidth: 2` e `borderColor: primary` quando focado | Acessibilidade e indicação de foco. |
| **Erros** | Apenas `Alert.alert` | Manter Alert para erros críticos; para erros inline (form), mostrar mensagem abaixo do campo com `color: error` | Erros mais próximos do contexto. |
| **Transições** | Navegação padrão do Stack/Tabs | Configurar `animation` suave se suportado (Expo Router); evitar transições bruscas | Sensação de fluidez. |
| **Portfolio – valor** | Número grande sem separador de milhares | `toLocaleString` ou similar para `1.234,56` (locale pt-BR) | Legibilidade de valores grandes. |
| **Collection – preço** | `$` hardcoded | Usar `data.currency` da API ou token de moeda padrão | Suporte a múltiplas moedas. |

**Revisão Phase 3:** Melhoram a percepção de qualidade sem alterar features. Aplicar após Phase 2, com foco em empty/loading e feedback de toque.

---

## DESIGN_SYSTEM — Tokens propostos

*(Estes tokens devem ser aprovados e adicionados a `DESIGN_SYSTEM.md` antes da implementação.)*

```ts
// src/theme/tokens.ts (proposto)

export const colors = {
  background: '#0f172a',    // slate-900
  surface: '#1e293b',      // slate-800
  surfaceElevated: '#334155', // slate-700
  text: '#f8fafc',         // slate-50
  textMuted: '#94a3b8',    // slate-400
  textSubtle: '#64748b',   // slate-500
  primary: '#3b82f6',      // blue-500
  primaryForeground: '#ffffff',
  success: '#22c55e',      // green-500
  error: '#ef4444',        // red-500
  link: '#60a5fa',         // blue-400
};

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48,
};

export const radius = {
  sm: 8, md: 12, lg: 16,
};

export const typography = {
  xs: { fontSize: 12 }, sm: { fontSize: 14 }, base: { fontSize: 16 },
  lg: { fontSize: 18 }, xl: { fontSize: 24 }, '2xl': { fontSize: 28 }, '3xl': { fontSize: 32 },
  bold: { fontWeight: '700' as const }, semibold: { fontWeight: '600' as const },
};
```

---

## IMPLEMENTATION NOTES FOR BUILD AGENT

*(Valores exatos para execução sem interpretação de design.)*

### Phase 1

| Arquivo | Componente/Propriedade | Valor antigo | Valor novo |
|---------|------------------------|--------------|------------|
| `app/_layout.tsx` | Adicionar | — | `import { StatusBar } from 'expo-status-bar'; <StatusBar style="light" />` |
| `app/(auth)/login.tsx` | Ordem título/subtítulo | `TCG Ledger` / `Entre na sua conta` | `Entre na sua conta` (título) / `TCG Ledger` (subtítulo) |
| `app/(auth)/register.tsx` | Ordem título/subtítulo | `Criar conta` / `TCG Ledger` | Manter `Criar conta` (título) / `TCG Ledger` (subtítulo) — já consistente com Login ajustado |
| `app/(auth)/login.tsx` | TextInput placeholderTextColor | (ausente) | `#94a3b8` ou token `textMuted` |
| `app/(auth)/register.tsx` | TextInput placeholderTextColor | (ausente) | `#94a3b8` ou token `textMuted` |
| `app/(tabs)/index.tsx` | Container | `View` | `ScrollView` com `contentContainerStyle={{ paddingBottom: 32 }}` |
| `app/(tabs)/collection.tsx` | FlatList contentContainerStyle | (ausente) | `{ flexGrow: 1 }` |
| `app/(tabs)/_layout.tsx` | Tab icons | (ausente) | Adicionar ícones por tab (Home, Scan, Collection, Portfolio) |
| **Novo** | `src/theme/tokens.ts` | — | Criar arquivo com `colors`, `spacing`, `radius`, `typography` |
| **Todas as telas** | SafeArea | (ausente) | Envolver conteúdo em container com `useSafeAreaInsets()` e `paddingTop: insets.top` |

### Phase 2

| Arquivo | Propriedade | Valor antigo | Valor novo |
|---------|-------------|--------------|------------|
| Todos | Cores hardcoded | `#0f172a`, `#1e293b`, etc. | Importar de `tokens.ts` |
| Todos | padding/margin | Valores soltos | Escala `spacing` (4, 8, 12, 16, 24, 32, 48) |
| Todos | borderRadius | 8, 12, 16 misturados | `radius.sm`, `radius.md`, `radius.lg` conforme tipo de componente |

### Phase 3

| Arquivo | Mudança |
|---------|---------|
| `app/(tabs)/collection.tsx` | `ListEmptyComponent`: adicionar botão "Escanear carta" → `router.push('/(tabs)/scan')` |
| `app/(tabs)/portfolio.tsx` | Empty state: adicionar botão "Ver coleção" ou "Escanear carta" |
| Todos os TouchableOpacity | Avaliar troca por `Pressable` com feedback de `pressed` |
| `app/(auth)/login.tsx` e `register.tsx` | Input: `style` dinâmico com `borderColor: focus ? primary : surfaceElevated` |
| `app/(tabs)/portfolio.tsx` | `total_value`: usar `.toLocaleString('pt-BR', { minimumFractionDigits: 2 })` |
| `app/(tabs)/collection.tsx` | Preço: usar `currency` da API em vez de `$` fixo |

---

## Próximos passos

1. **Criar `docs/DESIGN_SYSTEM.md`** com os tokens acima e regras de uso.
2. **Aprovar as fases** — o usuário pode reordenar, cortar ou modificar itens.
3. **Implementar Phase 1** — após aprovação, executar de forma cirúrgica.
4. **Revisar resultado** — antes de passar para Phase 2.
5. Repetir para Phase 2 e Phase 3.

**Nenhuma alteração será implementada até aprovação explícita.**
