# LESSONS — Design

Padrões e correções de sessões anteriores.

## Phase 1 (2025-03-06)

- **Tokens antes de hardcode**: Cores e espaçamentos hardcoded geravam inconsistência. Centralizar em `src/theme/tokens.ts`.
- **SafeArea obrigatório**: `paddingTop: 48` fixo quebra em dispositivos com notch. Usar `useSafeAreaInsets()`.
- **StatusBar em dark mode**: Fundo escuro exige `StatusBar style="light"` explícito.
- **Auth consistente**: Login e Register devem ter mesma hierarquia (ação = título, marca = subtítulo).
- **FlatList empty state**: `contentContainerStyle={{ flexGrow: 1 }}` centraliza o empty state verticalmente.
- **Tab bar com ícones**: Navegação mais rápida e reconhecível em mobile.

## Phase 2 e 3 (2025-03-06)

- **Empty states com CTA**: Texto sozinho não orienta; botão "Escanear carta" guia o próximo passo.
- **toLocaleString pt-BR**: Valores monetários com separador de milhares (1.234,56) melhoram leitura.
- **Pressable > TouchableOpacity**: Feedback explícito via `style={({ pressed }) => [...]}` para controle fino.
- **Moeda**: Collection não retorna currency na API; usar fallback DEFAULT_CURRENCY até backend suportar.
