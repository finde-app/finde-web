# Finde V19 — Contrato de Servicio de Intermediación Turística
**BORRADOR sujeto a revisión jurídica antes de activar pagos reales. Versión 0.1 (2026-11-06).**

## Partes y rol de Finde
Finde es la plataforma digital que facilita la búsqueda, comparación, contratación y gestión de reservas de alojamientos y experiencias turísticas de terceros. El prestador identificado en el resumen de compra es quien ejecuta el servicio. Finde responde por las obligaciones que asuma como operador/intermediario y las que le correspondan legalmente; ninguna cláusula excluye responsabilidades irrenunciables.

**Operador de Finde:** [razón social, RUT, domicilio, correo de contacto — completar antes de publicar].
**Prestador:** [nombre/razón social, RUT, domicilio, canal de contacto].
**Cliente:** [nombre del contratante].

## Datos particulares que forman parte del contrato
- Código de reserva: [ID]
- Alojamiento o experiencia: [nombre y descripción]
- Ubicación / punto de encuentro: [lugar]
- Inicio / check-in: [fecha y hora]
- Término / check-out: [fecha y hora]
- Huéspedes / participantes: [cantidad]
- Prestaciones incluidas y restricciones: [detalle]
- Precio total y desglose de cargos: [montos en CLP]
- Política de cancelación aplicable: [texto y versión mostrados antes de pagar]
- Medio de pago: [medio]

## Pago y confirmación
Antes del pago, el cliente verá un resumen con el servicio, el prestador, las fechas, el precio total y las condiciones aplicables. No se agregarán cargos obligatorios no informados. La confirmación de reserva se emitirá según la verificación del pago y las condiciones previamente informadas. Se enviará por correo una copia legible del contrato y del resumen de la transacción.

## Obligaciones
El prestador debe respetar la oferta y mantener la disponibilidad actualizada. El cliente debe proporcionar información correcta, respetar la capacidad contratada y cumplir las reglas razonables previamente informadas. Finde facilitará los mecanismos de reserva, confirmación y atención en los términos comunicados.

## Cambios en la reserva y derechos del cliente
Se aplicará la política de cancelación mostrada al cliente antes del pago, sin perjuicio de los derechos legales que correspondan. El derecho a retracto se regirá por la Ley 19.496 y el Decreto 52; cualquier exclusión de servicios solo podrá aplicarse cuando se haya comunicado expresamente en la forma legalmente exigida antes de contratar. Si el prestador incumple o cancela, se atenderán los derechos del consumidor conforme a la normativa aplicable.

## Atención y reclamos
El cliente podrá contactar a Finde mediante [correo/canal de atención]. La plataforma gestionará las solicitudes conforme a las obligaciones asumidas, sin impedir reclamos contra el prestador ni ante organismos competentes.

## Datos personales
Se tratarán los datos necesarios para la reserva y su gestión conforme a la Política de Privacidad vigente y la legislación aplicable. Los prestadores solo accederán a los datos estrictamente necesarios para ejecutar el servicio; no se les entregará automáticamente RUT, teléfono ni email de turistas.

## Aceptación electrónica
El cliente tendrá acceso al contrato antes del pago, con opción de descargarlo o imprimirlo. La aceptación requiere marcar voluntariamente una casilla inicialmente desmarcada, con el texto exacto: «He leído y acepto el contrato de Servicio de Intermediación Turística.» Se conservarán código de reserva, versión del contrato, texto íntegro o hash verificable con copia inmutable, fecha y hora de aceptación, y registro de envío de la confirmación. Ninguna casilla premarcada ni aceptación implícita.

## Protección del consumidor
Ninguna estipulación limita los derechos irrenunciables establecidos por la Ley 19.496.

---
## Requisitos de implementación (pendientes)
1. Generar contrato específico con datos reales de la reserva y del prestador, antes del pago.
2. Mostrar resumen y enlace para visualizar/descargar el contrato; casilla obligatoria sin marcar por defecto. No destacar las condiciones de cancelación como título ni en el texto de aceptación, pero mantener su información clara, accesible y previa al pago conforme a la normativa.
3. Validar aceptación en backend; registrar versión, contenido inmutable y marca temporal asociada a reserva.
4. Bloquear inicio de pago si no hay aceptación válida.
5. Enviar confirmación escrita y contrato por correo al confirmar contratación.
6. Guardar aceptación y documentos en servidor; nunca solo en localStorage.
7. Aviso destacado separado cuando se pretenda excluir legalmente el derecho a retracto, previa revisión jurídica.
8. Probar en móvil y escritorio, con accesibilidad de teclado.

## Fuentes oficiales
- Ley 19.496: https://www.bcn.cl/leychile/navegar?idNorma=61438
- Reglamento de Comercio Electrónico, Decreto 6: https://www.bcn.cl/leychile/Navegar/imprimir?idNorma=1165504&idParte=0
- Decreto 52, retracto: https://www.bcn.cl/leychile/navegar?idNorma=1206144

**No publicar ni habilitar pagos con este borrador sin revisión jurídica y completar identidad del operador.**
