
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

function hostWelcome(title, content, heading, steps, action, onAction){
 hostView.innerHTML = `<section class="host-onboarding" aria-label="${title}">
  <div class="host-welcome-bar">
   <button type="button" class="host-welcome-brand" aria-label="Findito Chile, inicio">Findito <span>Chile</span></button>
   <button type="button" class="host-welcome-action">${action}</button>
  </div>
  <div class="host-welcome">
   <div class="host-welcome-body"><h1>${title}</h1>${content}<p id="hostMessage" role="status"></p></div>
   <aside class="host-welcome-photo"><div><h2>${heading}</h2><ol>${steps.map(step => `<li>${step}</li>`).join('')}</ol></div></aside>
  </div>
 </section>`;
 hostView.querySelector('.host-welcome-brand').onclick = home;
 hostView.querySelector('.host-welcome-action').onclick = onAction;
}
const hostEyeIcon = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>';
const hostListingIcons = {
 Alojamiento: '<path d="M5 12 16 3l11 9M8 10v16h16V10M13 26v-8h6v8M4 26h24M9 14h14"/>',
 Experiencia: '<path d="m2 25 8-9 5 5 7-10 8 9M2 29h28M21 11l2 5 2-2"/><circle cx="9" cy="7" r="3"/>'
};
function hostFirstListing(){
 const descriptions = {
  Alojamiento: 'Publica una cabaña, casa, departamento u otro hospedaje.',
  Experiencia: 'Ofrece un tour, actividad o experiencia local.'
 };
 const cards = Object.entries(descriptions).map(([type, description]) => `<article>
  <div class="host-first-option">
   <svg aria-hidden="true" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${hostListingIcons[type]}</svg>
   <div><h2>${type}</h2><p>${description}</p></div>
  </div>
  <button type="button" data-host-first="${type}">Agregar ${type.toLowerCase()}</button>
 </article>`).join('');
 hostWelcome('Crea tu primera ficha', `<p class="host-first-prompt">¿Qué quieres ofrecer en Findito?</p>${cards}`,
  'Cómo publicar', ['Completa tu ficha', 'Envíala a revisión', 'Findito revisa y publica'],
  'Mi panel', () => renderHostDashboard());
 hostView.querySelectorAll('[data-host-first]').forEach(button=>{button.onclick=()=>hostEditor(undefined,button.dataset.hostFirst);});
}

