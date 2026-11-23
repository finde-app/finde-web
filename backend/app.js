// Finde V19: backend preparado para pruebas. NO reemplaza automáticamente el backend activo de cPanel.
// Basado en app.js del backend actual. Requiere mysql2 y variables DB_HOST, DB_USER, DB_PASSWORD, DB_NAME.
'use strict';
const http=require('http');
const crypto=require('crypto');
const mysql=require('mysql2/promise');
const pool=mysql.createPool({host:process.env.DB_HOST,user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,waitForConnections:true,connectionLimit:10});
const ORIGIN='https://prueba.findito.cl';
const MAX_BODY=8192;
const rate=new Map();
const sessions=new Map();
const loginAttempts=new Map();
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||'';
const ADMIN_SESSION_SECRET=process.env.ADMIN_SESSION_SECRET||'';
function signed(value){return crypto.createHmac('sha256',ADMIN_SESSION_SECRET).update(value).digest('hex');}
function parseCookie(req){const m=(req.headers.cookie||'').match(/(?:^|;\s*)finde_admin=([^;]+)/);return m?decodeURIComponent(m[1]):'';}
function authorized(req){if(!ADMIN_PASSWORD||ADMIN_PASSWORD.length<16||ADMIN_SESSION_SECRET.length<32)return false;const cookie=parseCookie(req);const parts=cookie.split('.');if(parts.length!==2)return false;const sig=signed(parts[0]);if(parts[1].length!==sig.length||!crypto.timingSafeEqual(Buffer.from(parts[1]),Buffer.from(sig)))return false;const expiry=sessions.get(parts[0]);if(!expiry||expiry<Date.now()){sessions.delete(parts[0]);return false;}return true;}
function sameOrigin(req){return req.headers.origin===ORIGIN;}
function adminCookie(value,maxAge){return 'finde_admin='+value+'; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age='+maxAge;}
function adminConfigured(){return ADMIN_PASSWORD.length>=16&&ADMIN_SESSION_SECRET.length>=32;}
function secureCompare(a,b){const x=crypto.createHash('sha256').update(a).digest();const y=crypto.createHash('sha256').update(b).digest();return crypto.timingSafeEqual(x,y);}

