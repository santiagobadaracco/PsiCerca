# PsiCerca — Fase 0.1

Landing de validación + endpoint opcional con Google Apps Script.

## Qué incluye
- Landing responsive.
- Formulario de interés para psicólogos.
- Formulario de interés para personas que buscan profesional.
- Validación comercial de la propuesta.
- Aviso de privacidad básico.
- Modo demo con localStorage.
- `google-apps-script.gs` para guardar registros en Google Sheets.

## Configuración del almacenamiento
1. Crear una hoja de cálculo en Google Sheets.
2. Abrir Extensiones → Apps Script.
3. Copiar el contenido de `google-apps-script.gs`.
4. Ejecutar `setup()` una vez y autorizar.
5. Implementar → Nueva implementación → Aplicación web → acceso según necesidad.
6. Copiar la URL `/exec`.
7. En `index.html`, reemplazar `FORM_ENDPOINT` por esa URL.
8. Volver a subir `index.html` a GitHub Pages.

Mientras `FORM_ENDPOINT` esté vacío, el sitio funciona en modo demo y guarda datos solamente en el navegador. No usar ese modo para captar datos reales.
