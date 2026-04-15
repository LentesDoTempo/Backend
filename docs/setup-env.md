# Setup e Variaveis de Ambiente

## Arquivos

- .env.example: template base
- .env: configuracao local

## Variaveis recomendadas

Database:
- DB_HOST
- DB_USER
- DB_PASSWORD
- DB_NAME
- DB_DIALECT

JWT:
- JWT_SECRET
- JWT_EXPIRES_IN

Gemini:
- GEMINI_API_KEY

Email SMTP:
- EMAIL_HOST
- EMAIL_PORT
- EMAIL_USER
- EMAIL_PASS
- EMAIL_FROM

Servidor:
- PORT
- NODE_ENV

Upload:
- MAX_FILE_SIZE

## Exemplo minimo

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=backend_db
DB_DIALECT=mysql
JWT_SECRET=trocar-em-producao
JWT_EXPIRES_IN=1d
GEMINI_API_KEY=sua-chave
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-app-password
EMAIL_FROM=noreply@lentesdotempo.com.br
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE=5242880

## Execucao

Com Docker:
- docker compose up --build

Sem Docker:
- npm install
- npm run dev

## Checklist

1. Banco ativo e acessivel.
2. .env criado.
3. JWT_SECRET definido.
4. SMTP configurado para reset de senha.
5. GEMINI_API_KEY valida para analise de imagem.
