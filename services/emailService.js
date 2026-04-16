const nodemailer = require('nodemailer');

const requiredEnv = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];

const getMissingEmailEnv = () => {
  return requiredEnv.filter((key) => !process.env[key] || !String(process.env[key]).trim());
};

const escapeHtml = (value) => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const createTransporter = () => {
  const missing = getMissingEmailEnv();
  if (missing.length) {
    throw new Error(`Configuracao de email incompleta. Variaveis ausentes: ${missing.join(', ')}`);
  }

  const port = Number(process.env.EMAIL_PORT);

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const verifyEmailTransport = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✓ SMTP configurado e conectado.');
    return true;
  } catch (error) {
    console.error('✗ Falha ao conectar no SMTP:', error.message);
    return false;
  }
};

const sendPasswordResetEmail = async (email, code, userName) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Recuperação de Senha',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Recuperação de Senha</h1>
          </div>
          <div class="content">
            <p>Olá, <strong>${userName}</strong>!</p>
            <p>Recebemos uma solicitação para redefinir sua senha. Use o código abaixo para continuar:</p>

            <div class="code-box">
              <div class="code">${code}</div>
            </div>

            <p>Este código é válido por <strong>15 minutos</strong>.</p>

            <div class="warning">
              <strong>⚠️ Importante:</strong> Se você não solicitou esta recuperação, ignore este email e sua senha permanecerá inalterada.
            </div>

            <p>Após inserir o código, você poderá definir uma nova senha.</p>

            <div class="footer">
              <p>Este é um email automático, não responda.</p>
              <p>&copy; ${new Date().getFullYear()} Sua Empresa. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendServiceRequestEmail = async ({ name, institution, email, message }) => {
  const transporter = createTransporter();
  const safeName = escapeHtml(name);
  const safeInstitution = escapeHtml(institution);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message);

  const to = process.env.CONTACT_RECEIVER_EMAIL || process.env.EMAIL_FROM || process.env.EMAIL_USER;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    replyTo: email,
    subject: 'Nova solicitacao de estudo de reconstituicao',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #222;">
        <h2>Nova solicitacao de servico</h2>
        <p><strong>Nome:</strong> ${safeName}</p>
        <p><strong>Instituicao:</strong> ${safeInstitution}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Mensagem:</strong></p>
        <p style="white-space: pre-wrap;">${safeMessage}</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail, sendServiceRequestEmail, verifyEmailTransport };
