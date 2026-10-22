const A=document.getElementById('app');
const seed=[
{id:1,name:'Cabaña del Lago',commune:'Pucón',region:'Araucanía',price:65000,cap:4,img:'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=800&q=80'},
{id:2,name:'Refugio Bosque Nativo',commune:'Villarrica',region:'Araucanía',price:72000,cap:5,img:'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80'},
{id:3,name:'Hotel Mirador',commune:'Puerto Varas',region:'Los Lagos',price:89000,cap:2,img:'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'},
{id:4,name:'Cabaña Costa Sur',commune:'Pichilemu',region:"O'Higgins",price:59000,cap:4,img:'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80'}];
let listings=JSON.parse(localStorage.getItem('findeListings')||'null')||seed;
let s={dest:'',a:null,b:null,ad:2,ni:0,cal:false,g:false,m:10,y:2026,sug:false};
const money=n=>'$'+Number(n).toLocaleString('es-CL'),fmt=x=>x?new Date(x+'T12:00').toLocaleDateString('es-CL',{day:'2-digit',month:'short'}):'Seleccionar';
function save(){localStorage.setItem('findeListings',JSON.stringify(listings))}
function destinations(q=''){let map={};listings.forEach(x=>{let k=x.commune+'|'+x.region;if(!map[k])map[k]={commune:x.commune,region:x.region,count:0};map[k].count++});return Object.values(map).filter(x=>(x.commune+' '+x.region).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>b.count-a.count)}
function card(x){return `<div class="card clickable" onclick="detail(${x.id})"><img src="${(x.photos&&x.photos.length?x.photos[0]:x.img)}"><div class="pad"><h3>${x.name}</h3><p class="muted">${x.commune}, ${x.region} · hasta ${x.cap} huéspedes</p><span class="price">${money(x.price)} / noche</span><div class="openhint">Ver alojamiento →</div></div></div>`}
function home(){A.innerHTML=`<section class="hero"><h1>Encuentra tu próxima escapada</h1><p>Busca solamente entre destinos donde Finde ya tiene alojamientos publicados.</p><div class="searchbar"><div class="field"><small>DESTINO</small><input id="dest" autocomplete="off" placeholder="¿A dónde quieres ir?" value="${s.dest}" onfocus="showSug()" oninput="showSug(this.value)">${s.sug?suggestions():''}</div><div class="field" onclick="cal()"><small>ENTRADA</small>${fmt(s.a)}</div><div class="field" onclick="cal()"><small>SALIDA</small>${fmt(s.b)}</div><div class="field" onclick="guest()"><small>HUÉSPEDES</small>${s.ad+s.ni} huésped(es)</div><button onclick="search()">Buscar</button>${s.cal?calendar():''}${s.g?guestbox():''}</div></section><section class="section"><h2>Destinos con alojamientos disponibles</h2><p class="muted">Estos destinos existen porque hay oferta publicada en Finde.</p><div class="cards">${destinations().map(d=>`<div class="box" style="cursor:pointer" onclick="choose('${d.commune}')"><h3>📍 ${d.commune}</h3><p class="muted">${d.region}</p><b>${d.count} alojamiento${d.count>1?'s':''}</b></div>`).join('')}</div></section><section class="section"><h2>Alojamientos destacados</h2><div class="cards">${listings.slice(0,8).map(card).join('')}</div></section>`;scrollTo(0,0)}
function showSug(q=''){let e=document.getElementById('dest');if(e)s.dest=e.value;s.sug=true;home();setTimeout(()=>{let i=document.getElementById('dest');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},0)}
function suggestions(){let ds=destinations(s.dest);return `<div class="suggest">${ds.length?ds.map(d=>`<div onclick="event.stopPropagation();choose('${d.commune}')"><b>📍 ${d.commune}, ${d.region}</b><small>${d.count} alojamiento${d.count>1?'s':''} disponible${d.count>1?'s':''}</small></div>`).join(''):`<div><b>Sin oferta en este destino</b><small>Solo mostramos lugares con alojamientos publicados.</small></div>`}</div>`}
function choose(x){s.dest=x;s.sug=false;home()}
function cal(){s.cal=!s.cal;s.g=false;s.sug=false;home()} function guest(){s.g=!s.g;s.cal=false;s.sug=false;home()}
function calendar(){let ny=s.m==11?s.y+1:s.y,nm=(s.m+1)%12;return `<div class="calendar"><div class="calhead"><button onclick="event.stopPropagation();move(-1)">‹</button><b>Selecciona entrada y salida</b><button onclick="event.stopPropagation();move(1)">›</button></div><div class="months">${month(s.y,s.m)}${month(ny,nm)}</div></div>`}
function month(y,m){let N=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],f=new Date(y,m,1).getDay(),n=new Date(y,m+1,0).getDate(),c='';for(let i=0;i<f;i++)c+='<span></span>';for(let d=1;d<=n;d++){let q=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,z=q==s.a||q==s.b?' sel':s.a&&s.b&&q>s.a&&q<s.b?' range':'';c+=`<span class="day${z}" onclick="event.stopPropagation();pick('${q}')">${d}</span>`}return `<div class="month"><h3 style="text-align:center">${N[m]} ${y}</h3><div class="week">${['D','L','M','M','J','V','S'].map(x=>`<span>${x}</span>`).join('')}</div><div class="days">${c}</div></div>`}
function pick(q){if(!s.a||s.b){s.a=q;s.b=null}else if(q>s.a){s.b=q;s.cal=false}else{s.a=q;s.b=null}home()}function move(n){s.m+=n;if(s.m<0){s.m=11;s.y--}if(s.m>11){s.m=0;s.y++}home()}
function guestbox(){return `<div class="guestpop"><b>Huéspedes</b>${counter('Adultos','ad')}${counter('Niños','ni')}<button style="width:100%" onclick="s.g=false;home()">Listo</button></div>`}function counter(n,k){return `<div class="grow"><span>${n}</span><div class="counter"><button onclick="cnt('${k}',-1)">−</button><b>${s[k]}</b><button onclick="cnt('${k}',1)">+</button></div></div>`}function cnt(k,n){s[k]=Math.max(k=='ad'?1:0,s[k]+n);home()}
function search(){let e=document.getElementById('dest');if(e)s.dest=e.value;let r=listings.filter(x=>!s.dest||x.commune.toLowerCase()==s.dest.toLowerCase());A.innerHTML=`<section class="results"><span class="back" onclick="home()">← Modificar búsqueda</span><h1>${s.dest?'Alojamientos en '+s.dest:'Todos los alojamientos'}</h1><p class="muted">${r.length} resultado(s) · ${fmt(s.a)} → ${fmt(s.b)} · ${s.ad+s.ni} huésped(es)</p>${r.length?r.map(x=>`<div class="result clickable" onclick="detail(${x.id})"><img src="${(x.photos&&x.photos.length?x.photos[0]:x.img)}"><div><h3>${x.name}</h3><p>${x.commune}, ${x.region} · hasta ${x.cap} huéspedes</p><small class="openhint">Ver alojamiento →</small></div><span class="price">${money(x.price)} / noche</span></div>`).join(''):'<div class="box"><h3>No hay alojamientos publicados en este destino.</h3><p class="muted">Prueba seleccionando uno de los destinos sugeridos por Finde.</p></div>'}</section>`;scrollTo(0,0)}
function showAll(){s.dest='';search()}
function ownerLogin(){A.innerHTML=`<section class="login"><span class="back" onclick="home()">← Volver a Finde</span><h1>Acceso propietarios</h1><label>Correo</label><input value="propietario@demo.cl"><label>Contraseña</label><input type="password" value="123456"><button style="width:100%" onclick="dashboard()">Ingresar a la demo</button><p class="muted">Demo local: los alojamientos nuevos se guardan en este navegador.</p></section>`;scrollTo(0,0)}
function dashboard(){A.innerHTML=`<section class="panel"><div class="dash"><aside class="sidebar"><h2>Finde</h2><p>Portal propietario</p><button onclick="dashboard()">Resumen</button><button onclick="properties()">Alojamientos</button><button>Reservas</button><button>Calendario</button><button>Ingresos</button><button onclick="home()">Salir</button></aside><div><h1>Hola, Carolina</h1><p class="muted">Administra tu oferta publicada.</p><div class="stats"><div class="stat">Reservas este mes<b>12</b></div><div class="stat">Ingresos<b>$846.000</b></div><div class="stat">Ocupación<b>68%</b></div><div class="stat">Alojamientos<b>${listings.length}</b></div></div><div class="box"><h2>Prueba recomendada</h2><p>Ve a <b>Alojamientos → Agregar alojamiento</b>, publícalo y luego vuelve a Inicio. Su comuna aparecerá automáticamente en Destino.</p></div></div></div></section>`;scrollTo(0,0)}
function properties(){A.innerHTML=`<section class="panel"><span class="back" onclick="dashboard()">← Volver al panel</span><h1>Mis alojamientos</h1><button onclick="addForm()">+ Agregar alojamiento</button><div class="box">${listings.map(x=>`<div class="row"><span><b>${x.name}</b><br><small class="muted">${x.commune}, ${x.region} · ${money(x.price)}/noche · ${photoList(x).length} foto(s)</small></span><div class="listing-actions"><span class="tag">Publicado</span><button class="secondary" onclick="editListing(${x.id})">Editar</button><button class="secondary" onclick="managePhotos(${x.id})">Fotos (${photoList(x).length}/5)</button><button class="danger" onclick="askDelete(${x.id})">Eliminar</button></div></div>`).join('')}</div></section>`;scrollTo(0,0)}

