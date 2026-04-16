# Backend API - Node.js + Express + Sequelize

API RESTful com autenticação JWT, upload de imagens, geração image-to-image com Stability AI e recuperação de senha via email.

## Estrutura do Projeto

```
backend/
├── config/
│   └── database.js       # Configuração do Sequelize
├── controllers/
│   ├── authController.js         # Login, Register, Profile
│   ├── imageController.js        # Upload, Analyze, List, Delete
│   └── passwordResetController.js # Forgot, Verify, Reset
├── middleware/
│   ├── authMiddleware.js         # JWT verification
│   ├── validationMiddleware.js   # Input validations
│   └── upload.js                 # Multer + Sharp (1200px WebP)
├── models/
│   ├── User.js           # User model with bcrypt
│   ├── Image.js          # Image model with generation metadata
│   └── PasswordReset.js  # Reset codes with expiry
├── routes/
│   ├── authRoutes.js           # /api/auth/*
│   ├── imageRoutes.js          # /api/images/*
│   ├── passwordResetRoutes.js  # /api/auth/forgot, verify, reset
│   └── protectedRoutes.js      # Example protected routes
├── services/
│   └── emailService.js   # Nodemailer configuration
├── uploads/              # Processed images (auto-created)
├── .env                  # Environment variables
├── .env.example          # Template
├── server.js             # Entry point
└── package.json
```

## Instalação

```bash
npm install
```

## Configuração

Copie `.env.example` para `.env`:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=backend_db
DB_DIALECT=mysql

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1d

# Stability AI API
STABILITY_API_KEY=your-stability-api-key

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourapp.com

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5500
CORS_ORIGINS=http://localhost:5500,http://127.0.0.1:5500
DB_SYNC_ALTER=false

# Upload
MAX_FILE_SIZE=5242880
```

### Configurar Email (Gmail)

1. Acesse sua conta Google
2. Ative a verificação em 2 etapas
3. Gere uma "Senha de App" em: https://myaccount.google.com/apppasswords
4. Use a senha gerada no `EMAIL_PASS`

## Execução

### Com Docker (Recomendado)

```bash
# Subir tudo com um comando
docker compose up --build

# Ou usando npm scripts
npm run docker:up

# Parar
npm run docker:down

# Ver logs
npm run docker:logs
```

### Sem Docker

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## Endpoints

### Autenticação

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Registrar usuário | Não |
| POST | `/api/auth/login` | Login | Não |
| GET | `/api/auth/me` | Perfil do usuário | Sim |

### Recuperação de Senha

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/forgot-password` | Enviar código por email | Não |
| POST | `/api/auth/verify-code` | Verificar código | Não |
| POST | `/api/auth/reset-password` | Redefinir senha | Não |

### Imagens

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/images/upload` | Upload + geração Stability AI (retorna image/jpeg) | Sim |
| GET | `/api/images` | Listar imagens | Sim |
| GET | `/api/images/:id` | Detalhes da imagem | Sim |
| DELETE | `/api/images/:id` | Deletar imagem | Sim |

## Exemplos de Uso

### Registrar

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"123456"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"123456"}'
```

### Forgot Password

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com"}'
```

### Verify Code

```bash
curl -X POST http://localhost:3000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","code":"123456"}'
```

### Reset Password

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","code":"123456","newPassword":"newpassword123"}'
```

### Upload de Imagem

```bash
curl -X POST http://localhost:3000/api/images/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@foto.jpg" \
  -F "prompt=Descreva esta imagem em detalhes"
```

## Fluxo de Recuperação de Senha

1. Usuário acessa `/api/auth/forgot-password` com seu email
2. Sistema gera código de 6 dígitos (válido por 15 min)
3. Email é enviado com o código
4. Usuário verifica o código em `/api/auth/verify-code`
5. Usuário redefine senha em `/api/auth/reset-password`

## Deploy no Render

1. Conecte o repositório no Render
2. Configure as variáveis de ambiente:
   - `DATABASE_URL` (MySQL do Render)
   - `JWT_SECRET`
  - `STABILITY_API_KEY`
   - `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`
  - `FRONTEND_URL` (URL publica do frontend)
  - `CORS_ORIGINS` (lista separada por virgula com dominios permitidos)
  - `DB_SYNC_ALTER` (`true` apenas no deploy em que voce precisa atualizar schema; depois voltar para `false`)
   - `NODE_ENV=production`
3. Build Command: `npm install`
4. Start Command: `npm start`

## APIs Externas

- **Stability AI**: https://platform.stability.ai/
- **SMTP Gmail**: https://myaccount.google.com/apppasswords
