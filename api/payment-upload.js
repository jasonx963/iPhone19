import { kv } from '@vercel/kv';
import Busboy from 'busboy';
export const config = { api: { bodyParser: false } };
function parseForm(req){
  return new Promise((resolve,reject) => {
    const busboy = Busboy({ headers: req.headers });
    const fields = {}; const files = [];
    busboy.on('field', (n,v) => fields[n]=v);
    busboy.on('file', (n, file, info) => {
      const chunks = [];
      file.on('data', d => chunks.push(d));
      file.on('end', () => {
        const buf = Buffer.concat(chunks);
        files.push({ name: info.filename || 'file', mimetype: info.mimeType || info.mime || 'application/octet-stream', buffer: buf });
      });
    });
    busboy.on('finish', () => resolve({ fields, files }));
    busboy.on('error', reject);
    req.pipe(busboy);
  });
}
export default async function handler(req,res){
  if(req.method !== 'POST') return res.status(405).json({ ok:false, message:'Method not allowed' });
  try{
    const { fields, files } = await parseForm(req);
    const orderId = (fields.orderId || '').trim();
    const product = (fields.product || '').trim();
    const note = (fields.note || '').trim();
    if(!orderId || !files.length) return res.status(400).json({ ok:false, message:'orderId y archivo son obligatorios' });
    const f = files[0];
    const b64 = f.buffer.toString('base64');
    const key = `payment:${orderId}`;
    const payload = { orderId, product, note, filename: f.name, mimetype: f.mimetype, size: f.buffer.length, dataBase64: b64, createdAt: new Date().toISOString().replace('T',' ').slice(0,19) };
    await kv.set(key, payload);
    await kv.zadd('payments:index', { score: Date.now(), member: orderId });
    res.json({ ok:true, orderId });
  }catch(e){
    console.error(e); res.status(500).json({ ok:false, message: e?.message || 'upload failed' });
  }
}