function photoList(x){return (x.photos&&x.photos.length?x.photos:(x.img?[x.img]:[])).slice(0,5)}

function editListing(id){
 let x=listings.find(v=>v.id==id); if(!x)return;
 A.innerHTML=`<section class="form"><span class="back" onclick="properties()">← Mis alojamientos</span><h1>Editar alojamiento</h1><label>Nombre del alojamiento</label><input id="en" value="${esc(x.name)}"><div class="two"><div><label>Comuna</label><input id="ec" value="${esc(x.commune)}"></div><div><label>Región</label><input id="er" value="${esc(x.region)}"></div></div><div class="two"><div><label>Precio por noche</label><input id="ep" type="number" value="${x.price}"></div><div><label>Capacidad máxima</label><input id="ecap" type="number" value="${x.cap||2}"></div></div><label>Descripción</label><textarea id="ed">${esc(x.description||'')}</textarea><button style="width:100%" onclick="saveEdit(${id})">Guardar cambios</button></section>`;scrollTo(0,0)
}
function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function saveEdit(id){
 let x=listings.find(v=>v.id==id); if(!x)return;
 let n=document.getElementById('en').value.trim(),c=document.getElementById('ec').value.trim(),r=document.getElementById('er').value.trim(),p=+document.getElementById('ep').value,cap=+document.getElementById('ecap').value;
 if(!n||!c||!r||!p){alert('Completa nombre, comuna, región y precio.');return}
 x.name=n;x.commune=c;x.region=r;x.price=p;x.cap=cap||2;x.description=document.getElementById('ed').value.trim();
 save();properties()
}