function hostAuth(mode='ingreso', resetToken=''){
 const names={ingreso:'Iniciar sesión',registro:'Crear cuenta',recuperar:'Recuperar contraseña',restablecer:'Restablecer contraseña'};
 const name=mode==='registro'?'<label>Nombre<input name="name" required maxlength="120" autocomplete="name"></label>':'';
 const email=mode==='restablecer'?'':'<label>Correo electrónico<input name="email" type="email" required autocomplete="email" maxlength="180"></label>';
 const password=mode==='recuperar'?'':'<label>Contraseña<input name="password" type="password" required minlength="12" autocomplete="'+(mode==='ingreso'?'current-password':'new-password')+'"></label>';
 if(mode==='registro'){
  const passwordFields = [
   { name: 'password', label: 'Contraseña', help: 'Mínimo 12 caracteres' },
   { name: 'confirmPassword', label: 'Confirmar contraseña', help: 'Vuelve a escribir tu contraseña' }
  ].map(field => `<div class="host-password-field">
   <label for="host-${field.name}">${field.label}</label>
   <div class="host-password-input">
    <input id="host-${field.name}" name="${field.name}" type="password" required minlength="12" autocomplete="new-password" aria-describedby="host-help-${field.name}">
    <button type="button" class="host-password-toggle" aria-label="Mostrar ${field.label.toLowerCase()}" aria-controls="host-${field.name}" aria-pressed="false">${hostEyeIcon}</button>
   </div>
   <small id="host-help-${field.name}">${field.help}</small>
  </div>`).join('');
  hostWelcome('Crea tu cuenta de anfitrión', `<p>Publica un alojamiento o una experiencia en Findito.</p>
   <form id="hostAuth">${name.replace('>Nombre<', '>Nombre completo<')}${email}${passwordFields}
    <button type="submit">Crear cuenta</button>
   </form>
   <p class="host-welcome-login">¿Ya tienes cuenta? <button type="button" id="hostReturnLogin">Inicia sesión</button></p>`,
   'Después de registrarte', ['Crea tu ficha', 'Envíala a revisión', 'Findito revisa y publica'],
   'Iniciar sesión', () => hostAuth());
  document.getElementById('hostReturnLogin').onclick = () => hostAuth();
  hostView.querySelectorAll('.host-password-toggle').forEach(toggle => {
   const field = document.getElementById(toggle.getAttribute('aria-controls'));
   toggle.onclick = () => {
    const visible = field.type === 'password';
    field.type = visible ? 'text' : 'password';
    toggle.setAttribute('aria-pressed', String(visible));
   };
  });
 }else{
 hostScreen(names[mode],'<form id="hostAuth">'+name+email+password+'<button>'+names[mode]+'</button></form><button class="outline" onclick="hostAuth(\'ingreso\')">Iniciar sesión</button> <button class="outline" onclick="hostAuth(\'registro\')">Crear cuenta</button> <button class="outline" onclick="hostAuth(\'recuperar\')">Olvidé mi contraseña</button>');
 }
 document.getElementById('hostAuth').onsubmit=async event=>{
  event.preventDefault();
  const form=event.currentTarget,button=form.querySelector('button');
  const data=Object.fromEntries(new FormData(form));
  if(mode==='registro'){
   if(data.password!==data.confirmPassword){hostMessage('Las contraseñas no coinciden.');form.elements.confirmPassword.focus();return;}
   delete data.confirmPassword;
  }
  if(resetToken)data.token=resetToken;
  button.disabled=true;
  try{
   const result=await hostRequest('hosts/'+mode,'POST',data);
   if(mode==='registro')await openHostPortal('primera-ficha');
   else if(mode==='ingreso')await openHostPortal();
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
const hostCalendarMonth=new Intl.DateTimeFormat('es-CL',{month:'long',year:'numeric',timeZone:'UTC'});
const hostCalendarDay=new Intl.DateTimeFormat('es-CL',{dateStyle:'full',timeZone:'UTC'});
function hostCalendarToday(){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts();
 const date=Object.fromEntries(parts.map(part=>[part.type,part.value]));
 return date.year+'-'+date.month+'-'+date.day;
}
function hostCalendarBookings(bookings,key){
 return bookings.filter(booking=>booking.inicio<=key&&key<=(booking.fin||booking.inicio))
  .sort((a,b)=>(a.hora||'99:99').localeCompare(b.hora||'99:99'));
}
function hostCalendarCount(count){
 return count===1?'1 reserva':count+' reservas';
}
function renderHostCalendar(area,bookings){
 const connected=Array.isArray(bookings);
 bookings ??= [];
 const today=hostCalendarToday();
 let month=new Date(today.slice(0,7)+'-01T12:00:00Z');
 let selected=today;
 const dayKey=date=>date.toISOString().slice(0,10);
 function renderDay(){
  const detail=area.querySelector('.host-calendar-detail');
  const rows=hostCalendarBookings(bookings,selected);
  detail.hidden=!rows.length;
  detail.innerHTML=rows.length?`<h3>${hostCalendarDay.format(new Date(selected+'T12:00:00Z'))} · ${hostCalendarCount(rows.length)}</h3>
   ${rows.map(booking=>`<details><summary><span>${hostEscape(booking.hora||'Sin hora')}</span><strong>${hostEscape(booking.titulo)}</strong><span>${hostEscape(booking.huesped)}</span><span>${hostEscape(booking.estado)}</span></summary>
    <p>${booking.fin&&booking.fin!==booking.inicio?'Llegada: '+hostEscape(booking.inicio)+' · Salida: '+hostEscape(booking.fin):'Fecha: '+hostEscape(booking.inicio)}</p>
   </details>`).join('')}`:'';
  area.querySelectorAll('[data-calendar-day]').forEach(button=>{
   button.setAttribute('aria-pressed',String(button.dataset.calendarDay===selected));
  });
 }
 function render(){
  const monthKey=dayKey(month).slice(0,7);
  const start=new Date(month);
  start.setUTCDate(1-(month.getUTCDay()+6)%7);
  const last=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,0,12));
  const weeks=Math.ceil(((month.getUTCDay()+6)%7+last.getUTCDate())/7);
  let hasBookings=false;
  const rows=Array.from({length:weeks},(_,week)=>'<tr>'+Array.from({length:7},(_,day)=>{
   const date=new Date(start);
   date.setUTCDate(start.getUTCDate()+week*7+day);
   const key=dayKey(date);
   const inMonth=key.startsWith(monthKey);
   const count=inMonth?hostCalendarBookings(bookings,key).length:0;
   hasBookings ||= Boolean(count);
   const dateLabel=hostCalendarDay.format(date);
   const number=`<time datetime="${key}"${key===today?' aria-current="date"':''}>${date.getUTCDate()}</time>`;
   return `<td${inMonth?'':' class="host-calendar-muted"'}>${count?`<button type="button" data-calendar-day="${key}" aria-label="${dateLabel}, ${hostCalendarCount(count)}">${number}<span>${hostCalendarCount(count)}</span></button>`:number}</td>`;
  }).join('')+'</tr>').join('');
  area.innerHTML=`<div class="host-calendar-toolbar">
   <button class="outline" type="button" data-calendar-step="-1" aria-label="Mes anterior">‹</button>
   <h2 id="host-calendar-month" aria-live="polite">${hostCalendarMonth.format(month)}</h2>
   <button class="outline" type="button" data-calendar-step="1" aria-label="Mes siguiente">›</button>
   <button class="outline" type="button" data-calendar-today>Hoy</button>
  </div>
  <div class="host-calendar-viewport"><table aria-labelledby="host-calendar-month"><thead><tr>${['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(day=>'<th scope="col">'+day+'</th>').join('')}</tr></thead><tbody>${rows}</tbody></table></div>
  ${hasBookings?'':`<p class="host-calendar-empty">${connected?'No hay reservas para este mes':'Las reservas aún no están conectadas al calendario.'}</p>`}
  <section class="host-calendar-detail" aria-label="Reservas del día" aria-live="polite" hidden></section>`;
  for(const button of area.querySelectorAll('[data-calendar-step]')){
   const step=Number(button.dataset.calendarStep);
   button.onclick=()=>{
    month.setUTCMonth(month.getUTCMonth()+step);
    selected='';
    render();
    area.querySelector('[data-calendar-step="'+step+'"]').focus();
   };
  }
  area.querySelector('[data-calendar-today]').onclick=()=>{
   month=new Date(today.slice(0,7)+'-01T12:00:00Z');
   selected=today;
   render();
   area.querySelector('[data-calendar-today]').focus();
  };
  area.querySelectorAll('[data-calendar-day]').forEach(button=>{
   button.onclick=()=>{selected=button.dataset.calendarDay;renderDay();};
  });
  if(selected.startsWith(monthKey))renderDay();
 }
 render();
}
const hostReservationExamples=[
 {codigo:'FD-1042',tipo:'Alojamiento',titulo:'Cabaña del Lago',huesped:'Diego M.',inicio:'2026-11-26',hora:'15:00',fin:'2026-11-28',salida:'11:00',personas:2,monto:130000,estado:'Confirmada',comentario:'Llegada tardía'},
 {codigo:'FD-1043',tipo:'Experiencia',titulo:'Tour por el lago',huesped:'Camila R.',inicio:'2026-11-26',hora:'10:00',personas:4,monto:80000,estado:'Confirmada',comentario:'Consultar punto de encuentro'},
 {codigo:'FD-1044',tipo:'Alojamiento',titulo:'Refugio Bosque Nativo',huesped:'Paula G.',inicio:'2026-11-26',hora:'17:00',fin:'2026-11-29',salida:'11:00',personas:3,monto:216000,estado:'Pendiente'},
 {codigo:'FD-1045',tipo:'Experiencia',titulo:'Caminata al mirador',huesped:'Martín A.',inicio:'2026-11-27',hora:'09:00',personas:2,monto:42000,estado:'Cancelada'}
];
const hostReservationDate=new Intl.DateTimeFormat('es-CL',{day:'numeric',month:'short',timeZone:'UTC'});
function hostReservationTime(date,time){
 return date?hostReservationDate.format(new Date(date+'T12:00:00Z'))+(time?' · '+time:''):'—';
}
function renderHostReservations(area,bookings,account){
 const connected=Array.isArray(bookings);
 const demo=!connected&&location.hostname==='prueba.findito.cl';
 const rows=demo?hostReservationExamples:bookings||[];
 const storageKey='findito-host-reservation-demo-'+account.id;
 let notes={};
 if(demo){try{notes=JSON.parse(localStorage.getItem(storageKey)||'{}')||{};}catch{}}
 area.innerHTML=(demo?'<p class="host-reservation-notice"><strong>Datos de ejemplo.</strong> Las reservas de tu cuenta aún no están conectadas al panel. Los comentarios de prueba se guardan en este navegador.</p>':'')+
  '<div class="host-reservation-filters"><label>Buscar<input type="search" name="buscar" placeholder="Código o huésped"></label>'+
  '<label>Tipo<select name="tipo"><option value="">Todos</option><option>Alojamiento</option><option>Experiencia</option></select></label>'+
  '<label>Estado<select name="estado"><option value="">Todos</option><option>Confirmada</option><option>Pendiente</option><option>Cancelada</option></select></label>'+
  '<label>Fecha<input type="date" name="fecha"></label><button type="button" data-res-calendar>Ver calendario</button></div>'+
  '<div class="host-card host-reservation-table" tabindex="0" aria-label="Tabla de reservas"><table><thead><tr>'+
  ['Código','Alojamiento o experiencia','Huésped','Llegada o inicio','Salida','Personas','Monto','Estado','Comentario','Acción'].map(label=>'<th scope="col">'+label+'</th>').join('')+
  '</tr></thead><tbody></tbody></table><p data-res-empty hidden role="status"></p></div><dialog class="host-reservation-dialog" aria-label="Reserva"></dialog>';
 const filters=area.querySelector('.host-reservation-filters');
 const tbody=area.querySelector('tbody');
 const empty=area.querySelector('[data-res-empty]');
 const dialog=area.querySelector('dialog');
 const note=row=>notes[row.codigo]??row.comentario??'';
 const normalize=value=>String(value??'').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
 function refresh(){
  const search=normalize(filters.querySelector('[name=buscar]').value.trim());
  const type=filters.querySelector('[name=tipo]').value;
  const state=filters.querySelector('[name=estado]').value;
  const date=filters.querySelector('[name=fecha]').value;
  const visible=rows.filter(row=>(!search||normalize(row.codigo+' '+row.huesped).includes(search))&&(!type||row.tipo===type)&&(!state||row.estado===state)&&(!date||row.inicio<=date&&date<=(row.fin||row.inicio)));
  tbody.innerHTML=visible.map(row=>{
   const id=rows.indexOf(row);
   return '<tr><th scope="row">'+hostEscape(row.codigo)+'</th><td><strong>'+hostEscape(row.titulo)+'</strong><small>'+hostEscape(row.tipo)+'</small></td><td>'+hostEscape(row.huesped)+'</td><td>'+hostEscape(hostReservationTime(row.inicio,row.hora))+'</td><td>'+hostEscape(hostReservationTime(row.fin,row.salida))+'</td><td>'+hostEscape(row.personas??'—')+'</td><td>'+(row.monto==null?'—':money(row.monto))+'</td>'+
    '<td><span class="host-reservation-state" data-state="'+hostEscape(row.estado)+'">'+hostEscape(row.estado)+'</span></td>'+
    '<td>'+(demo?'<button class="outline host-reservation-note" type="button" data-res-note="'+id+'" aria-label="'+(note(row)?'Editar':'Agregar')+' comentario de '+hostEscape(row.codigo)+'">'+hostEscape(note(row)||'Agregar comentario')+(note(row)?' ✎':'')+'</button>':hostEscape(note(row)||'—'))+'</td>'+
    '<td><button type="button" class="outline" data-res-detail="'+id+'">Ver detalle</button></td></tr>';
  }).join('');
  empty.hidden=visible.length>0;
  empty.textContent=!connected&&!demo?'Las reservas de tu cuenta aún no están conectadas al panel.':rows.length?'No hay reservas que coincidan con los filtros.':'Aún no hay reservas.';
 }
 filters.addEventListener('input',refresh);
 area.querySelector('[data-res-calendar]').onclick=()=>renderHostDashboard('calendario');
 tbody.onclick=event=>{
  const trigger=event.target.closest('[data-res-note],[data-res-detail]');
  if(!trigger)return;
  const editing=trigger.hasAttribute('data-res-note');
  const row=rows[Number(editing?trigger.dataset.resNote:trigger.dataset.resDetail)];
  const title=editing?'Comentario interno':'Reserva '+row.codigo;
  dialog.innerHTML='<h2>'+hostEscape(title)+'</h2>'+
   (editing?'<form><label>Comentario de '+hostEscape(row.codigo)+'<textarea name="comentario" maxlength="500" rows="4">'+hostEscape(note(row))+'</textarea></label><p role="status"></p><button type="submit">Guardar comentario</button> </form>':
   '<dl>'+Object.entries({'Alojamiento o experiencia':row.titulo,'Huésped':row.huesped,'Llegada o inicio':hostReservationTime(row.inicio,row.hora),'Salida':hostReservationTime(row.fin,row.salida),'Personas':row.personas,'Monto':row.monto==null?'—':money(row.monto),'Estado':row.estado,'Comentario interno':note(row)||'—'}).map(([label,value])=>'<div class="host-company-row"><dt>'+label+'</dt><dd>'+hostEscape(value??'—')+'</dd></div>').join('')+'</dl>')+
   '<button class="outline" type="button" data-res-close>'+ (editing?'Cancelar':'Cerrar')+'</button>';
  dialog.querySelector('[data-res-close]').onclick=()=>dialog.close();
  const form=dialog.querySelector('form');
  if(form)form.onsubmit=event=>{
   event.preventDefault();
   const updated={...notes,[row.codigo]:form.elements.comentario.value.trim()};
   try{localStorage.setItem(storageKey,JSON.stringify(updated));}
   catch{form.querySelector('[role=status]').textContent='El navegador no permitió guardar el comentario.';return;}
   notes=updated;dialog.close();refresh();
   tbody.querySelector('[data-res-note="'+rows.indexOf(row)+'"]')?.focus();
  };
  dialog.showModal();
 };
 refresh();
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
 }else if(section==='reservas'){
  content='<div id="hostReservations"></div>';
 }else if(section==='calendario'){
  content='<div id="hostCalendar" class="host-card host-calendar"></div>';
 }else if(section==='pagos'){
  content='<div id="hostPayouts"><p>Cargando…</p></div>';
 }else if(section==='cuenta'){
  content='<div id="hostCompany"><p>Cargando…</p></div>';
 }else{
  const notes={pagos:'Los pagos de tu cuenta aún no están conectados al panel.',reportes:'Los reportes de ocupación e ingresos estarán disponibles al conectar reservas y pagos.'};
  content='<div class="host-card"><p>'+notes[section]+'</p></div>';
 }
 hostDashboardFrame(section,section==='resumen'?'Hola, '+hostEscape(cuenta.nombre):hostSections[section],section==='resumen'?'Resumen de tu actividad':'',content,listingSection||section==='resumen'?create:'');
 if(section==='cuenta')void loadHostCompany();
 if(section==='pagos')void loadHostPayouts();
 if(section==='reservas')renderHostReservations(document.getElementById('hostReservations'),hostPortalData.reservas,cuenta);
 if(section==='calendario')renderHostCalendar(document.getElementById('hostCalendar'),hostPortalData.reservas);
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
  if(section==='primera-ficha')hostFirstListing();
  else renderHostDashboard(section);
 }catch(error){if(!loading.isConnected)return;hostAuth();if(error.status!==401)hostMessage(error.message);}
}

