/* Finde V19 — captación de proveedores en entorno de pruebas. */
const findeProspectKey='findeProviderProspectsV19';
const findeProviderEndpoint='/api/solicitudes-proveedores';
function findeProspects(){try{return JSON.parse(localStorage.getItem(findeProspectKey)||'[]')}catch{return []}}
function findeSafe(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function providerInterest(){
 A.innerHTML=`<section class="form"><span class="back" onclick="home()">← Volver a Finde</span><h1>Publica con Finde</h1><p>¿Tienes un alojamiento u ofreces experiencias turísticas? Déjanos tus datos para conversar sobre cómo sumarte.</p><div class="box"><b>Prueba interna V19</b><p class="muted">Este formulario envía la información a la base de datos de pruebas de Finde. Por ahora utiliza solamente datos ficticios: aún debemos publicar el aviso de privacidad definitivo antes de recibir datos personales reales.</p></div><form id="providerInterestForm" onsubmit="saveProviderInterest(event)"><label>Nombre de contacto</label><input name="name" maxlength="120" required autocomplete="off"><label>Correo electrónico</label><input name="email" type="email" maxlength="180" required autocomplete="off"><label>Tipo de servicio</label><select name="kind" required><option value="">Selecciona una opción</option><option>Alojamiento</option><option>Experiencia turística</option></select><label>Nombre del alojamiento o servicio</label><input name="business" maxlength="160" required><label>Comuna</label><input name="commune" maxlength="100" required><label>Comentario (opcional)</label><textarea name="notes" rows="3" maxlength="500" placeholder="Cuéntanos brevemente sobre tu servicio"></textarea><div style="position:absolute;left:-9999px" aria-hidden="true"><label>Sitio web<input name="website" tabindex="-1" autocomplete="off"></label></div><label class="terms"><input name="consent" type="checkbox" required> Confirmo que estoy usando datos ficticios para una prueba interna y autorizo el envío de estos datos de prueba al servidor.</label><p id="providerInterestStatus" class="muted" role="status" aria-live="polite"></p><button type="submit">Enviar solicitud de prueba</button></form></section>`;scrollTo(0,0)
}
async function saveProviderInterest(e){
 e.preventDefault();const f=e.currentTarget,d=new FormData(f),email=String(d.get('email')||'').trim();
 if(!validEmail(email)||!f.reportValidity())return;
 const payload={name:String(d.get('name')||'').trim(),email,kind:String(d.get('kind')||''),business:String(d.get('business')||'').trim(),commune:String(d.get('commune')||'').trim(),notes:String(d.get('notes')||'').trim(),website:String(d.get('website')||''),privacyAccepted:d.get('consent')==='on'};
 const btn=f.querySelector('button[type="submit"]'),status=document.getElementById('providerInterestStatus');
 btn.disabled=true;btn.textContent='Enviando…';status.textContent='Conectando con el servidor de pruebas…';
 try{
  const response=await fetch(findeProviderEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),credentials:'omit'});
  let data={};try{data=await response.json()}catch{}
  if(!response.ok)throw new Error(data.error||'No se pudo registrar la solicitud.');
  A.innerHTML=`<section class="form"><h1>Solicitud de prueba registrada</h1><p>El servidor confirmó el registro en MariaDB con el número <b>${findeSafe(data.id)}</b>.</p><p class="muted">No se envió ningún correo ni se notificó automáticamente a Finde. La revisión de solicitudes desde administración todavía está pendiente.</p><button onclick="home()">Volver al inicio</button></section>`;scrollTo(0,0);
 }catch(err){status.textContent='No se guardó la solicitud: '+String(err.message||'Error de conexión');btn.disabled=false;btn.textContent='Reintentar envío';}
}
function adminProspects(){
 const rows=findeProspects().slice().reverse();
 adminShell('Interesados','Interesados en publicar','La consulta de solicitudes reales desde MariaDB todavía no está habilitada en este panel.',`<div class="admin-card"><p class="muted">Los registros enviados al servidor NO aparecen aquí. Esta sección solo muestra datos antiguos de demostración almacenados en este navegador. Para revisar registros de prueba utiliza phpMyAdmin con acceso autorizado.</p>${rows.length?rows.map(p=>`<div class="admin-table-row"><span><b>${findeSafe(p.name)}</b><small>${findeSafe(p.email)}</small></span><span><b>${findeSafe(p.business)}</b><small>${findeSafe(p.kind)} · ${findeSafe(p.commune)}</small></span><span><small>${findeSafe(p.notes)}</small></span><span class="tag">${findeSafe(p.status)}</span></div>`).join(''):'<p class="muted">Sin registros antiguos de demostración.</p>'}</div>`)
}