let managePhotoId=null, managedPhotos=[];
function managePhotos(id){
 let x=listings.find(v=>v.id==id); if(!x)return;
 managePhotoId=id;managedPhotos=[...photoList(x)];
 A.innerHTML=`<section class="form"><span class="back" onclick="properties()">← Mis alojamientos</span><h1>Fotos de ${x.name}</h1><p class="muted">Puedes tener hasta 5 fotos JPG/JPEG. La primera es la portada que verá el turista.</p><div class="photo-upload"><input id="morePhotos" type="file" accept=".jpg,.jpeg,image/jpeg" multiple onchange="addManagedPhotos(this.files)"><label for="morePhotos">📷 Agregar fotos JPG</label></div><div id="managedPreviews" class="previews"></div><button style="width:100%" onclick="saveManagedPhotos()">Guardar fotos</button></section>`;renderManagedPhotos();scrollTo(0,0)
}
function renderManagedPhotos(){
 let e=document.getElementById('managedPreviews');if(!e)return;
 e.innerHTML=managedPhotos.map((p,i)=>`<div class="preview"><img src="${p}"><button onclick="removeManagedPhoto(${i})">×</button>${i===0?'<span class="cover">Portada</span>':''}</div>`).join('')
}
function addManagedPhotos(files){
 let arr=[...files]; if(arr.length>5){alert('Puedes subir un máximo de 5 fotos por alojamiento.');arr=arr.slice(0,5)}
 if(managedPhotos.length+arr.length>5){alert('Cada alojamiento puede tener un máximo de 5 fotos.');arr=arr.slice(0,Math.max(0,5-managedPhotos.length))}
 if(arr.some(f=>f.type!=='image/jpeg')){alert('Solo se permiten archivos JPG o JPEG.');return}
 arr.forEach(f=>{let r=new FileReader();r.onload=e=>{managedPhotos.push(e.target.result);renderManagedPhotos()};r.readAsDataURL(f)})
}
function removeManagedPhoto(i){
 if(managedPhotos.length<=1){alert('El alojamiento debe conservar al menos una foto.');return}
 managedPhotos.splice(i,1);renderManagedPhotos()
}
function saveManagedPhotos(){
 let x=listings.find(v=>v.id==managePhotoId);if(!x)return;
 x.photos=[...managedPhotos];x.img=managedPhotos[0];
 try{save();properties()}catch(e){alert('Las fotos son demasiado pesadas para esta demo. Prueba con JPG más livianos.')}
}