let hostHeicDecoder;
function loadHostHeicDecoder(){
 if(!hostHeicDecoder){
  hostHeicDecoder=new Promise((resolve,reject)=>{
   const script=document.createElement('script');
   script.src='https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
   script.integrity='sha384-OTofQ0MEeiSgh62havBcemCIK0gqj809wX6UA0uPISNMRnR6NZyCdGzX3SbLrgwL';
   script.crossOrigin='anonymous';
   script.onload=()=>typeof window.heic2any==='function'?resolve(window.heic2any):reject(new Error());
   script.onerror=()=>{script.remove();reject(new Error());};
   document.head.append(script);
  }).catch(error=>{hostHeicDecoder=undefined;throw error;});
 }
 return hostHeicDecoder;
}
async function decodeHostPhoto(blob){
 const url=URL.createObjectURL(blob);
 try{
  const image=new Image();
  image.src=url;
  await image.decode();
  return image;
 }finally{URL.revokeObjectURL(url);}
}
async function prepareHostPhoto(file){
 let image;
 try{image=await decodeHostPhoto(file);}
 catch{
  if(!/\.(heic|heif)$/i.test(file.name)&&!/^image\/(heic|heif)(-sequence)?$/i.test(file.type))throw new Error('No se pudo abrir la foto: '+file.name);
  try{
   const convert=await loadHostHeicDecoder();
   const converted=await convert({blob:file,toType:'image/jpeg',quality:.85});
   image=await decodeHostPhoto(Array.isArray(converted)?converted[0]:converted);
  }catch{throw new Error('No se pudo convertir '+file.name+'. Intenta exportarla como JPG desde Fotos.');}
 }
 const canvas=document.createElement('canvas');
 const context=canvas.getContext('2d',{alpha:false});
 let scale=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight));
 for(let attempt=0;attempt<5;attempt++){
  canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
  canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  context.fillStyle='#fff';
  context.fillRect(0,0,canvas.width,canvas.height);
  context.drawImage(image,0,0,canvas.width,canvas.height);
  for(const quality of [.86,.72,.58]){
   const jpeg=canvas.toDataURL('image/jpeg',quality);
   if(jpeg.startsWith('data:image/jpeg;base64,')&&jpeg.length<=400023)return jpeg;
  }
  scale*=.72;
 }
 throw new Error('No se pudo comprimir la foto: '+file.name);
}
function hostEditor(row,type='Alojamiento'){
 const data=row?hostRead(row.ficha):{tipo:type};
 const input=(name,label,max)=>'<label>'+label+'<input name="'+name+'" required maxlength="'+max+'" value="'+hostEscape(data[name])+'"></label>';
 hostScreen('Ficha de alojamiento o experiencia','<form id="hostEditor"><label>Tipo<select name="tipo"><option>Alojamiento</option><option'+(data.tipo==='Experiencia'?' selected':'')+'>Experiencia</option></select></label>'+input('titulo','Nombre',160)+input('ubicacion','Ubicación',160)+input('precio','Precio en pesos chilenos',9)+'<label>Descripción<textarea name="descripcion" required maxlength="4000">'+hostEscape(data.descripcion)+'</textarea></label><label>Disponibilidad<textarea name="disponibilidad" required maxlength="1000">'+hostEscape(data.disponibilidad)+'</textarea></label><label>Fotos (hasta 4; JPG, PNG, WebP, GIF, AVIF o HEIC/HEIF)<input id="hostPhotos" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.avif,.heic,.heif" multiple></label><p>Findito ajusta el tamaño de las fotos automáticamente.</p><p>Fotos guardadas: '+(data.fotos?.length||0)+'. Si seleccionas nuevas, se reemplazan.</p><button value="draft">Guardar borrador</button> <button value="submit">Enviar a revisión</button></form><button class="outline" onclick="renderHostDashboard(hostCurrentSection)">Volver a mis fichas</button>');
 document.getElementById('hostEditor').onsubmit=async event=>{
  event.preventDefault();
  const form=event.currentTarget,button=event.submitter;
  const buttons=[...form.querySelectorAll('button[type="submit"],button:not([type])')];
  buttons.forEach(control=>{control.disabled=true;});
  try{
   const files=[...form.querySelector('#hostPhotos').files];
   if(files.length>4)throw new Error('Selecciona hasta cuatro fotos.');
   if(files.some(file=>file.size>25*1024*1024))throw new Error('Cada foto original puede pesar hasta 25 MB.');
   const photos=files.length?[]:data.fotos||[];
   for(const [index,file] of files.entries()){
    hostMessage('Preparando foto '+(index+1)+' de '+files.length+'…');
    photos.push(await prepareHostPhoto(file));
   }
   hostMessage('Guardando ficha…');
   await hostRequest('hosts/fichas','POST',{...Object.fromEntries(new FormData(form)),id:row?Number(row.id):null,fotos:photos,enviar:button.value==='submit'});
   await openHostPortal(data.tipo==='Experiencia'?'experiencias':'alojamientos');
  }catch(error){hostMessage(error.message);}finally{buttons.forEach(control=>{control.disabled=false;});}
 };
}
const companyFields={
 razon:['Razón social',160],rut:['RUT de la empresa',16],giro:['Giro comercial',180],
 direccion:['Dirección de la empresa',220],comuna:['Comuna',100],region:['Región',100],
 telefono:['Teléfono de la empresa',28,'tel'],whatsapp:['WhatsApp de la empresa',28,'tel'],
 representante:['Nombre completo del representante legal',160],
 contacto:['Teléfono de contacto',28,'tel'],whatsappContacto:['WhatsApp de contacto',28,'tel']
};
const companyFiles={
 registro:['Constitución o registro de la empresa','Ej.: Certificado de Estatuto Actualizado o copia de la inscripción en el Registro de Comercio.'],
 poder:['Documento que acredita la representación legal','Ej.: Certificado de Vigencia de Poder o copia del extracto de la escritura donde consten las facultades del representante.'],
 cedula:['Cédula de identidad del representante legal','Adjunta ambos lados en un PDF o usa los dos campos de foto.'],
 frente:['Foto del frente',''],reverso:['Foto del reverso',''],
 logo:['Logo de la empresa (opcional)','Visible en tu panel privado.']
};
const companyStates={borrador:'Borrador',revision:'En revisión',observada:'Con observaciones',verificada:'Empresa verificada por Findito'};
const companySeal='<strong class="host-company-seal">✓ Empresa verificada por Findito</strong>';
function companyValues(keys,data,edit){
 return keys.map(key=>{
  const [label,length,type='text']=companyFields[key];
  const value=data[key]||'';
  return edit?'<label>'+label+'<input type="'+type+'" name="'+key+'" maxlength="'+length+'" value="'+hostEscape(value)+'"></label>':
   '<div class="host-company-row"><dt>'+label+'</dt><dd>'+hostEscape(key==='rut'&&value?'••••'+value.slice(-5):value||'—')+'</dd></div>';
 }).join('');
}
function companySavedFiles(files,path){
 return Object.entries(companyFiles).filter(([key])=>files[key]).map(([key,[label]])=>{
  return '<div class="host-company-file-row"><span><strong>'+label+'</strong><br>'+hostEscape(files[key])+'</span><a class="host-company-file" href="'+path+'/archivo/'+key+'" data-company-file>Ver archivo</a></div>';
 }).join('');
}
function bindCompanyFiles(area){
 area.querySelectorAll('[data-company-file]').forEach(link=>link.onclick=async event=>{
  event.preventDefault();
  try{
   const {nombre,tipo,base64}=await hostRequest(link.getAttribute('href'));
   const bytes=Uint8Array.from(atob(base64),char=>char.charCodeAt(0));
   const url=URL.createObjectURL(new Blob([bytes],{type:tipo}));
   const download=document.createElement('a');
   download.href=url;download.download=nombre;download.click();
   setTimeout(()=>URL.revokeObjectURL(url),30000);
  }catch(error){link.closest('.host-company-file-row').insertAdjacentText('beforeend',error.message);}
 });
}
function companyReadFile(file){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>resolve(reader.result.split(',')[1]);
  reader.onerror=()=>reject(new Error('No se pudo leer '+file.name));
  reader.readAsDataURL(file);
 });
}
async function loadHostCompany(){
 const area=document.getElementById('hostCompany');
 let company;
 try{({empresa:company}=await hostRequest('hosts/empresa'));}
 catch(error){area.textContent=error.message;return;}
 if(!area.isConnected)return;
 let enabled=Boolean(company);
 let active='perfil';
 let editing=false;
 const groups=[
  ['Datos de la empresa',['razon','rut','giro','direccion','comuna','region']],
  ['Contacto de la empresa',['telefono','whatsapp']],
  ['Representante legal y contacto',['representante','contacto','whatsappContacto']]
 ];
 function render(message=''){
  area.innerHTML='<label class="host-company-check"><input type="checkbox" data-company-enabled '+(enabled?'checked ':'')+(company?'disabled':'')+'> Tengo empresa</label>'+
   '<nav class="host-company-tabs" aria-label="Mi cuenta"><button type="button" data-company-tab="perfil" aria-pressed="'+(active==='perfil')+'">Perfil</button>'+
   (enabled?'<button type="button" data-company-tab="empresa" aria-pressed="'+(active==='empresa')+'">Empresa</button>':'')+'</nav><div data-company-content></div><p role="status" data-company-status></p>';
  const status=area.querySelector('[data-company-status]');
  status.textContent=message;
  area.querySelector('[data-company-enabled]').onchange=event=>{enabled=event.target.checked;active=enabled?'empresa':'perfil';render();};
  area.querySelectorAll('[data-company-tab]').forEach(button=>button.onclick=()=>{active=button.dataset.companyTab;editing=false;render();});
  const panel=area.querySelector('[data-company-content]');
  if(active==='perfil'){
   const {nombre,email}=hostPortalData.cuenta;
   const initials=nombre.trim().split(/\s+/).slice(0,2).map(word=>word[0]).join('').toUpperCase();
   panel.innerHTML='<div class="host-company-grid"><section class="host-card"><h2>Datos del perfil</h2><span class="host-company-avatar" aria-hidden="true">'+hostEscape(initials)+'</span><dl><div class="host-company-row"><dt>Nombre completo</dt><dd>'+hostEscape(nombre)+'</dd></div><div class="host-company-row"><dt>Correo electrónico</dt><dd>'+hostEscape(email)+'</dd></div></dl></section><section class="host-card"><h2>Seguridad</h2><p>Solicita un enlace por correo para restablecer tu contraseña.</p><button type="button" class="outline" data-company-recover>Recuperar contraseña</button></section></div>';
   panel.querySelector('[data-company-recover]').onclick=()=>hostAuth('recuperar');
   return;
  }
  const data=company?.datos||{};
  const files=company?.archivos||{};
  const state=company?.estado;
  if(company&&!editing){
   const date=company.verificada?new Date(company.verificada).toLocaleDateString('es-CL'):'';
   panel.innerHTML='<div class="host-company-heading"><p>'+ (state==='verificada'?companySeal+' <span> · '+hostEscape(date)+'</span>':hostEscape(companyStates[state]))+'</p><button type="button" class="outline" data-company-edit>Editar datos de la empresa</button></div>'+
    (files.poder?'':'<p class="host-card">Falta adjuntar el documento de representación legal por separado.</p>')+
   (company.observacion?'<p class="host-card">'+hostEscape(company.observacion)+'</p>':'')+
    '<div class="host-company-grid">'+groups.map(([title,keys])=>'<section class="host-card"><h2>'+title+'</h2><dl>'+companyValues(keys,data,false)+'</dl></section>').join('')+'</div>'+
    '<section class="host-card"><h2>Documentos de acreditación</h2>'+(companySavedFiles(files,'hosts/empresa')||'<p>Aún no hay archivos adjuntos.</p>')+'</section>';
   panel.querySelector('[data-company-edit]').onclick=()=>{editing=true;render();};
   bindCompanyFiles(panel);
   return;
  }
  const inputFile=key=>{
   const [label,help]=companyFiles[key];
   const pdf=['registro','poder','cedula'].includes(key);
   return '<label class="host-company-upload" data-upload="'+key+'"><strong>'+label+'</strong>'+
    (help?'<span>'+help+'</span>':'')+(files[key]?'<span>Guardado: '+hostEscape(files[key])+'</span>':'')+
    '<input type="file" name="'+key+'" accept="'+(pdf?'application/pdf,.pdf':'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif')+'">'+
    (pdf?'<small>PDF de hasta 1 MB</small>':'')+'</label>';
  };
  panel.innerHTML='<form class="host-company-form"><h2>'+(company?'Editar empresa':'Registrar empresa')+'</h2>'+
   (state==='verificada'?'<p>Al guardar cambios, el sello se ocultará hasta que Findito revise nuevamente la empresa.</p>':'')+
   '<div class="host-company-grid">'+groups.map(([title,keys])=>'<section class="host-card"><h3>'+title+'</h3><div class="host-company-fields">'+companyValues(keys,data,true)+'</div></section>').join('')+'</div>'+
   '<section class="host-card"><h3>Documentos de acreditación</h3><div class="host-company-fields">'+inputFile('registro')+inputFile('poder')+'</div>'+
   inputFile('cedula')+'<div class="host-company-fields">'+inputFile('frente')+inputFile('reverso')+'</div></section>'+
   '<section class="host-card"><h3>Logo</h3>'+inputFile('logo')+'</section>'+
   '<div class="host-company-actions"><button type="submit" class="outline" value="draft">Guardar borrador</button><button type="submit" value="review">Enviar a revisión</button></div></form>';
  const form=panel.querySelector('form');
  form.onsubmit=async event=>{
   event.preventDefault();
   const buttons=[...form.querySelectorAll('button')];
   buttons.forEach(button=>button.disabled=true);
   status.textContent='Guardando…';
   try{
    const datos=Object.fromEntries(Object.keys(companyFields).map(key=>[key,form.elements[key].value]));
    const archivos={};
    for(const key of Object.keys(companyFiles)){
     const input=form.elements[key];
     const file=input.files[0];
     if(!file||input.disabled)continue;
     const pdf=['registro','poder','cedula'].includes(key);
     if(pdf&&file.size>1048576)throw new Error('Cada PDF puede pesar hasta 1 MB.');
     if(!pdf&&file.size>25*1024*1024)throw new Error('Cada imagen puede pesar hasta 25 MB.');
     const base64=pdf?await companyReadFile(file):(await prepareHostPhoto(file)).split(',')[1];
     archivos[key]={nombre:pdf?file.name:file.name.replace(/\.[^.]+$/,'')+'.jpg',tipo:pdf?'application/pdf':'image/jpeg',base64};
    }
    if(archivos.cedula&&(archivos.frente||archivos.reverso))throw new Error('Elige un PDF de la cédula o dos fotos, frente y reverso.');
    const enviar=event.submitter?.value==='review';
    ({empresa:company}=await hostRequest('hosts/empresa','POST',{datos,archivos,enviar,version:company?.version||0}));
    editing=false;
    render(enviar?'Empresa enviada a revisión.':'Borrador guardado.');
   }catch(error){status.textContent=error.message;}
   finally{buttons.forEach(button=>button.disabled=false);}
  };
 }
 render();
}
async function adminHostCompanies(){
 adminShell('Verificación de empresas','Verificación de empresas','Revisa los tres antecedentes antes de aprobar una empresa.','<div class="admin-card" id="adminHostCompanies"></div>');
 const area=document.getElementById('adminHostCompanies');
 const path='admin/empresas-anfitriones';
 try{
  const {empresas}=await hostRequest(path);
  if(!area.isConnected)return;
  area.innerHTML=empresas.map(row=>'<p><button type="button" class="outline" data-company-review="'+Number(row.host_id)+'">'+hostEscape(row.razon)+' · '+hostEscape(companyStates[row.estado])+'</button></p>').join('')||'<p>No hay empresas enviadas a revisión.</p>';
  area.querySelectorAll('[data-company-review]').forEach(button=>button.onclick=async()=>{
   const record=path+'/'+button.dataset.companyReview;
   try{
    const {empresa}=await hostRequest(record);
    if(!area.isConnected)return;
    area.innerHTML='<button type="button" class="outline" data-company-back>Volver a empresas</button><h2>'+hostEscape(empresa.datos.razon)+'</h2><p>'+hostEscape(companyStates[empresa.estado])+'</p><dl>'+companyValues(Object.keys(companyFields),empresa.datos,false)+'</dl>'+
     '<h3>Documentos de acreditación</h3>'+companySavedFiles(empresa.archivos,record)+
     (empresa.estado==='revision'?'<form data-company-decision><label>Observaciones<textarea name="observacion" maxlength="1000"></textarea></label><div class="host-company-actions"><button type="submit" value="observada" class="outline">Devolver con observaciones</button><button type="submit" value="verificada">Aprobar empresa</button></div><p role="status"></p></form>':'');
    area.querySelector('[data-company-back]').onclick=adminHostCompanies;
    bindCompanyFiles(area);
    const form=area.querySelector('[data-company-decision]');
    if(form)form.onsubmit=async event=>{
     event.preventDefault();
     const buttons=[...form.querySelectorAll('button')];
     buttons.forEach(control=>control.disabled=true);
     try{await hostRequest(record,'PATCH',{estado:event.submitter.value,observacion:form.elements.observacion.value,version:empresa.version});await adminHostCompanies();}
     catch(error){form.querySelector('[role=status]').textContent=error.message;}
     finally{buttons.forEach(control=>control.disabled=false);}
    };
   }catch(error){area.textContent=error.message;}
  });
 }catch(error){area.textContent=error.message;}
}

