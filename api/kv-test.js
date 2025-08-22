import { kv } from '@vercel/kv';
export default async function handler(req, res){
  try{
    const now = new Date().toISOString();
    await kv.set('kv-test:last', now);
    const last = await kv.get('kv-test:last');
    res.json({ ok:true, last });
  }catch(e){
    res.status(500).json({ ok:false, message:e?.message || 'failed' });
  }
}