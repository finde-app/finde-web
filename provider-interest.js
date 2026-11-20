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
/* Administración real: acceso y consultas protegidos por sesión del servidor. */
async function findeAdminRequest(path,options={}){
 const response=await fetch('/api/admin/'+path,{credentials:'same-origin',cache:'no-store',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})}});
 let data={};try{data=await response.json()}catch{}
 if(!response.ok)throw new Error(data.error||'No se pudo completar la operación.');
 return data;
}
function adminProspects(){
 adminShell('Interesados','Solicitudes de proveedores','Datos reales de la base de datos; acceso restringido.',`<div class="admin-card" id="findeAdminArea"><p>Verificando acceso seguro…</p></div>${findeExampleProspectRows()}`);
 findeLoadProspects();
}
async function findeLoadProspects(){
 const area=document.getElementById('findeAdminArea');if(!area)return;
 try{
  const data=await findeAdminRequest('solicitudes');
  if(!document.getElementById('findeAdminArea'))return;
  const states=['pendiente','en_revision','aprobado','rechazado'];
  area.innerHTML=`<div style="display:flex;gap:10px;justify-content:space-between;flex-wrap:wrap"><b>Solicitudes registradas: ${data.solicitudes.length}</b><button class="outline" onclick="findeAdminLogout()">Cerrar sesión segura</button></div>`+
  (data.solicitudes.length?data.solicitudes.map(p=>`<div class="admin-card" style="margin:14px 0"><b>#${findeSafe(p.id)} — ${findeSafe(p.nombre_servicio)}</b><p>${findeSafe(p.nombre_contacto)} · ${findeSafe(p.correo)}</p><p>${findeSafe(p.tipo_servicio)} · ${findeSafe(p.comuna)}</p><p class="muted">${findeSafe(p.comentario||'Sin comentarios')}</p><label>Estado</label> <select id="findeEstado${Number(p.id)}">${states.map(st=>`<option value="${st}" ${st===p.estado?'selected':''}>${findeSafe(st.replace('_',' '))}</option>`).join('')}</select> <button onclick="findeSaveProspect(${Number(p.id)})">Guardar estado</button></div>`).join(''):'<p>No hay solicitudes todavía.</p>');
 }catch(e){
  area.innerHTML=`<h3>Acceso seguro</h3><p class="muted">Introduce la contraseña administrativa configurada en cPanel. No se guarda en el navegador.</p><form onsubmit="findeAdminLogin(event)"><label>Contraseña de administración</label><input id="findeAdminPassword" type="password" required autocomplete="current-password"><button type="submit">Entrar a solicitudes</button></form><p id="findeAdminMessage" role="status"></p>`;
 }
}
async function findeAdminLogin(event){
 event.preventDefault();const field=document.getElementById('findeAdminPassword'),msg=document.getElementById('findeAdminMessage');const password=field.value;field.value='';msg.textContent='Verificando…';
 try{await findeAdminRequest('login',{method:'POST',body:JSON.stringify({password})});findeLoadProspects()}catch(e){msg.textContent=e.message}
}
async function findeSaveProspect(id){
 const el=document.getElementById('findeEstado'+id);if(!el)return;
 try{await findeAdminRequest('solicitudes/'+id,{method:'PATCH',body:JSON.stringify({estado:el.value})});findeLoadProspects()}catch(e){alert(e.message)}
}
async function findeAdminLogout(){
 try{await findeAdminRequest('logout',{method:'POST',body:JSON.stringify({})})}catch{}
 findeLoadProspects();
}

function findeExampleProspectRows(){
 const states = ['Pendiente','En revisión','Aprobado'];
 const rows = hostRegistrationExamples.map(([name,commune],i) => {
  const contact = adminExampleNames[(i+8)%adminExampleNames.length];
  return `<div class="admin-table-row"><span><b>${findeSafe(contact)}</b><small>interesado${i+1}@example.com</small></span><span><b>${findeSafe('Cabañas '+name)}</b><small>${findeSafe(commune)}</small></span><span class="tag">${states[i%states.length]}</span></div>`;
 });
 return `<div class="admin-card"><h2>Solicitudes ficticias</h2>${rows.join('')}</div>`;
}
