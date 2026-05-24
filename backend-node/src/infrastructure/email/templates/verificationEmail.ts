function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function verificationEmailHtml(name: string, code: string): string {
  const safeName = esc(name);
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verifica tu correo — Anáhuac EATS</title>
</head>
<body style="margin:0;padding:0;background:#0e0e10;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e10;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#18181b;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#0e0e10;padding:28px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.08);">
              <img src="https://anahuac-eats.com/assets/images/imagotipo.png" alt="Anáhuac EATS" width="120" style="height:auto;display:block;margin:0 auto;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#f9f5f8;letter-spacing:-0.5px;">
                Hola, ${safeName} 👋
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#adaaad;line-height:1.6;">
                Usa este código de 6 dígitos para verificar tu correo electrónico y activar tu cuenta.
                El código expira en <strong style="color:#f97316;">15 minutos</strong>.
              </p>

              <!-- Code box -->
              <div style="background:#0e0e10;border:2px solid #f97316;border-radius:16px;padding:28px;text-align:center;margin-bottom:32px;">
                <span style="font-size:48px;font-weight:900;color:#f97316;letter-spacing:16px;font-family:'Courier New',monospace;">
                  ${code}
                </span>
              </div>

              <p style="margin:0 0 8px;font-size:13px;color:#adaaad;line-height:1.5;">
                Si no creaste una cuenta en Anáhuac EATS, ignora este correo.
                Nadie más puede usar este código.
              </p>
            </td>
          </tr>

          <!-- Footer -->
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

export function verificationEmailText(name: string, code: string): string {
  return `Hola ${name},\n\nTu código de verificación para Anáhuac EATS es: ${code}\n\nExpira en 15 minutos.\n\nSi no creaste esta cuenta, ignora este mensaje.\n\n© 2026 Antequera Tech`;
}