function askDelete(id){
 let x=listings.find(v=>v.id==id);if(!x)return;
 A.insertAdjacentHTML('beforeend',`<div class="modalback" id="deleteModal"><div class="modal"><h2>¿Eliminar alojamiento?</h2><p>¿Estás seguro de que quieres eliminar <b>${x.name}</b>?</p><p class="muted">Dejará de aparecer inmediatamente en las búsquedas de turistas.</p><div class="modalactions"><button class="secondary" onclick="closeDelete()">Cancelar</button><button class="danger big" onclick="confirmDelete(${id})">Sí, eliminar alojamiento</button></div></div></div>`)
}
function closeDelete(){document.getElementById('deleteModal')?.remove()}
function confirmDelete(id){listings=listings.filter(v=>v.id!=id);save();closeDelete();properties()}

function addForm(){A.innerHTML=`<section class="form"><span class="back" onclick="properties()">← Mis alojamientos</span><h1>Agregar alojamiento</h1><p class="muted">Al publicarlo, su comuna quedará disponible para los turistas.</p><label>Nombre del alojamiento</label><input id="n" placeholder="Ej: Cabañas Los Aromos"><div class="two"><div><label>Comuna</label><input id="c" placeholder="Ej: Cochamó"></div><div><label>Región</label><input id="r" placeholder="Ej: Los Lagos"></div></div><div class="two"><div><label>Precio por noche</label><input id="p" type="number" placeholder="75000"></div><div><label>Capacidad máxima</label><input id="cap" type="number" value="4"></div></div><label>Descripción</label><textarea placeholder="Describe brevemente el alojamiento"></textarea><label>Fotos del alojamiento</label><div class="photo-upload"><input id="photos" type="file" accept=".jpg,.jpeg,image/jpeg" multiple onchange="loadPhotos(this.files)"><label for="photos">📷 Seleccionar fotos JPG</label><p class="muted">Puedes elegir hasta 5 JPG/JPEG. La primera será la portada.</p></div><div id="previews" class="previews"></div><button style="width:100%" onclick="publish()">Publicar alojamiento</button></section>`;scrollTo(0,0)}
function loadPhotos(files){
 let arr=[...files];
 let bad=arr.filter(f=>!['image/jpeg','image/jpg'].includes(f.type));
 if(bad.length){alert('En esta demo solo puedes subir archivos JPG o JPEG.');return}
 pendingPhotos=[];
 if(!arr.length){renderPhotos();return}
 let done=0;
 arr.forEach(f=>{
   let reader=new FileReader();
   reader.onload=e=>{pendingPhotos.push(e.target.result);done++;if(done===arr.length)renderPhotos()};
   reader.readAsDataURL(f)
 });
}
function renderPhotos(){
 let el=document.getElementById('previews');if(!el)return;
 el.innerHTML=pendingPhotos.map((p,i)=>`<div class="preview"><img src="${p}"><button onclick="removePhoto(${i})">×</button>${i===0?'<span class="cover">Portada</span>':''}</div>`).join('');
}
function removePhoto(i){pendingPhotos.splice(i,1);renderPhotos()}
function publish(){
 let n=document.getElementById('n').value.trim(),c=document.getElementById('c').value.trim(),r=document.getElementById('r').value.trim(),p=+document.getElementById('p').value,cap=+document.getElementById('cap').value,desc=(document.querySelector('.form textarea')?.value||'').trim();
 if(!n||!c||!r||!p){alert('Completa nombre, comuna, región y precio.');return}
 if(!pendingPhotos.length){alert('Selecciona al menos una foto JPG del alojamiento.');return}
 let item={id:Date.now(),name:n,commune:c,region:r,price:p,cap:cap||2,photos:[...pendingPhotos],img:pendingPhotos[0],description:desc};
 try{listings.push(item);save()}catch(e){listings.pop();alert('Las fotos son demasiado pesadas para esta demo del navegador. Prueba con menos fotos o JPG más livianos.');return}
 pendingPhotos=[];
 A.innerHTML=`<section class="form"><div class="success"><h2>✓ Alojamiento publicado</h2><p><b>${n}</b> ya está publicado en ${c}, ${r} con sus fotos.</p><p>La primera imagen quedó como portada. Ahora puedes comprobar cómo lo ve el turista.</p></div><button onclick="s.dest='${c}';home()">Ir a Finde como turista</button> <button class="outline" onclick="properties()">Volver a mis alojamientos</button></section>`;scrollTo(0,0)
}

