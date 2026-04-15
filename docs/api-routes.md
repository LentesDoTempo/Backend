# API Routes - Backend

Base URL local: http://localhost:3000

## Health

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| GET | /health | Nao | Health check |

## Autenticacao

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| POST | /api/auth/register | Nao | Cria usuario e retorna token |
| POST | /api/auth/login | Nao | Autentica usuario e retorna token |
| GET | /api/auth/me | Sim | Retorna perfil do usuario autenticado |

### Exemplo register
POST /api/auth/register
Body JSON:
{
  "name": "Joao Silva",
  "email": "joao@email.com",
  "password": "senha123"
}

### Exemplo login
POST /api/auth/login
Body JSON:
{
  "email": "joao@email.com",
  "password": "senha123"
}

## Recuperacao de senha

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| POST | /api/auth/forgot-password | Nao | Gera e envia codigo de reset |
| POST | /api/auth/verify-code | Nao | Verifica codigo de reset |
| POST | /api/auth/reset-password | Nao | Atualiza senha |

### Exemplo forgot-password
POST /api/auth/forgot-password
Body JSON:
{
  "email": "joao@email.com"
}

### Exemplo verify-code
POST /api/auth/verify-code
Body JSON:
{
  "email": "joao@email.com",
  "code": "123456"
}

### Exemplo reset-password
POST /api/auth/reset-password
Body JSON:
{
  "email": "joao@email.com",
  "code": "123456",
  "newPassword": "novaSenha123"
}

## Imagens

Todas as rotas abaixo exigem Bearer token valido.

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| POST | /api/images/upload | Sim | Upload da imagem e inicio de analise |
| GET | /api/images | Sim | Lista imagens do usuario |
| GET | /api/images/:id | Sim | Detalha imagem do usuario |
| DELETE | /api/images/:id | Sim | Remove imagem e arquivo |

### Exemplo upload
POST /api/images/upload
Headers:
- Authorization: Bearer <token>
Content-Type: multipart/form-data
Campos:
- image: arquivo
- prompt: texto opcional para analise Gemini

## Rota protegida de exemplo

| Metodo | Rota | Auth | Descricao |
|---|---|---|---|
| GET | /api/protected | Sim | Exemplo de rota protegida |

## Codigos de resposta comuns

- 200: sucesso
- 201: criado
- 202: aceito para processamento
- 400: erro de validacao
- 401: nao autenticado
- 404: recurso nao encontrado
- 409: conflito (ex.: email ja cadastrado)
- 500: erro interno