function renderHostCard(row){
 const d=hostRead(row.ficha);
 const photos=(d.fotos||[]).filter(value=>/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value)).map(value=>'<img width="220" alt="" loading="lazy" src="'+hostEscape(value)+'">').join('');
 return '<div class="box"><h2>'+hostEscape(d.titulo)+'</h2><p>'+hostEscape(d.ubicacion)+' · '+money(d.precio)+'</p><p>'+hostEscape(d.descripcion)+'</p><p>'+hostEscape(d.disponibilidad)+'</p>'+photos+(row.empresa_verificada===true?'<p>'+companySeal+'</p>':'')+'</div>';
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
 adminShell('Revisión de fichas','Revisión de fichas','Publicaciones enviadas por anfitriones.','<div class="admin-card"><button type="button" onclick="adminPayouts()">Documentos de cobro</button> <button type="button" onclick="adminHostCompanies()">Verificación de empresas</button></div><div class="admin-card" id="hostModeration"></div>');
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

const payoutStates={revision:'En revisión',observado:'Con observaciones',aprobado:'Aprobado',pagado:'Pagado'};
function payoutLabel(name,label,options=''){
 return '<label>'+label+'<input name="'+name+'" required '+options+'></label>';
}

function payoutDate(value){
 return /^\d{4}-\d{2}-\d{2}$/.test(value||'')?value.split('-').reverse().join('/'):'—';
}
function payoutRows(items){
 return items.map(d=>'<article class="host-card"><h3>'+hostEscape(d.tipo)+' · Folio '+hostEscape(d.folio)+'</h3><p>'+hostEscape(d.referencia)+' · '+money(d.monto)+' · '+hostEscape(payoutStates[d.estado])+'</p>'+(d.fecha_pago?'<p>Transferencia: '+payoutDate(d.fecha_pago)+'</p>':'')+(d.nota?'<p>'+hostEscape(d.nota)+'</p>':'')+'</article>').join('')||'<p class="host-payout-empty">Aún no hay documentos de cobro.</p>';
}
async function loadHostPayouts(){
 const area=document.getElementById('hostPayouts');
 try{
  const data=await hostRequest('hosts/pagos');
  if(!area.isConnected)return;
  const bank=data.cuenta;
  area.innerHTML=`<div class="host-payout-grid">
   <section class="host-card host-payout-card" aria-labelledby="host-bank-title">
    <h2 id="host-bank-title">Datos bancarios</h2>
    <p class="host-bank-state" data-registered="${Boolean(bank)}">${bank?'Cuenta registrada':'Cuenta pendiente'}</p>
    ${bank?'<p>'+hostEscape(bank.titular)+' · '+hostEscape(bank.banco)+' · '+hostEscape(bank.numero)+'</p>':''}
    <form data-payout-host="banco">
     <div class="host-payout-fields">
      <div class="host-payout-full">${payoutLabel('titular','Titular','maxlength="120"')}</div>
      ${payoutLabel('rut','RUT del titular','maxlength="12" placeholder="12345678-5"')}
      ${payoutLabel('banco','Banco','maxlength="100"')}
      ${payoutLabel('tipo','Tipo de cuenta','maxlength="45"')}
      ${payoutLabel('numero','Número de cuenta','inputmode="numeric" maxlength="30"')}
     </div>
     <button type="submit">Guardar datos bancarios</button>
     <p role="status"></p>
    </form>
   </section>
   <section class="host-card host-payout-card" aria-labelledby="host-doc-title">
    <h2 id="host-doc-title">Documentos de cobro</h2>
    <p>Receptor: Certera SpA.</p>
    <form data-payout-host="documentos">
     <div class="host-payout-fields">
      <label>Tipo de documento<select name="tipo">${payoutTypes.map(type=>'<option>'+type+'</option>').join('')}</select></label>
      ${payoutLabel('folio','Folio','inputmode="numeric" maxlength="20"')}
      ${payoutLabel('monto','Monto en CLP','type="number" min="1" max="100000000"')}
      ${payoutLabel('referencia','Reserva o liquidación','maxlength="100"')}
     </div>
     <label class="host-payout-upload">
      <input name="archivo" type="file" accept="application/pdf,.pdf" required>
      <span aria-hidden="true" class="host-payout-upload-icon">↑</span>
      <strong>Selecciona un PDF</strong><span>Máximo 1 MB</span>
     </label>
     <button type="submit">Enviar a revisión</button>
     <p role="status"></p>
    </form>
   </section>
  </div>
  <section class="host-card host-payout-history" aria-labelledby="host-history-title">
   <h2 id="host-history-title">Historial de documentos</h2>
   ${payoutRows(data.documentos)}
  </section>`;
  const file=area.querySelector('input[type=file]');
  const fileLabel=area.querySelector('.host-payout-upload strong');
  file.onchange=()=>{fileLabel.textContent=file.files[0]?.name||'Selecciona un PDF';};
  area.querySelectorAll('[data-payout-host]').forEach(form=>{form.onsubmit=async event=>{
   event.preventDefault();
   const button=event.submitter;
   const status=form.querySelector('[role=status]');
   button.disabled=true;
   try{
    const body=Object.fromEntries(new FormData(form));
    if(body.archivo){
     if(!body.archivo.size||body.archivo.size>1048576)throw Error('Adjunta un PDF de hasta 1 MB.');
     const encoded=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(Error('No se pudo leer el PDF.'));reader.readAsDataURL(body.archivo);});
     delete body.archivo;body.pdf=encoded;
    }
    await hostRequest('hosts/pagos/'+form.dataset.payoutHost,'POST',body);
    await loadHostPayouts();
   }catch(error){status.textContent=error.message;}finally{button.disabled=false;}
  };});
 }catch(error){if(area.isConnected)area.textContent=error.message;}
}

