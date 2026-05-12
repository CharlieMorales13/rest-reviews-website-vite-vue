export function passwordResetEmailHtml(name: string, link: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Restablecer contraseña — Anáhuac EATS</title>
</head>
<body style="margin:0;padding:0;background:#0e0e10;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e10;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#18181b;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
          <tr>
            <td style="background:#0e0e10;padding:28px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.08);">
              <img src="https://anahuac-eats.com/assets/images/imagotipo.png" alt="Anáhuac EATS" width="120" style="height:auto;display:block;margin:0 auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#f9f5f8;letter-spacing:-0.5px;">
                Hola, ${name} 👋
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#adaaad;line-height:1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta.
                El enlace expira en <strong style="color:#f97316;">1 hora</strong>.
                Si no solicitaste esto, ignora este correo.
              </p>
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${link}" style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 40px;border-radius:14px;letter-spacing:-0.3px;">
                  Restablecer contraseña
                </a>
              </div>
              <p style="margin:0;font-size:12px;color:#525155;word-break:break-all;">
                O copia este enlace en tu navegador:<br/>
                <span style="color:#adaaad;">${link}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;font-size:12px;color:#525155;">
                © 2026 Antequera Tech · Este es un correo automático, no respondas a este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function passwordResetEmailText(name: string, link: string): string {
  return `Hola ${name},\n\nRecibimos una solicitud para restablecer tu contraseña en Anáhuac EATS.\n\nHaz clic en el siguiente enlace (expira en 1 hora):\n${link}\n\nSi no solicitaste esto, ignora este correo.\n\n© 2026 Antequera Tech`;
}
