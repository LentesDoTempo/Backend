# Fluxo de Autenticacao e Reset de Senha

## Registro

1. Cliente envia name, email e password.
2. Backend valida campos e unicidade de email.
3. Usuario e criado com senha criptografada (model).
4. JWT e retornado ao cliente.

## Login

1. Cliente envia email e password.
2. Backend busca usuario por email.
3. Senha e comparada com hash.
4. JWT e retornado.

## Perfil

1. Cliente envia token Bearer.
2. Middleware protect valida token.
3. Endpoint /api/auth/me retorna id, name e email.

## Recuperacao de senha

1. forgot-password
   - valida email
   - gera codigo de 6 digitos
   - invalida codigos pendentes anteriores
   - persiste codigo com expiracao (15 min)
   - envia email com o codigo

2. verify-code
   - valida email + code
   - verifica existencia, uso e expiracao

3. reset-password
   - valida email + code + newPassword
   - valida senha minima
   - atualiza senha do usuario
   - marca codigo como usado

## Regras de seguranca

- Codigo de reset expira em 15 minutos.
- Codigo nao pode ser reutilizado apos uso.
- Em desenvolvimento, codigo pode aparecer na resposta para teste.
- Em producao, nao expor codigo na resposta da API.
