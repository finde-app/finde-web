
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
async function openHostPortal(){
 hostScreen('Anfitriones','<p>Cargando…</p>');
 try{
  const data=await hostRequest('hosts/fichas');
  const rows=data.fichas.map(row=>'<div class="box"><b>'+hostEscape(hostRead(row.ficha).titulo)+'</b><p>'+hostEscape(({pendiente:'En revisión',devuelta:'Devuelta con observaciones',borrador:'Borrador',publicada:'Publicada'})[row.estado])+'</p>'+(row.nota?'<p>'+hostEscape(row.nota)+'</p>':'')+(row.estado==='pendiente'?'':'<button type="button" data-host-edit="'+Number(row.id)+'">Editar ficha</button>')+'</div>').join('');
  hostScreen('Hola, '+hostEscape(data.cuenta.nombre),'<button id="hostNew">Crear ficha</button> <button id="hostLogout" class="outline">Cerrar sesión</button>'+rows);
  document.getElementById('hostNew').onclick=()=>hostEditor();
  document.getElementById('hostLogout').onclick=async()=>{try{await hostRequest('hosts/salir','POST',{});hostAuth();}catch(error){hostMessage(error.message);}};
  document.querySelectorAll('[data-host-edit]').forEach(button=>{button.onclick=()=>hostEditor(data.fichas.find(row=>Number(row.id)===Number(button.dataset.hostEdit)));});
 }catch(error){hostAuth();if(error.status!==401)hostMessage(error.message);}
}
function hostEditor(row){
 const data=row?hostRead(row.ficha):{};
 const input=(name,label,max)=>'<label>'+label+'<input name="'+name+'" required maxlength="'+max+'" value="'+hostEscape(data[name])+'"></label>';
 hostScreen('Ficha de alojamiento o experiencia','<form id="hostEditor"><label>Tipo<select name="tipo"><option>Alojamiento</option><option'+(data.tipo==='Experiencia'?' selected':'')+'>Experiencia</option></select></label>'+input('titulo','Nombre',160)+input('ubicacion','Ubicación',160)+input('precio','Precio en pesos chilenos',9)+'<label>Descripción<textarea name="descripcion" required maxlength="4000">'+hostEscape(data.descripcion)+'</textarea></label><label>Disponibilidad<textarea name="disponibilidad" required maxlength="1000">'+hostEscape(data.disponibilidad)+'</textarea></label><label>Fotos JPG (hasta 4, máximo 300 KB cada una)<input id="hostPhotos" type="file" accept="image/jpeg" multiple></label><p>Fotos guardadas: '+(data.fotos?.length||0)+'. Si seleccionas nuevas, se reemplazan.</p><button value="draft">Guardar borrador</button> <button value="submit">Enviar a revisión</button></form><button class="outline" onclick="openHostPortal()">Volver a mis fichas</button>');
 document.getElementById('hostEditor').onsubmit=async event=>{
  event.preventDefault();
  const form=event.currentTarget,button=event.submitter;
  button.disabled=true;
  try{
   const files=[...document.getElementById('hostPhotos').files];
   if(files.length>4||files.some(item=>item.type!=='image/jpeg'||item.size>300000))throw new Error('Selecciona hasta cuatro fotos JPG de máximo 300 KB cada una.');
   const photos=files.length?await Promise.all(files.map(file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('No se pudo leer la foto.'));reader.readAsDataURL(file);} ))):data.fotos||[];
   await hostRequest('hosts/fichas','POST',{...Object.fromEntries(new FormData(form)),id:row?Number(row.id):null,fotos:photos,enviar:button.value==='submit'});
   await openHostPortal();
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
