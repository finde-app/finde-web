# Registro e inicio de sesión con Google — Finde V19

**Estado:** especificación; pendiente de implementación y configuración de credenciales OAuth.

## Experiencia
- Pantallas de registro e inicio de sesión con **Continuar con Google** y alternativa de correo electrónico y contraseña.
- Google OpenID Connect / OAuth 2.0 con flujo de código de autorización, validación de ID token en backend, `state`/`nonce` según el flujo y cookies de sesión seguras.
- Crear o vincular cuentas a partir del identificador estable de Google (`sub`), no únicamente del correo.
- Si el correo ya pertenece a una cuenta Finde, exigir verificación/autenticación apropiada antes de vincular; no fusionar cuentas automáticamente por coincidencia de email.
- Solicitar solo nombre, correo y foto si procede; informar tratamiento de datos.
- Propietarios y proveedores deben completar verificación de identidad, datos bancarios y aprobación administrativa independientemente de Google.
- Roles y permisos se asignan y verifican en el servidor, nunca a partir de parámetros manipulables del navegador.
- Mantener alternativa de registro tradicional, recuperación de contraseña y cierre de sesión.

## Implementación pendiente
1. Registrar la aplicación y dominio autorizado en Google Cloud; configurar pantalla de consentimiento y redirect URIs de desarrollo/producción.
2. Guardar Client ID y Client Secret exclusivamente en configuración segura del servidor; no en GitHub ni en JS público.
3. Crear endpoints backend de inicio, callback y sesión, y tablas/columnas para identidad externa.
4. Integrar botón real en frontend, pruebas de inicio, vinculación, logout, errores y móviles.
5. Revisar textos de privacidad y condiciones.

No activar el botón como funcional hasta completar backend, credenciales y pruebas.
