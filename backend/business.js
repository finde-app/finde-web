'use strict';

const maxFile = 1024 * 1024;
const fields = {razon:160,rut:16,giro:180,direccion:220,comuna:100,region:100,telefono:28,whatsapp:28,representante:160,contacto:28,whatsappContacto:28};
const fileKeys = ['registro','poder','cedula','frente','reverso','logo'];
const deserialize = value => typeof value === 'string' ? JSON.parse(value) : value;
const publicData = (row, files) => ({
  datos: deserialize(row.datos), estado: row.estado, version: row.version,
  observacion: row.observacion, verificada: row.verificada,
  archivos: Object.fromEntries(Object.entries(files).map(([key,file]) => [key,file.nombre]))
});
function validRut(value) {
  const match = value.replace(/[.\s-]/g,'').toUpperCase().match(/^([1-9]\d{5,7})([\dK])$/);
  if (!match) return false;
  const sum = [...match[1]].reverse().reduce((total,digit,i)=>total+Number(digit)*(2+i%6),0);
  const digit=11-sum%11;
  return (digit===11?'0':digit===10?'K':String(digit))===match[2];
}
function validFile(key,file) {
  if (!file || typeof file.nombre !== 'string' || !file.nombre.trim() || file.nombre.length>180 ||
      typeof file.base64 !== 'string' || file.base64.length>Math.ceil(maxFile/3)*4 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(file.base64)) return false;
  const bytes=Buffer.from(file.base64,'base64');
  if (!bytes.length || bytes.length>maxFile) return false;
  if (['registro','poder','cedula'].includes(key)) return file.tipo==='application/pdf' && bytes.subarray(0,5).toString()==='%PDF-';
  return file.tipo==='image/jpeg' && bytes[0]===255 && bytes[1]===216 && bytes[2]===255;
}
module.exports = function businessRoutes(pool) {
  async function reviewed(hostIds) {
    if (!hostIds.length) return new Set();
    try {
      const [rows]=await pool.execute("SELECT host_id FROM finde_host_business WHERE estado='verificada' AND host_id IN ("+hostIds.map(()=>'?').join(',')+")",hostIds);
      return new Set(rows.map(row=>String(row.host_id)));
    } catch(error) {
      if(error.code==='ER_NO_SUCH_TABLE')return new Set();
      throw error;
    }
  }
  async function handle(route,method,body,reply,account) {
    const admin=route.startsWith('/admin/');
    const match=route.match(/^\/admin\/empresas-anfitriones\/([1-9]\d{0,14})(?:\/archivo\/([a-z]+))?$/);
    const hostFile=route.match(/^\/hosts\/empresa\/archivo\/([a-z]+)$/)?.[1];
    if(admin && method==='GET' && route==='/admin/empresas-anfitriones'){
      const [rows]=await pool.execute("SELECT host_id, JSON_UNQUOTE(JSON_EXTRACT(datos,'$.razon')) AS razon, estado FROM finde_host_business WHERE estado<>'borrador' ORDER BY (estado='revision') DESC, host_id DESC LIMIT 200");
      return reply(200,{empresas:rows});
    }
    const id=admin?match?.[1]:account.id;
    if(!id)return reply(404,{error:'Ruta no encontrada'});
    if(admin && method==='PATCH' && match && !match[2]){
      const note=typeof body.observacion==='string'?body.observacion.trim():'';
      if(!['verificada','observada'].includes(body.estado)||!Number.isSafeInteger(body.version)||note.length>1000||(body.estado==='observada'&&!note))return reply(400,{error:'Revisa el estado y las observaciones'});
      const [result]=await pool.execute("UPDATE finde_host_business SET estado=?, observacion=?, verificada=IF(?='verificada',NOW(),NULL), version=version+1 WHERE host_id=? AND estado='revision' AND version=?",[body.estado,body.estado==='observada'?note:'',body.estado,id,body.version]);
      return result.affectedRows?reply(200,{ok:true}):reply(409,{error:'La empresa cambió. Abre nuevamente el registro antes de revisar.'});
    }
    const [rows]=await pool.execute('SELECT * FROM finde_host_business WHERE host_id=?',[id]);
    const row=rows[0];
    const files=row?deserialize(row.archivos):{};
    if(admin)delete files.logo;
    if(admin && (!row||row.estado==='borrador'))return reply(404,{error:'Empresa no disponible'});
    const fileKey=admin?match?.[2]:hostFile;
    if(method==='GET' && fileKey){
      const file=Object.hasOwn(files,fileKey)?files[fileKey]:null;
      return file?reply(200,file):reply(404,{error:'Archivo no disponible'});
    }
    if(method==='GET' && (admin||route==='/hosts/empresa'))return reply(200,{empresa:row?publicData(row,files):null});
    if(admin || method!=='POST' || route!=='/hosts/empresa')return reply(404,{error:'Ruta no encontrada'});
    if(!Number.isSafeInteger(body.version)||body.version!==(row?.version||0))return reply(409,{error:'La empresa cambió. Actualiza la página antes de guardar.'});
    const datos={};
    for(const [key,max] of Object.entries(fields)){
      const value=typeof body.datos?.[key]==='string'?body.datos[key].trim():'';
      if(value.length>max || (body.enviar===true && !value))return reply(400,{error:'Completa y revisa los datos de la empresa.'});
      datos[key]=value;
    }
    if(body.enviar===true&&!validRut(datos.rut))return reply(400,{error:'Revisa el RUT de la empresa.'});
    for(const key of fileKeys){
      if(!Object.hasOwn(body.archivos||{},key))continue;
      const file=body.archivos[key];
      if(!validFile(key,file))return reply(400,{error:'Revisa el formato y el tamaño de los archivos.'});
      files[key]={nombre:file.nombre.trim(),tipo:file.tipo,base64:file.base64};
      if(key==='cedula'){delete files.frente;delete files.reverso;}
      if(key==='frente'||key==='reverso')delete files.cedula;
    }
    datos.mismoDocumento=body.mismoDocumento===true;
    if(body.enviar===true&&(!files.registro||(!datos.mismoDocumento&&!files.poder)||(!files.cedula&&!(files.frente&&files.reverso))))return reply(400,{error:'Adjunta los tres documentos de acreditación antes de enviar.'});
    const estado=body.enviar===true?'revision':'borrador';
    const values=[JSON.stringify(datos),JSON.stringify(files),estado];
    if(!row){
      try{await pool.execute('INSERT INTO finde_host_business (host_id,datos,archivos,estado) VALUES (?,?,?,?)',[id,...values]);}
      catch(error){if(error.code==='ER_DUP_ENTRY')return reply(409,{error:'La empresa cambió. Actualiza la página.'});throw error;}
    }else{
      const [result]=await pool.execute("UPDATE finde_host_business SET datos=?,archivos=?,estado=?,observacion='',verificada=NULL,version=version+1 WHERE host_id=? AND version=?",[...values,id,body.version]);
      if(!result.affectedRows)return reply(409,{error:'La empresa cambió. Actualiza la página.'});
    }
    return reply(200,{empresa:publicData({datos,estado,version:body.version+1,observacion:'',verificada:null},files)});
  }
  return {handle,reviewed};
};
