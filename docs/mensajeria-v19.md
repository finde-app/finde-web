# Finde V19 — Comunicación con empresas

## Alcance aprobado
- Cada propietario/proveedor (alojamiento o experiencia) registra un correo electrónico de contacto y puede actualizarlo previa verificación.
- Administración Finde puede iniciar conversaciones individuales con propietarios de alojamientos y proveedores de experiencias.
- El proveedor puede responder desde su panel privado; ambos ven historial, fecha, remitente, estado leído/no leído.
- Notificación por correo cuando hay un nuevo mensaje; el email contiene aviso y enlace al panel, sin datos sensibles de huéspedes.
- Bandeja de entrada de Administración con filtros por empresa, tipo de proveedor y no leídos.
- El chat NO es un canal directo turista-propietario. No mostrar teléfono, email ni documento del turista al propietario.

## Modelo de datos propuesto (migraciones aditivas, sin alterar tablas existentes)
- usuarios.email ya existe: correo de acceso, no confundir con contacto empresarial.
- contactos_empresa: id, propietario_id (FK usuarios), nombre_comercial, email_contacto, email_verificado_en, creado_en, actualizado_en. Una fila por empresa o unidad comercial; definir relación exacta con alojamientos/experiencias antes de migrar.
- conversaciones: id, proveedor_id (FK usuarios), iniciada_por (FK usuarios), asunto, tipo_origen ('alojamiento','experiencia','general'), referencia_id nullable, creada_en, actualizada_en.
- mensajes: id, conversacion_id (FK), remitente_id (FK usuarios), cuerpo TEXT, creado_en, leido_en nullable.
- notificaciones_email: id, mensaje_id (FK), destinatario, estado, intentos, enviado_en, error_sanitizado, creado_en.

## Reglas obligatorias
- Backend autentica sesión y comprueba rol y pertenencia de la conversación en CADA lectura y escritura.
- Administración autorizada ve conversaciones; proveedor solo las propias. Nunca confiar en IDs enviados desde navegador.
- Escapar texto al renderizar para evitar XSS; límite de tamaño y frecuencia; protección CSRF según mecanismo de sesión.
- No publicar correos de empresas en fichas turísticas por defecto; campo privado para notificaciones.
- No exponer datos personales de huéspedes ni permitir exportación masiva a proveedores.
- Correo saliente vía SMTP/servicio transaccional configurado por variables de entorno, nunca credenciales en GitHub.
- Cola/reintentos y registro de entrega; notificaciones pueden fallar sin perder mensajes guardados.
- No prometer tiempo real: primera versión puede usar actualización periódica, y después WebSocket si es necesario.

## Pruebas de aceptación
1. Admin envía mensaje a empresa de alojamiento y a proveedor de experiencia.
2. Ambos reciben aviso por correo y pueden responder en su panel.
3. Empresa A no puede leer ni responder conversaciones de B aunque modifique el ID.
4. Mensajes persisten en MariaDB entre dispositivos.
5. Un correo fallido no borra ni duplica mensajes.
6. Ningún mensaje muestra teléfono, email o documento del turista.
7. Bandeja y conversación funcionan en móvil (360px) y escritorio.

Estado: especificación registrada; migraciones, endpoints, interfaz y SMTP PENDIENTES de implementar y probar.
