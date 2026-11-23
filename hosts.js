
'use strict';
const hostView = document.getElementById('app');
const hostEscape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const hostRead = value => typeof value === 'string' ? JSON.parse(value) : value;
async function hostRequest(path, method='GET', body){
 const response=await fetch('/api/'+path,{method,credentials:'same-origin',cache:'no-store',...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw Object.assign(new Error(data.error||'No se pudo conectar con Findito.'),{status:response.status});
 return data;
}
function hostScreen(title, contents){
 hostView.innerHTML='<section class="form wideform"><button class="outline" onclick="home()">Volver a inicio</button><h1>'+title+'</h1>'+contents+'<p id="hostMessage" role="status"></p></section>';
}
function hostMessage(message){const el=document.getElementById('hostMessage');if(el)el.textContent=message;}
function hostAuth(mode='ingreso', resetToken=''){
 const names={ingreso:'Iniciar sesión',registro:'Crear cuenta',recuperar:'Recuperar contraseña',restablecer:'Restablecer contraseña'};
 const name=mode==='registro'?'<label>Nombre<input name="name" required maxlength="120" autocomplete="name"></label>':'';
 const email=mode==='restablecer'?'':'<label>Correo electrónico<input name="email" type="email" required autocomplete="email" maxlength="180"></label>';
 const password=mode==='recuperar'?'':'<label>Contraseña<input name="password" type="password" required minlength="12" autocomplete="'+(mode==='ingreso'?'current-password':'new-password')+'"></label>';
 hostScreen(names[mode],'<form id="hostAuth">'+name+email+password+'<button>'+names[mode]+'</button></form><button class="outline" onclick="hostAuth(\'ingreso\')">Iniciar sesión</button> <button class="outline" onclick="hostAuth(\'registro\')">Crear cuenta</button> <button class="outline" onclick="hostAuth(\'recuperar\')">Olvidé mi contraseña</button>');
 document.getElementById('hostAuth').onsubmit=async event=>{
  event.preventDefault();
  const form=event.currentTarget,button=form.querySelector('button');
  const data=Object.fromEntries(new FormData(form));
  if(resetToken)data.token=resetToken;
  button.disabled=true;
  try{
   const result=await hostRequest('hosts/'+mode,'POST',data);
   if(mode==='ingreso'||mode==='registro')await openHostPortal();
   else if(mode==='restablecer'){hostAuth();hostMessage(result.mensaje);}
   else hostMessage(result.mensaje);
  }catch(error){hostMessage(error.message);}finally{button.disabled=false;}
 };
}

const hostSections = {resumen:'Resumen',alojamientos:'Alojamientos',experiencias:'Experiencias',reservas:'Reservas',calendario:'Calendario',pagos:'Pagos',reportes:'Reportes',cuenta:'Mi cuenta'};
const hostStates = {pendiente:'En revisión',devuelta:'Con observaciones',borrador:'Borrador',publicada:'Publicada'};
let hostPortalData;
let hostCurrentSection='resumen';

function hostDashboardFrame(section,title,subtitle,content,action=''){
 const menu=Object.entries(hostSections).map(([key,label])=>`<button type="button" data-host-section="${key}" ${section===key?'aria-current="page"':''}>${label}</button>`).join('');
 hostView.innerHTML=`<div class="host-dashboard"><aside class="host-sidebar"><strong>Findito</strong><p>Panel de anfitriones</p><nav aria-label="Panel de anfitriones">${menu}</nav><button type="button" class="outline" id="hostLogout">Cerrar sesión</button></aside><section class="host-workspace"><div class="host-heading"><div><h1>${title}</h1><p>${subtitle}</p></div>${action}</div>${content}<p id="hostMessage" role="status"></p></section></div>`;
 hostView.querySelectorAll('[data-host-section]').forEach(button=>{button.onclick=()=>renderHostDashboard(button.dataset.hostSection);});
 document.getElementById('hostLogout').onclick=async()=>{try{await hostRequest('hosts/salir','POST',{});hostPortalData=undefined;hostAuth();}catch(error){hostMessage(error.message);}};
}
function hostListingRows(rows){
 if(!rows.length)return '<p class="host-empty">Todavía no tienes fichas en esta sección.</p>';
 return rows.map(row=>{
  const d=hostRead(row.ficha);
  const photo=(d.fotos||[]).find(value=>/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value));
  return `<article class="host-listing">${photo?'<img src="'+hostEscape(photo)+'" alt="">':'<div class="host-photo-empty" aria-hidden="true">⌂</div>'}<div><h3>${hostEscape(d.titulo)}</h3><p>${hostEscape(d.ubicacion)} · ${money(d.precio)}</p><span class="host-status" data-state="${hostEscape(row.estado)}">${hostEscape(hostStates[row.estado]||row.estado)}</span>${row.nota?'<p>'+hostEscape(row.nota)+'</p>':''}</div><button type="button" class="outline" data-host-listing="${Number(row.id)}">${row.estado==='pendiente'?'Ver ficha':'Editar'}</button></article>`;
 }).join('');
}
function renderHostDashboard(section='resumen'){
 if(!hostPortalData)return openHostPortal(section);
 hostCurrentSection=section;
 const {cuenta,fichas}=hostPortalData;
 const stays=fichas.filter(row=>hostRead(row.ficha).tipo==='Alojamiento');
 const experiences=fichas.filter(row=>hostRead(row.ficha).tipo==='Experiencia');
 const pending=fichas.filter(row=>row.estado==='pendiente').length;
 const listingSection=['alojamientos','experiencias'].includes(section);
 const newLabel=section==='experiencias'?'Nueva experiencia':'Nuevo alojamiento';
 const create='<button type="button" id="hostNew">'+newLabel+'</button>';
 let content;
 if(section==='resumen'){
  content=`<div class="host-metrics"><article><span>Próximas llegadas</span><strong>—</strong></article><article><span>Fichas en revisión</span><strong>${pending}</strong></article><article><span>Pagos pendientes</span><strong>—</strong></article></div><div class="host-overview"><div class="host-card"><h2>Mis alojamientos</h2>${hostListingRows(stays.slice(0,4))}</div><div class="host-card"><h2>Próximas reservas</h2><p>Las reservas del anfitrión aún no están conectadas al panel.</p><button type="button" class="outline" data-host-section="reservas">Ver reservas</button></div></div>`;
 }else if(listingSection){
  content='<div class="host-card">'+hostListingRows(section==='alojamientos'?stays:experiences)+'</div>';
 }else if(section==='cuenta'){
  content='<div class="host-card"><dl><dt>Nombre</dt><dd>'+hostEscape(cuenta.nombre)+'</dd><dt>Correo electrónico</dt><dd>'+hostEscape(cuenta.email)+'</dd></dl><button class="outline" type="button" onclick="hostAuth(\'recuperar\')">Recuperar contraseña</button></div>';
 }else{
  const notes={reservas:'Las reservas de tu cuenta aún no están conectadas al panel.',calendario:'La disponibilidad se registra en cada ficha. El calendario de reservas aún no está conectado.',pagos:'Los pagos de tu cuenta aún no están conectados al panel.',reportes:'Los reportes de ocupación e ingresos estarán disponibles al conectar reservas y pagos.'};
  content='<div class="host-card"><p>'+notes[section]+'</p></div>';
 }
 hostDashboardFrame(section,section==='resumen'?'Hola, '+hostEscape(cuenta.nombre):hostSections[section],section==='resumen'?'Resumen de tu actividad':'',content,listingSection||section==='resumen'?create:'');
 const newButton=document.getElementById('hostNew');
 if(newButton)newButton.onclick=()=>hostEditor(undefined,section==='experiencias'?'Experiencia':'Alojamiento');
 hostView.querySelectorAll('[data-host-listing]').forEach(button=>{button.onclick=()=>{
  const row=fichas.find(item=>Number(item.id)===Number(button.dataset.hostListing));
  if(row.estado==='pendiente'){
   hostDashboardFrame(section,'Ficha en revisión','Administración revisará tu ficha antes de publicarla.',renderHostCard(row),'<button type="button" class="outline" onclick="renderHostDashboard(hostCurrentSection)">Volver</button>');
  }else hostEditor(row);
 };});
}
async function openHostPortal(section='resumen'){
 hostScreen('Anfitriones','<p>Cargando…</p>');
 const loading=hostView.firstElementChild;
 try{
  const data=await hostRequest('hosts/fichas');
  if(!loading.isConnected)return;
  hostPortalData=data;
  renderHostDashboard(section);
 }catch(error){if(!loading.isConnected)return;hostAuth();if(error.status!==401)hostMessage(error.message);}
}

function hostEditor(row,type='Alojamiento'){
 const data=row?hostRead(row.ficha):{tipo:type};
 const input=(name,label,max)=>'<label>'+label+'<input name="'+name+'" required maxlength="'+max+'" value="'+hostEscape(data[name])+'"></label>';
 hostScreen('Ficha de alojamiento o experiencia','<form id="hostEditor"><label>Tipo<select name="tipo"><option>Alojamiento</option><option'+(data.tipo==='Experiencia'?' selected':'')+'>Experiencia</option></select></label>'+input('titulo','Nombre',160)+input('ubicacion','Ubicación',160)+input('precio','Precio en pesos chilenos',9)+'<label>Descripción<textarea name="descripcion" required maxlength="4000">'+hostEscape(data.descripcion)+'</textarea></label><label>Disponibilidad<textarea name="disponibilidad" required maxlength="1000">'+hostEscape(data.disponibilidad)+'</textarea></label><label>Fotos JPG (hasta 4, máximo 300 KB cada una)<input id="hostPhotos" type="file" accept="image/jpeg" multiple></label><p>Fotos guardadas: '+(data.fotos?.length||0)+'. Si seleccionas nuevas, se reemplazan.</p><button value="draft">Guardar borrador</button> <button value="submit">Enviar a revisión</button></form><button class="outline" onclick="renderHostDashboard(hostCurrentSection)">Volver a mis fichas</button>');
 document.getElementById('hostEditor').onsubmit=async event=>{
  event.preventDefault();
  const form=event.currentTarget,button=event.submitter;
  button.disabled=true;
  try{
   const files=[...document.getElementById('hostPhotos').files];
   if(files.length>4||files.some(item=>item.type!=='image/jpeg'||item.size>300000))throw new Error('Selecciona hasta cuatro fotos JPG de máximo 300 KB cada una.');
   const photos=files.length?await Promise.all(files.map(file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('No se pudo leer la foto.'));reader.readAsDataURL(file);} ))):data.fotos||[];
   await hostRequest('hosts/fichas','POST',{...Object.fromEntries(new FormData(form)),id:row?Number(row.id):null,fotos:photos,enviar:button.value==='submit'});
   await openHostPortal(data.tipo==='Experiencia'?'experiencias':'alojamientos');
  }catch(error){hostMessage(error.message);}finally{button.disabled=false;}
 };
}
function renderHostCard(row){
 const d=hostRead(row.ficha);
 const photos=(d.fotos||[]).filter(value=>/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value)).map(value=>'<img width="220" alt="" loading="lazy" src="'+hostEscape(value)+'">').join('');
 return '<div class="box"><h2>'+hostEscape(d.titulo)+'</h2><p>'+hostEscape(d.ubicacion)+' · '+money(d.precio)+'</p><p>'+hostEscape(d.descripcion)+'</p><p>'+hostEscape(d.disponibilidad)+'</p>'+photos+'</div>';
}
async function hostPublished(type){
 const target=hostView.querySelector('section');
 if(!target)return;
 try{
  const data=await hostRequest('catalogo-anfitriones');
  if(!target.isConnected)return;
  const cards=data.fichas.filter(row=>hostRead(row.ficha).tipo===type).map(renderHostCard);
  if(cards.length)target.insertAdjacentHTML('beforeend','<div class="box"><h2>Publicaciones de anfitriones</h2>'+cards.join('')+'</div>');
 }catch{/* Existing catalogue remains available while the host API is unavailable. */}
}
async function hostModeration(){
 adminShell('Revisión de fichas','Revisión de fichas','Publicaciones enviadas por anfitriones.','<div class="admin-card" id="hostModeration"></div>');
 const area=document.getElementById('hostModeration');
 try{
  const data=await hostRequest('admin/fichas-anfitriones');
  area.innerHTML=data.fichas.map(row=>renderHostCard(row)+'<form data-review="'+Number(row.id)+'"><p>Anfitrión: '+hostEscape(row.nombre)+'</p><label>Observaciones<textarea name="note" maxlength="1000"></textarea></label><button value="publicada">Aprobar y publicar</button> <button value="devuelta" class="outline">Devolver para corregir</button><p role="status"></p></form>').join('')||'<p>No hay fichas pendientes.</p>';
  area.querySelectorAll('[data-review]').forEach(form=>{form.onsubmit=async event=>{
   event.preventDefault();
   const button=event.submitter;
   button.disabled=true;
   try{await hostRequest('admin/fichas-anfitriones/'+form.dataset.review,'PATCH',{estado:button.value,note:new FormData(form).get('note')});await hostModeration();}
   catch(error){form.querySelector('[role=status]').textContent=error.message;}finally{button.disabled=false;}
  };});
 }catch(error){
  if(error.status!==401){area.textContent=error.message;return;}
  area.innerHTML='<form><label>Contraseña de Administración<input type="password" name="password" required autocomplete="current-password"></label><button>Iniciar sesión</button><p role="status"></p></form>';
  area.querySelector('form').onsubmit=async event=>{
   event.preventDefault();
   const form=event.currentTarget;
   try{await hostRequest('admin/login','POST',{password:new FormData(form).get('password')});await hostModeration();}
   catch(e){form.querySelector('[role=status]').textContent=e.message;}
  };
 }
}
const resetMatch=location.hash.match(/^#restablecer=([a-f0-9]{64})$/);
if(resetMatch){history.replaceState(null,'',location.pathname+location.search);hostAuth('restablecer',resetMatch[1]);}