function json(res,status,data,headers={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(data));}
function headers(req){return req.headers.origin===ORIGIN?{'Access-Control-Allow-Origin':ORIGIN,'Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}:{};}
function clean(v,max){return typeof v==='string'?v.trim().slice(0,max+1):'';}
function validEmail(s){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);}
function readBody(req,limit=MAX_BODY){return new Promise((resolve,reject)=>{let size=0,chunks=[];req.on('data',c=>{size+=c.length;if(size>limit){reject(new Error('too_large'));req.destroy();return;}chunks.push(c);});req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))}catch{reject(new Error('invalid_json'))}});req.on('error',reject);});}
const hosts=require("./hosts")({pool,json,origin:ORIGIN,authorized,readBody});
const server=http.createServer(async(req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname.replace(/\/+$/,'')||'/';
 if(await hosts(req,res,path))return;
 if(req.method==='GET'&&['/','/api'].includes(path))return json(res,200,{proyecto:'Finde',estado:'Backend funcionando',version:'1.2-v19'});
 if(req.method==='GET'&&['/db-test','/api/db-test'].includes(path)){try{await pool.query('SELECT 1');return json(res,200,{proyecto:'Finde',base_datos:'Conectada correctamente',estado:'OK'});}catch(e){console.error('DB test',e.message);return json(res,500,{estado:'ERROR'});}}
 if(req.method==='GET'&&['/alojamientos','/api/alojamientos'].includes(path)){try{const [rows]=await pool.query("SELECT id,titulo,descripcion,destino,capacidad,dormitorios,camas,precio_noche,reglas,hora_entrada,hora_salida,politica_cancelacion FROM alojamientos WHERE estado='aprobado' ORDER BY creado_en DESC LIMIT 100");return json(res,200,{proyecto:'Finde',total:rows.length,alojamientos:rows});}catch(e){console.error('Alojamientos',e.message);return json(res,500,{error:'No se pudieron consultar los alojamientos'});}}
 if(path.startsWith('/api/admin/')||path.startsWith('/admin/')){
  const sub=path.replace(/^\/(?:api\/)?admin\//,'');
  if(!adminConfigured())return json(res,503,{error:'Administración no configurada en el servidor'});
  if(req.method!=='GET'&&!sameOrigin(req))return json(res,403,{error:'Origen no autorizado'});
  if(req.method==='POST'&&sub==='login'){
   const ip=req.socket.remoteAddress||'unknown',now=Date.now(),recent=(loginAttempts.get(ip)||[]).filter(t=>now-t<900000);
   if(recent.length>=6)return json(res,429,{error:'Demasiados intentos. Espera 15 minutos.'});
   let b;try{b=await readBody(req)}catch{return json(res,400,{error:'Solicitud inválida'})}
   if(typeof b.password!=='string'||!secureCompare(b.password,ADMIN_PASSWORD)){
    loginAttempts.set(ip,[...recent,now]);return json(res,401,{error:'Contraseña incorrecta'});
   }
   loginAttempts.delete(ip);
   const token=crypto.randomBytes(32).toString('hex');sessions.set(token,now+28800000);
   if(sessions.size>1000){for(const [k,v] of sessions)if(v<now)sessions.delete(k);}
   return json(res,200,{ok:true},{'Set-Cookie':adminCookie(token+'.'+signed(token),28800)});
  }
  if(!authorized(req))return json(res,401,{error:'Debes iniciar sesión en administración'});
  if(req.method==='POST'&&sub==='logout'){
   sessions.delete(parseCookie(req).split('.')[0]);
   return json(res,200,{ok:true},{'Set-Cookie':adminCookie('',0)});
  }
  if(req.method==='GET'&&sub==='solicitudes'){
   try{const [rows]=await pool.query('SELECT id,nombre_contacto,correo,tipo_servicio,nombre_servicio,comuna,comentario,estado,fecha_solicitud FROM solicitudes_proveedores ORDER BY fecha_solicitud DESC LIMIT 200');return json(res,200,{solicitudes:rows});}
   catch(e){console.error('Admin solicitudes',e.message);return json(res,500,{error:'No se pudieron consultar las solicitudes'});}
  }
  const match=sub.match(/^solicitudes\/(\d+)$/);
  if(req.method==='PATCH'&&match){
   let b;try{b=await readBody(req)}catch{return json(res,400,{error:'Solicitud inválida'})}
   if(!b||!['pendiente','en_revision','aprobado','rechazado'].includes(b.estado))return json(res,400,{error:'Estado inválido'});
   try{const [result]=await pool.execute('UPDATE solicitudes_proveedores SET estado=? WHERE id=?',[b.estado,match[1]]);return result.affectedRows?json(res,200,{ok:true}):json(res,404,{error:'Solicitud no encontrada'});}
   catch(e){console.error('Admin actualizar',e.message);return json(res,500,{error:'No se pudo actualizar el estado'});}
  }
  return json(res,405,{error:'Operación no permitida'});
 }
 if(['/solicitudes-proveedores','/api/solicitudes-proveedores'].includes(path)){
  const cors=headers(req);
  if(req.method==='OPTIONS'){if(req.headers.origin!==ORIGIN)return json(res,403,{error:'Origen no autorizado'});res.writeHead(204,cors);return res.end();}
  if(req.method!=='POST')return json(res,405,{error:'Método no permitido'},cors);
  if(req.headers.origin!==ORIGIN)return json(res,403,{error:'Origen no autorizado'});
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||''))return json(res,415,{error:'Se requiere JSON'},cors);
  const ip=(req.socket.remoteAddress||'unknown');const now=Date.now();const prev=rate.get(ip)||[];const recent=prev.filter(t=>now-t<3600000);if(recent.length>=5)return json(res,429,{error:'Demasiadas solicitudes. Inténtalo más tarde.'},cors);
  let b;try{b=await readBody(req);}catch(e){if(!res.destroyed)return json(res,400,{error:'Solicitud inválida o demasiado grande'},cors);return;}
  const name=clean(b.name,120),email=clean(b.email,180).toLowerCase(),kind=clean(b.kind,30),business=clean(b.business,160),commune=clean(b.commune,100),notes=clean(b.notes||'',500);
  if(b.website) return json(res,202,{mensaje:'Solicitud recibida'},cors); // honeypot
  if(!name||name.length>120||!validEmail(email)||email.length>180||!['Alojamiento','Experiencia turística'].includes(kind)||!business||business.length>160||!commune||commune.length>100||notes.length>500||b.privacyAccepted!==true)return json(res,400,{error:'Revisa los campos y acepta el aviso de privacidad.'},cors);
  try{const [r]=await pool.execute('INSERT INTO solicitudes_proveedores (nombre_contacto,correo,tipo_servicio,nombre_servicio,comuna,comentario) VALUES (?,?,?,?,?,?)',[name,email,kind,business,commune,notes||null]);rate.set(ip,[...recent,now]);if(rate.size>5000)rate.clear();return json(res,201,{mensaje:'Solicitud registrada',id:r.insertId},cors);}catch(e){console.error('Guardar solicitud',e.message);return json(res,500,{error:'No pudimos registrar tu solicitud. Inténtalo nuevamente.'},cors);}
 }
 return json(res,404,{error:'Ruta no encontrada'});
});
server.listen(process.env.PORT||3000);
