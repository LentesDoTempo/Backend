# Arquitetura do Backend

## Estrutura de pastas

- config/: conexao Sequelize e configuracoes de banco
- controllers/: regras de negocio por dominio
- middleware/: autenticacao, validacoes e upload
- models/: entidades Sequelize (User, Image, PasswordReset)
- routes/: definicao das rotas HTTP
- services/: servicos externos (email)
- server.js: bootstrap da aplicacao

## Fluxo de request

1. Request entra no Express.
2. Passa por middlewares globais (cors/json/urlencoded).
3. Entra no roteador por prefixo (/api/auth, /api/images, /api).
4. Executa middlewares da rota (ex.: protect, validate, upload).
5. Controller processa e responde JSON.
6. Error handler global captura falhas nao tratadas.

## Autenticacao

- JWT emitido no login/registro.
- Middleware protect valida token e popula req.user.
- Rotas privadas exigem Authorization: Bearer <token>.

## Upload e analise de imagem

- Middleware de upload processa arquivo.
- Controller cria registro da imagem com status processing.
- Analise Gemini roda apos resposta 202 ao cliente.
- Status final esperado: completed ou failed.

## Banco e relacoes

Relacoes principais:
- User 1:N Image
- User 1:N PasswordReset

Sincronizacao:
- sequelize.sync({ alter: process.env.NODE_ENV === 'development' })

## Seguranca e boas praticas

- Nao expor tokens/chaves sensiveis em resposta.
- Em producao, nao retornar codigo de reset no forgot-password.
- Validar entrada em todas as rotas publicas.