function detail(id){
 let x=listings.find(v=>v.id==id);if(!x)return;
 let ps=photoList(x), nights=(s.a&&s.b)?Math.max(1,Math.round((new Date(s.b+'T12:00')-new Date(s.a+'T12:00'))/86400000)):0;
 let total=nights*x.price;
 A.innerHTML=`<section class="detailpage"><span class="back" onclick="search()">← Volver a resultados</span><h1>${x.name}</h1><p class="muted">📍 ${x.commune}, ${x.region} · hasta ${x.cap} huéspedes</p><div class="detailgallery">${ps.map((p,i)=>`<img class="${i===0?'mainphoto':''}" src="${p}">`).join('')}</div><div class="detailgrid"><div><h2>Sobre este alojamiento</h2><p>${x.description||'Alojamiento publicado en Finde.'}</p><h3>Información</h3><p>Capacidad máxima: <b>${x.cap} huéspedes</b></p></div><aside class="bookingbox"><div class="price">${money(x.price)} / noche</div><label>Entrada</label><input type="date" id="din" value="${s.a||''}"><label>Salida</label><input type="date" id="dout" value="${s.b||''}"><label>Huéspedes</label><input type="number" id="dguests" min="1" max="${x.cap}" value="${Math.min(s.ad+s.ni,x.cap)}"><button onclick="calcDetail(${id})">Calcular estadía</button><div id="calc">${nights?`<p>${nights} noche(s) × ${money(x.price)}</p><h3>Total: ${money(total)}</h3><button onclick="reserveDemo(${id})">Reservar</button>`:'<p class="muted">Selecciona las fechas para calcular el total.</p>'}</div></aside></div></section>`;scrollTo(0,0)
}
function calcDetail(id){
 let x=listings.find(v=>v.id==id),a=document.getElementById('din').value,b=document.getElementById('dout').value,g=+document.getElementById('dguests').value;
 if(!a||!b||b<=a){alert('Selecciona una fecha de salida posterior a la entrada.');return}
 if(g<1||g>x.cap){alert(`Este alojamiento admite hasta ${x.cap} huéspedes.`);return}
 s.a=a;s.b=b;s.ad=g;s.ni=0;
 let nights=Math.round((new Date(b+'T12:00')-new Date(a+'T12:00'))/86400000),total=nights*x.price;
 document.getElementById('calc').innerHTML=`<p>${nights} noche(s) × ${money(x.price)}</p><h3>Total: ${money(total)}</h3><button onclick="reserveDemo(${id})">Reservar</button>`
}
function reserveDemo(id){
 let x=listings.find(v=>v.id==id);
 A.innerHTML=`<section class="form"><div class="success"><h2>Reserva de demostración</h2><p>Seleccionaste <b>${x.name}</b> para ${fmt(s.a)} → ${fmt(s.b)}.</p><p>El siguiente hito será conectar este botón con el flujo de datos del huésped y pago.</p></div><button onclick="detail(${id})">Volver al alojamiento</button></section>`;scrollTo(0,0)
}
home();