const payoutSearchKey=value=>String(value).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
const payoutTypes=['Boleta','Factura','Otro documento'];
function payoutBadge(doc){
 return '<span class="payout-badge" data-state="'+hostEscape(doc.estado)+'">'+hostEscape(payoutStates[doc.estado]||doc.estado)+'</span>';
}
async function adminPayouts(options={}){
 adminShell('Documentos de cobro','Documentos de cobro','Revisa los cobros y registra los pagos realizados.','<div id="adminPayouts">Cargando…</div>');
 const area=document.getElementById('adminPayouts');
 try{
  const {documentos}=await hostRequest('admin/cobros-anfitriones');
  if(!area.isConnected)return;
  area.innerHTML=`<div class="payout-filters">
   <label>Buscar<input name="buscar" type="search" placeholder="Anfitrión o folio"></label>
   <label>Tipo<select name="tipo"><option value="">Todos los tipos</option>${payoutTypes.map(tipo=>'<option>'+tipo+'</option>').join('')}</select></label>
   <label>Estado<select name="estado"><option value="">Todos los estados</option>${Object.entries(payoutStates).map(([id,label])=>'<option value="'+id+'">'+label+'</option>').join('')}</select></label>
   <label>Orden de solicitud<select name="orden"><option value="antiguas">Más antiguas primero</option><option value="recientes">Más recientes primero</option></select></label>
  </div><div class="payout-layout"><div class="admin-card payout-table"><table><caption class="payout-caption">Solicitudes de cobro</caption><thead><tr><th>Anfitrión</th><th>Documento</th><th>Solicitud</th><th>Monto</th><th>Estado</th></tr></thead><tbody></tbody></table><p data-payout-empty hidden>No hay documentos que coincidan.</p></div><section class="admin-card" data-payout-detail aria-label="Detalle del documento"></section></div>`;
  const detail=area.querySelector('[data-payout-detail]');
  const tbody=area.querySelector('tbody');
  const filter=area.querySelector('.payout-filters');
  const fields=Object.fromEntries([...filter.querySelectorAll('input,select')].map(field=>[field.name,field]));
  for(const [key,field] of Object.entries(fields))if(options[key])field.value=options[key];
  let selectedId=options.selectedId;
  function render(){
   const search=payoutSearchKey(fields.buscar.value.trim());
   const filtered=documentos.filter(d=>(!search||payoutSearchKey(d.nombre+' '+d.folio).includes(search))&&(!fields.tipo.value||d.tipo===fields.tipo.value)&&(!fields.estado.value||d.estado===fields.estado.value));
   if(fields.orden.value==='recientes')filtered.reverse();
   const selected=filtered.find(d=>Number(d.id)===selectedId)||filtered[0];
   selectedId=selected?Number(selected.id):undefined;
   tbody.innerHTML=filtered.map(d=>`<tr data-selected="${Number(d.id)===selectedId}"><td><button type="button" class="payout-select" data-doc="${Number(d.id)}" aria-pressed="${Number(d.id)===selectedId}">${hostEscape(d.nombre)}</button></td><td>${hostEscape(d.tipo)} · ${hostEscape(d.folio)}</td><td>${payoutDate(d.fecha_solicitud)}</td><td>${money(d.monto)}</td><td>${payoutBadge(d)}</td></tr>`).join('');
   area.querySelector('[data-payout-empty]').hidden=filtered.length>0;
   if(selected)renderPayoutDetail(detail,selected,()=>adminPayouts({selectedId,...Object.fromEntries(Object.entries(fields).map(([key,field])=>[key,field.value]))}));
   else detail.innerHTML='<p>Selecciona un documento para ver su detalle.</p>';
  }
  filter.addEventListener('input',render);
  tbody.addEventListener('click',event=>{
   const button=event.target.closest('[data-doc]');
   if(!button)return;
   selectedId=Number(button.dataset.doc);
   render();
   tbody.querySelector('[data-doc="'+selectedId+'"]')?.focus();
  });
  render();
 }catch(error){if(area.isConnected)area.textContent=error.status===401?'Inicia sesión en Revisión de fichas para acceder a los documentos de cobro.':error.message;}
}
function renderPayoutDetail(detail,doc,refresh){
 const review=doc.estado==='revision';
 const approved=doc.estado==='aprobado';
 const form=review||approved?`<form><label>Estado<select name="estado">${review?'<option value="aprobado">Aprobado</option><option value="observado">Con observaciones</option>':'<option value="pagado">Pagado</option>'}</select></label>${approved?'<label>Fecha de transferencia<input type="date" name="fecha_pago" required></label>':''}<label>Observación<textarea name="nota" maxlength="500" rows="3"></textarea></label>${approved?'<p class="muted">La transferencia se realiza fuera de Findito.</p>':''}<button>Guardar registro</button></form>`:'';
 detail.innerHTML=`<h2>${approved?'Registrar pago':'Detalle del documento'}</h2><h3>${hostEscape(doc.tipo)} · Folio ${hostEscape(doc.folio)}</h3><p>${hostEscape(doc.nombre)} · ${hostEscape(doc.referencia)}</p><p>Receptor: Certera SpA</p><p><strong>${money(doc.monto)}</strong> ${payoutBadge(doc)}</p>${doc.fecha_pago?'<p>Transferencia: '+payoutDate(doc.fecha_pago)+'</p>':''}${doc.nota?'<p>Observación: '+hostEscape(doc.nota)+'</p>':''}<div class="payout-actions"><button type="button" class="outline" data-payout-action="pdf">Descargar PDF</button><button type="button" class="outline" data-payout-action="banco" aria-expanded="false">Ver datos bancarios</button></div><div data-bank-result hidden></div>${form}<p data-payout-status role="status"></p>`;
 const status=detail.querySelector('[data-payout-status]');
 const bank=detail.querySelector('[data-bank-result]');
 detail.querySelectorAll('[data-payout-action]').forEach(button=>{button.onclick=async()=>{
  button.disabled=true;
  status.textContent='';
  try{
   if(button.dataset.payoutAction==='banco'&&!bank.hidden){
    bank.replaceChildren();bank.hidden=true;button.textContent='Ver datos bancarios';button.setAttribute('aria-expanded','false');return;
   }
   const data=await hostRequest('admin/cobros-anfitriones/'+Number(doc.id)+'/'+button.dataset.payoutAction);
   if(!button.isConnected)return;
   if(data.cuenta){
    const {titular,rut,banco,tipo,numero}=data.cuenta;
    bank.textContent=[titular,rut,banco,tipo,numero].join(' · ');
    bank.hidden=false;button.textContent='Ocultar datos bancarios';button.setAttribute('aria-expanded','true');
   }else{
    const bytes=Uint8Array.from(atob(data.pdf),char=>char.charCodeAt(0));
    const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
    const link=document.createElement('a');
    link.href=url;link.download='documento-cobro-'+Number(doc.id)+'.pdf';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
   }
  }catch(error){status.textContent=error.message;}finally{button.disabled=false;}
 };});
 const editor=detail.querySelector('form');
 if(editor){
  const state=editor.elements.estado;
  const note=editor.elements.nota;
  state.onchange=()=>{note.required=state.value==='observado';};
  editor.onsubmit=async event=>{
   event.preventDefault();
   const button=event.submitter;
   button.disabled=true;
   try{
    await hostRequest('admin/cobros-anfitriones/'+Number(doc.id),'PATCH',Object.fromEntries(new FormData(editor)));
    await refresh();
   }catch(error){status.textContent=error.message;}finally{button.disabled=false;}
  };
 }
}
