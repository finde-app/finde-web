
'use strict';
const crypto=require('node:crypto');
module.exports=function payoutRoutes(pool){
 const key=process.env.HOST_PAYOUT_KEY||'';
 const available=/^[a-f0-9]{64}$/i.test(key);
 function encrypt(value){
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv('aes-256-gcm',Buffer.from(key,'hex'),iv);
  const data=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);
  return Buffer.concat([iv,cipher.getAuthTag(),data]);
 }
 function decrypt(value){
  const cipher=crypto.createDecipheriv('aes-256-gcm',Buffer.from(key,'hex'),value.subarray(0,12));
  cipher.setAuthTag(value.subarray(12,28));
  return JSON.parse(Buffer.concat([cipher.update(value.subarray(28)),cipher.final()]).toString('utf8'));
 }
 return async function payouts(route,method,body,reply,account){
  if(!available)return reply(503,{error:'Pagos aún no está habilitado'});
  if(account&&route==='/hosts/pagos'&&method==='GET'){
   const [[row]]=await pool.execute('SELECT datos FROM finde_host_bank WHERE host_id=?',[account.id]);
   const [documentos]=await pool.execute("SELECT id,tipo,folio,monto,referencia,estado,nota,DATE_FORMAT(fecha_pago,'%Y-%m-%d') AS fecha_pago FROM finde_host_documents WHERE host_id=? ORDER BY id DESC LIMIT 100",[account.id]);
   const bank=row?decrypt(row.datos):null;
   const cuenta=bank?{...bank,numero:'•••• '+bank.numero.slice(-4)}:null;
   return reply(200,{cuenta,documentos});
  }
  if(account&&route==='/hosts/pagos/banco'&&method==='POST'){
   const bank={};
   for(const [field,max] of Object.entries({titular:120,rut:12,banco:100,tipo:45,numero:30})){
    const value=typeof body[field]==='string'?body[field].trim():'';
    if(!value||value.length>max)return reply(400,{error:'Revisa los datos bancarios'});
    bank[field]=value;
   }
   if(!/^[0-9]{4,30}$/.test(bank.numero)||!/^\d{7,8}-[\dKk]$/.test(bank.rut))return reply(400,{error:'Revisa el RUT y número de cuenta'});
   await pool.execute('INSERT INTO finde_host_bank (host_id,datos) VALUES (?,?) ON DUPLICATE KEY UPDATE datos=VALUES(datos)',[account.id,encrypt(bank)]);
   return reply(200,{ok:true});
  }
  if(account&&route==='/hosts/pagos/documentos'&&method==='POST'){
   const {tipo,folio,referencia,pdf}=body;
   const monto=Number(body.monto);
   if(!['Boleta','Factura','Otro documento'].includes(tipo)||typeof folio!=='string'||!/^\d{1,20}$/.test(folio)||typeof referencia!=='string'||!referencia.trim()||referencia.length>100||!Number.isSafeInteger(monto)||monto<1||monto>100000000||typeof pdf!=='string'||pdf.length>1400000||!/^[A-Za-z0-9+/]+={0,2}$/.test(pdf))return reply(400,{error:'Revisa tipo, folio, monto, referencia y PDF'});
   const bytes=Buffer.from(pdf,'base64');
   if(bytes.length>1048576||bytes.subarray(0,5).toString()!=='%PDF-')return reply(400,{error:'Adjunta un PDF de hasta 1 MB'});
   const archivo=encrypt(pdf);
   const [updated]=await pool.execute("UPDATE finde_host_documents SET monto=?,referencia=?,archivo=?,estado='revision',nota='' WHERE host_id=? AND tipo=? AND folio=? AND estado='observado'",[monto,referencia.trim(),archivo,account.id,tipo,folio]);
   if(updated.affectedRows)return reply(200,{ok:true});
   try{
    await pool.execute('INSERT INTO finde_host_documents (host_id,tipo,folio,monto,referencia,archivo) VALUES (?,?,?,?,?,?)',[account.id,tipo,folio,monto,referencia.trim(),archivo]);
   }catch(e){
    if(e.code==='ER_DUP_ENTRY')return reply(409,{error:'Ya existe un documento de este tipo con ese folio'});
    throw e;
   }
   return reply(201,{ok:true});
  }
  if(!account&&route==='/admin/cobros-anfitriones'&&method==='GET'){
   const [documentos]=await pool.execute("SELECT d.id,d.tipo,d.folio,d.monto,d.referencia,d.estado,d.nota,DATE_FORMAT(d.fecha_pago,'%Y-%m-%d') AS fecha_pago,DATE_FORMAT(d.solicitado_en,'%Y-%m-%d') AS fecha_solicitud,a.nombre FROM finde_host_documents d JOIN finde_host_accounts a ON a.id=d.host_id ORDER BY d.solicitado_en ASC,d.id ASC");
   return reply(200,{documentos});
  }
  const match=route.match(/^\/admin\/cobros-anfitriones\/(\d+)(?:\/(pdf|banco))?$/);
  if(!account&&match){
   if(method==='GET'&&match[2]==='pdf'){
    const [[row]]=await pool.execute('SELECT archivo FROM finde_host_documents WHERE id=?',[match[1]]);
    return row?reply(200,{pdf:decrypt(row.archivo)}):reply(404,{error:'Documento no encontrado'});
   }
   if(method==='GET'&&match[2]==='banco'){
    const [[row]]=await pool.execute('SELECT b.datos FROM finde_host_bank b JOIN finde_host_documents d ON b.host_id=d.host_id WHERE d.id=?',[match[1]]);
    return row?reply(200,{cuenta:decrypt(row.datos)}):reply(404,{error:'El anfitrión aún no registró su cuenta'});
   }
   if(method==='PATCH'&&!match[2]){
    const note=typeof body.nota==='string'?body.nota.trim():'';
    const previous={aprobado:'revision',observado:'revision',pagado:'aprobado'};
    if(!Object.hasOwn(previous,body.estado)||note.length>500||(body.estado==='observado'&&!note))return reply(400,{error:'Revisa el estado y las observaciones'});
    const fecha=body.estado==='pagado'?body.fecha_pago:null;
    if(body.estado==='pagado'){
     if(typeof fecha!=='string'||!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(fecha))return reply(400,{error:'Indica la fecha de transferencia'});
     const parsed=new Date(fecha+'T00:00:00Z');
     if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==fecha)return reply(400,{error:'La fecha de transferencia es inválida'});
    }
    const [result]=await pool.execute('UPDATE finde_host_documents SET estado=?,nota=?,fecha_pago=? WHERE id=? AND estado=?',[body.estado,note,fecha,match[1],previous[body.estado]]);
    return result.affectedRows?reply(200,{ok:true}):reply(409,{error:'El documento cambió de estado'});
   }
  }
  return reply(404,{error:'Ruta no encontrada'});
 };
};
