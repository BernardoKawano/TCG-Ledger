# TCG Ledger — Design System

Sistema visual do app mobile. Todos os valores visuais devem referenciar estes tokens. **Nenhum valor hardcoded** em componentes.

---

## Cores

| Token | Hex | Uso |
|-------|-----|-----|
| `background` | `#0f172a` | Fundo principal (slate-900) |
| `surface` | `#1e293b` | Cards, tab bar, caixas (slate-800) |
| `surfaceElevated` | `#334155` | Inputs, elementos elevados (slate-700) |
| `text` | `#f8fafc` | Texto principal (slate-50) |
| `textMuted` | `#94a3b8` | Subtítulos, descrições (slate-400) |
| `textSubtle` | `#64748b` | Texto terciário (slate-500) |
| `primary` | `#3b82f6` | Ações primárias, links, accents (blue-500) |
| `primaryForeground` | `#ffffff` | Texto sobre primary |
| `success` | `#22c55e` | Valores positivos, confirmação (green-500) |
| `error` | `#ef4444` | Erros, destaque negativo (red-500) |
| `link` | `#60a5fa` | Links secundários (blue-400) |

---

## Espaçamento

Escala base 4px. Use sempre múltiplos da escala.

| Token | Valor | Uso |
|-------|-------|-----|
| `xs` | 4 | Espaço mínimo entre elementos íntimos |
| `sm` | 8 | Entre ícone e texto, tags |
| `md` | 12 | Entre blocos pequenos |
| `lg` | 16 | Padding interno de cards, entre seções |
| `xl` | 24 | Margem entre seções principais |
| `xxl` | 32 | Entre blocos grandes |
| `xxxl` | 48 | Topo de tela (com SafeArea), seções hero |

---

## Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `radiusSm` | 8 | Linhas de lista, chips |
| `radiusMd` | 12 | Cards, botões, inputs |
| `radiusLg` | 16 | Modais, caixas de auth |

---

## Tipografia

| Token | fontSize | Uso |
|-------|----------|-----|
| `xs` | 12 | Labels, hints, confidence |
| `sm` | 14 | Descrições, subtítulos secundários |
| `base` | 16 | Corpo de texto, inputs |
| `lg` | 18 | Títulos de cards |
| `xl` | 24 | Títulos de tela |
| `2xl` | 28 | Títulos hero (ex.: auth) |
| `3xl` | 32 | Valores destacados (ex.: portfólio total) |

**Pesos:** `400` (regular), `600` (semibold), `700` (bold).

---

## Componentes

### Card
- `backgroundColor: surface`
- `borderRadius: radiusMd`
- `padding: lg`
- `marginBottom: md` (em listas)

### Botão primário
- `backgroundColor: primary`
- `color: primaryForeground`
- `borderRadius: radiusMd`
- `padding: lg`
- `fontWeight: 600`, `fontSize: base`

### Input
- `backgroundColor: surfaceElevated`
- `borderRadius: radiusMd`
- `padding: lg`
- `color: text`
- `placeholderTextColor: textMuted`

### Tab Bar
- `backgroundColor: surface`
- `tabBarActiveTintColor: primary`
- `tabBarInactiveTintColor: textSubtle`

---

## Regras

1. **Nenhum valor solto** — sempre referenciar tokens.
2. **Hierarquia** — uma ação primária por tela; secundárias em textMuted ou link.
3. **Espaço em branco** — quando em dúvida, prefira mais espaço.
4. **Consistência** — o mesmo componente deve parecer idêntico em todas as telas.
