# Konekt Mobile — React Native (Expo)

App para **clientes finais** visualizarem produtos e fazer pedidos por tenant.

## Requisitos

- **Node.js 20+** (Expo SDK 54). Com nvm: `nvm install 22.23.1` e `nvm use 22.23.1`
- Expo Go no celular ou emulador Android/iOS
- API `konekt-back` rodando

## Configuração

```bash
cp .env.example .env
```

Ajuste `EXPO_PUBLIC_API_URL`:

| Ambiente | URL |
|----------|-----|
| Android Emulator | `http://10.0.2.2:3000/api` |
| iOS Simulator | `http://localhost:3000/api` |
| Celular físico | `http://SEU_IP:3000/api` |

## Testar Android + iOS no Windows

No Windows **não existe simulador iOS nativo** (só no Mac). A solução instalada combina:

| Plataforma | Ferramenta | O que simula |
|------------|------------|--------------|
| **Android** | Emulador `Konekt_Pixel_7` + Expo Go | App real no Android |
| **iOS** | **Responsively App** + Expo Web | iPhone no navegador (mesmo código React Native) |

### Setup (só na 1ª vez)

```bash
npm run setup:android    # SDK + emulador Android
npm run install:expo-go  # Expo Go no emulador (com emulador aberto)
```

Feche e reabra o terminal após o setup.

### Rodar os dois (Android + iOS)

**Terminal 1 — API:**
```bash
cd konekt-back
npm run dev
```

**Terminal 2 — Android:**
```bash
cd konekt-mobile
npm run emulator          # aguarde o Android iniciar
npm run install:expo-go   # só na 1ª vez
npm run android           # abre o app no emulador
```

**Terminal 3 — iOS (preview):**
```bash
cd konekt-mobile
npm run ios               # inicia versão web
```
Em outro momento (com `npm run ios` rodando), abra outro terminal:
```bash
npm run ios-preview       # abre Responsively com moldura iPhone
```
No Responsively, escolha **iPhone 14** no painel esquerdo.

### Comandos resumidos

| Comando | Função |
|---------|--------|
| `npm run emulator` | Abre emulador Android |
| `npm run android` | App no emulador Android |
| `npm run ios` | App na web (base para preview iOS) |
| `npm run ios-preview` | Abre Responsively (moldura iPhone) |
| `npm run web` | Igual ao `ios` (navegador) |

### Celular físico (recomendado)

**Terminal 1 — API:**
```bash
cd konekt-back
npm run dev
```
Anote o endereço `Network:` que aparece no console (ex.: `http://192.168.x.x:3000`).

**Terminal 2 — Mobile:**
```bash
cd konekt-mobile
npm run phone
```

1. Celular e PC na **mesma rede Wi-Fi**
2. Instale o **Expo Go** (Play Store / App Store)
3. Escaneie o **QR Code** no terminal (Android: pelo Expo Go · iOS: pela Câmera)
4. O script `npm run phone` configura a API automaticamente com o IP do seu PC

Se o app abrir mas não carregar lojas, libere a **porta 3000** no Firewall do Windows ou confira se a API está rodando.

### Android com cabo USB

**Nao instala nem remove nada do celular** — usa o Expo Go que voce ja tem na Play Store.

**Terminal 1 — API:**
```bash
cd konekt-back
npm run dev
```

**Terminal 2 — Metro / Expo:**
```bash
cd konekt-mobile
npm run phone:usb
```

No celular: abra o **Expo Go** e **escaneie o QR Code** do terminal.

| Comando | Funcao |
|---------|--------|
| `npm run phone:usb` | Inicia o projeto (Expo Go ja instalado) |
| `npm run phone:usb:clear` | Igual, limpando cache |

> Instalar Expo Go via cabo (so emulador): `npm run install:expo-go`

| Comando | Função |
|---------|--------|
| `npm run phone` | Expo para celular físico (detecta IP) |
| `npm run phone:clear` | Igual, limpando cache do Metro |

### URLs da API

| Ambiente | `EXPO_PUBLIC_API_URL` |
|----------|------------------------|
| Android Emulator | `http://10.0.2.2:3000/api` (`.env`) |
| iOS / Web (Responsively) | `http://localhost:3000/api` (script `npm run ios`) |
| Celular físico | `http://SEU_IP:3000/api` |

### iPhone real (opcional)

Instale **Expo Go** na App Store, rode `npm start` e escaneie o QR Code — teste iOS nativo sem Mac.

## Testes

```bash
npm test
```

# Konekt Mobile — React Native (Expo)

App estilo **marketplace** (iFood): o cliente se cadastra **uma vez** e pode pedir em **qualquer loja**.

## Fluxo do app

1. **Home** — lista de lojas disponíveis
2. **Cadastro / Login** — conta única (não é por loja)
3. **Entrar na loja** — ver produtos, categorias, carrinho
4. **Pedido** — checkout, pagamento, status
5. **Perfil** — dados + histórico de pedidos em **todas** as lojas

## Cliente de teste

```
E-mail: cliente@konekt.com
Senha: senha123
```

Funciona em **alpha**, **beta** ou qualquer loja cadastrada.

## API utilizada

| Endpoint | Descrição |
|----------|-----------|
| `GET /store/tenants` | Listar lojas |
| `POST /store/auth/register` | Cadastro global |
| `POST /store/auth/login` | Login global |
| `GET /store/auth/orders` | Meus pedidos (todas as lojas) |
| `GET /store/:slug/products` | Produtos da loja |
| `POST /store/:slug/orders` | Criar pedido na loja |

## Estrutura

```
src/
├── components/    # UI reutilizável
├── contexts/      # Tenant, Auth, Cart
├── navigation/    # (em App.tsx)
├── screens/       # Telas
├── services/      # HTTP + API store
├── storage/       # SecureStore (JWT)
├── validators/    # Validações de formulário
├── utils/         # Erros, config
└── types/         # TypeScript
```
