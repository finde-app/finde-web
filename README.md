# Finde V16 — Privacidad y disponibilidad

Versión acumulativa construida sobre V15.

## Cambios V16
- El cliente sigue ingresando nombre, correo y teléfono al reservar.
- Finde conserva esos datos para administración.
- El propietario ya no ve correo ni teléfono del huésped.
- En el panel propietario se muestra solo información operacional de la reserva.
- Calendario del propietario con bloqueo manual de fechas.
- El propietario puede desbloquear fechas.
- Los bloqueos manuales afectan la disponibilidad pública y evitan nuevas reservas en ese período.
- Las reservas confirmadas por Finde siguen bloqueando automáticamente sus fechas.

Se conservan alojamientos, experiencias y panel administrador de V15.
La maqueta todavía usa localStorage; backend, autenticación y pagos reales se implementarán posteriormente.

## V17 — Identificación
- Clientes de alojamientos: RUT, DNI o Pasaporte obligatorio.
- Clientes de experiencias: RUT, DNI o Pasaporte obligatorio.
- Validación de dígito verificador para RUT chileno.
- Administración Finde conserva y puede consultar la identificación del cliente.
- El propietario no ve documento, correo ni teléfono del huésped.
- El propietario puede registrar su propio RUT, DNI o Pasaporte en su panel.
- La identificación del propietario queda destinada a Administración Finde.
- Se mantienen los bloqueos manuales de fechas incorporados en V16.


## V18 — Findito
- Se incorpora Findito como personaje oficial de Finde.
- Aparece solamente después de una reserva de alojamiento confirmada.
- Aparece solamente después de una experiencia confirmada.
- No aparece en errores, advertencias, búsquedas sin resultados ni como asistente permanente.
- Se mantienen todas las funciones acumuladas de V17.
