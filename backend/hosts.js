'use strict';
const crypto = require('node:crypto');
const {promisify} = require('node:util');
const scrypt = promisify(crypto.scrypt);
const token = () => crypto.randomBytes(32).toString('hex');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const passwordOK = value => typeof value === 'string' && value.length >= 12 && Buffer.byteLength(value) <= 128;
const hashPassword = async (password, salt = crypto.randomBytes(16).toString('hex')) =>
  salt + ':' + (await scrypt(password, salt, 64)).toString('hex');

module.exports = function hostRoutes({pool,json,origin,authorized,readBody}) {
  const attempts = new Map();
  const cookie = (value, age) => 'finde_host='+value+'; HttpOnly; Secure; SameSite=Strict; Path=/api/hosts; Max-Age='+age;
  async function sendReset(email, value) {
    const url = new URL('/#restablecer='+value, origin);
    const transport = require('nodemailer').createTransport(process.env.HOST_SMTP_URL);
    await transport.sendMail({from:process.env.HOST_MAIL_FROM,to:email,subject:'Restablece tu contraseña de Findito',text:'Abre este enlace dentro de 30 minutos: '+url.href});
  }
  return async function host(req,res,path) {
    const route = path.replace(/^\/api(?=\/)/,'');
    if (!route.startsWith('/hosts/') && route !== '/catalogo-anfitriones' && !route.startsWith('/admin/fichas-anfitriones')) return false;
    const method=req.method;
    const reply=(status,data,headers)=>{json(res,status,data,headers);return true;};
    if (method!=='GET' && req.headers.origin!==origin) return reply(403,{error:'Origen no autorizado'});
    try {
      if (method==='GET' && route==='/catalogo-anfitriones') {
        const [rows]=await pool.execute('SELECT id, publicada AS ficha FROM finde_host_listings WHERE publicada IS NOT NULL ORDER BY id DESC LIMIT 30');
        return reply(200,{fichas:rows});
      }
      const admin=route.startsWith('/admin/');
      if(admin && !authorized(req)) return reply(401,{error:'Inicia sesión en Administración'});
      const authPaths=['registro','ingreso','recuperar','restablecer'];
      const action=route.split('/').pop();
      if(method==='POST' && authPaths.includes(action) && route==='/hosts/'+action){
        const now=Date.now(), key=action+':'+req.socket.remoteAddress;
        for(const [k,v] of attempts) if(v.until<=now)attempts.delete(k);
        const window=attempts.get(key)||{until:now+900000,count:0};
        if(window.count>=10||(!attempts.has(key)&&attempts.size>=5000))return reply(429,{error:'Inténtalo nuevamente en unos minutos'});
        window.count++;attempts.set(key,window);
      }
      let body={};
      if(method==='POST'||method==='PATCH'){
        if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||''))return reply(415,{error:'Se requiere JSON'});
        try{body=await readBody(req,route==='/hosts/fichas'?1900000:8192);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();}
        catch{return res.destroyed ? true : reply(400,{error:'Solicitud inválida'});}
      }
      const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
      if(method==='POST' && ['/hosts/registro','/hosts/ingreso','/hosts/recuperar'].includes(route)){
        if(email.length>180||!/^\S+@[^\s@]+\.\S+$/.test(email))return reply(400,{error:'Revisa el correo electrónico'});
        if(route.endsWith('/recuperar')){
          if(!process.env.HOST_SMTP_URL||!process.env.HOST_MAIL_FROM)return reply(503,{error:'La recuperación por correo aún no está habilitada'});
          const value=token();
          const [updated]=await pool.execute('UPDATE finde_host_accounts SET reset_hash=?,reset_until=DATE_ADD(NOW(),INTERVAL 30 MINUTE) WHERE email=?',[digest(value),email]);
          if(updated.affectedRows)void sendReset(email,value).catch(()=>console.error('No se pudo enviar el correo de recuperación'));
          return reply(202,{mensaje:'Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña.'});
        }
        if(!passwordOK(body.password))return reply(400,{error:'La contraseña debe tener al menos 12 caracteres y hasta 128 bytes'});
        let id;
        if(route.endsWith('/registro')){
          const name=typeof body.name==='string'?body.name.trim():'';
          if(!name||name.length>120)return reply(400,{error:'Revisa tu nombre'});
          const [created]=await pool.execute('INSERT INTO finde_host_accounts (nombre,email,password_hash) VALUES (?,?,?)',[name,email,await hashPassword(body.password)]);
          id=created.insertId;
        }else{
          const [[row]]=await pool.execute('SELECT id,password_hash FROM finde_host_accounts WHERE email=?',[email]);
          const expected=row?.password_hash||'00000000000000000000000000000000:'+ '0'.repeat(128);
          const actual=await hashPassword(body.password,expected.split(':')[0]);
          if(!row||!crypto.timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))return reply(401,{error:'Correo o contraseña incorrectos'});
          id=row.id;
        }
        const value=token();
        await pool.execute('INSERT INTO finde_host_sessions (token_hash,host_id,expires_at) VALUES (?,?,DATE_ADD(NOW(),INTERVAL 8 HOUR))',[digest(value),id]);
        return reply(200,{ok:true},{'Set-Cookie':cookie(value,28800)});
      }
      if(method==='POST' && route==='/hosts/restablecer'){
        if(typeof body.token!=='string'||!/^[a-f0-9]{64}$/.test(body.token)||!passwordOK(body.password))return reply(400,{error:'Revisa el enlace y usa una contraseña de al menos 12 caracteres'});
        const connection=await pool.getConnection();
        try{
          await connection.beginTransaction();
          const [[account]]=await connection.execute('SELECT id FROM finde_host_accounts WHERE reset_hash=? AND reset_until>NOW() FOR UPDATE',[digest(body.token)]);
          if(!account){await connection.rollback();return reply(400,{error:'El enlace venció o ya fue usado'});}
          await connection.execute('UPDATE finde_host_accounts SET password_hash=?,reset_hash=NULL,reset_until=NULL WHERE id=?',[await hashPassword(body.password),account.id]);
          await connection.execute('DELETE FROM finde_host_sessions WHERE host_id=?',[account.id]);
          await connection.commit();
        }catch(e){await connection.rollback();throw e;}finally{connection.release();}
        return reply(200,{mensaje:'Contraseña actualizada. Ya puedes iniciar sesión.'},{'Set-Cookie':cookie('',0)});
      }
      if(admin){
        if(method==='GET' && route==='/admin/fichas-anfitriones'){
          const [rows]=await pool.execute("SELECT l.id,l.ficha,l.estado,a.nombre FROM finde_host_listings l JOIN finde_host_accounts a ON a.id=l.host_id WHERE l.estado='pendiente' ORDER BY l.id DESC LIMIT 200");
          return reply(200,{fichas:rows});
        }
        const id=route.match(/^\/admin\/fichas-anfitriones\/(\d+)$/)?.[1];
        const note=typeof body.note==='string'?body.note.trim():'';
        if(method==='PATCH'&&id&&['publicada','devuelta'].includes(body.estado)&&note.length<=1000&&(body.estado!=='devuelta'||note)){
          const [result]=await pool.execute("UPDATE finde_host_listings SET publicada=IF(?='publicada',ficha,publicada), estado=?, nota=? WHERE id=? AND estado='pendiente'",[body.estado,body.estado,note,id]);
          return reply(result.affectedRows?200:409,result.affectedRows?{ok:true}:{error:'La ficha ya no está pendiente'});
        }
        return reply(404,{error:'Ruta no encontrada'});
      }
      const session=req.headers.cookie?.match(/(?:^|;\s*)finde_host=([a-f0-9]{64})(?:;|$)/)?.[1];
      if(!session)return reply(401,{error:'Inicia sesión'});
      const [[account]]=await pool.execute('SELECT a.id,a.nombre,a.email FROM finde_host_sessions s JOIN finde_host_accounts a ON a.id=s.host_id WHERE s.token_hash=? AND s.expires_at>NOW()',[digest(session)]);
      if(!account)return reply(401,{error:'Inicia sesión'});
      if(method==='POST'&&route==='/hosts/salir'){
        await pool.execute('DELETE FROM finde_host_sessions WHERE token_hash=?',[digest(session)]);
        return reply(200,{ok:true},{'Set-Cookie':cookie('',0)});
      }
      if(method==='GET'&&route==='/hosts/fichas'){
        const [rows]=await pool.execute('SELECT id,ficha,estado,nota FROM finde_host_listings WHERE host_id=? ORDER BY id DESC',[account.id]);
        return reply(200,{fichas:rows,cuenta:account});
      }
      if(method==='POST'&&route==='/hosts/fichas'){
        const data={};
        for(const [field,max] of Object.entries({titulo:160,ubicacion:160,descripcion:4000,disponibilidad:1000})){
          const value=typeof body[field]==='string'?body[field].trim():'';
          if(!value||value.length>max)return reply(400,{error:'Revisa el campo '+field});
          data[field]=value;
        }
        const price=Number(body.precio);
        const photos=body.fotos;
        if(!['Alojamiento','Experiencia'].includes(body.tipo)||!Number.isSafeInteger(price)||price<1||price>100000000||!Array.isArray(photos)||photos.length>4||!photos.every(p=>typeof p==='string'&&p.length<=420000&&/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+={0,2}$/.test(p)))return reply(400,{error:'Revisa el tipo, el precio y las fotos JPG'});
        const state=body.enviar===true?'pendiente':'borrador';
        if(state==='pendiente'&&!photos.length)return reply(400,{error:'Agrega al menos una foto JPG'});
        const serialized=JSON.stringify({...data,tipo:body.tipo,precio:price,fotos:photos});
        if(body.id!=null){
          if(!Number.isSafeInteger(body.id)||body.id<1)return reply(400,{error:'Ficha inválida'});
          const [result]=await pool.execute("UPDATE finde_host_listings SET ficha=?,estado=?,nota='' WHERE id=? AND host_id=? AND estado<>'pendiente'",[serialized,state,body.id,account.id]);
          return reply(result.affectedRows?200:409,result.affectedRows?{ok:true}:{error:'La ficha no se puede editar'});
        }
        await pool.execute('INSERT INTO finde_host_listings (host_id,ficha,estado) VALUES (?,?,?)',[account.id,serialized,state]);
        return reply(201,{ok:true});
      }
      return reply(404,{error:'Ruta no encontrada'});
    }catch(e){
      if(e.code==='ER_DUP_ENTRY')return reply(409,{error:'Ese correo ya está registrado'});
      console.error('Flujo anfitriones',e.code||e.name);
      return reply(500,{error:'No pudimos completar la operación'});
    }
  };
};
