# PsiCerca v1

MVP de plataforma web para conectar personas con profesionales de Psicología.

## Arquitectura

- **Frontend:** HTML + CSS + JavaScript vanilla.
- **Hosting:** GitHub Pages.
- **Autenticación:** Supabase Auth (email + contraseña).
- **Base de datos:** Supabase PostgreSQL.
- **Seguridad:** Row Level Security (RLS) en tablas y políticas de acceso.
- **Sin backend propio:** el navegador se comunica con Supabase usando la clave pública `anon`.

## Funcionalidades v1

### Públicas
- Landing de PsiCerca.
- Directorio de profesionales.
- Perfil público de profesional.
- Registro e inicio de sesión.

### Para psicólogos
- Crear cuenta.
- Panel profesional.
- Completar y editar perfil.
- Publicar/despublicar perfil.
- Cerrar sesión.

### Próxima versión
- Agenda.
- Disponibilidad horaria.
- Solicitud de turnos.
- Notificaciones.
- Recuperación de contraseña.
- Verificación de matrícula.
- Planes Premium.

## Estructura

```text
PsiCerca-v1/
├── index.html
├── login.html
├── registro.html
├── dashboard.html
├── profesionales.html
├── profesional.html
├── css/
│   └── styles.css
├── js/
│   ├── config.example.js
│   ├── supabase.js
│   ├── auth.js
│   ├── dashboard.js
│   └── directorio.js
└── supabase/
    └── schema.sql
```

## Configuración de Supabase

1. Crear un proyecto en Supabase.
2. Abrir **SQL Editor** y ejecutar `supabase/schema.sql`.
3. Copiar `js/config.example.js` como `js/config.js`.
4. En `js/config.js`, pegar la **Project URL** y la clave pública **anon** del proyecto.
5. Subir todos los archivos al repositorio de GitHub Pages.

> Nunca colocar una `service_role key` en el frontend. La única clave que debe aparecer en GitHub es la clave pública `anon`.

## Importante

La v1 no guarda historias clínicas, diagnósticos, tratamientos ni otros datos clínicos. El perfil profesional contiene información pública de presentación. La verificación de matrícula todavía debe implementarse antes de presentar perfiles como verificados.

## Publicación en GitHub Pages

En GitHub: **Settings → Pages → Deploy from a branch → main → /root**.

## Modelo de datos

- `profiles`: información pública del profesional.
- `auth.users`: gestionada por Supabase para las cuentas y credenciales.

El usuario autenticado solo puede modificar su propio perfil mediante RLS.
