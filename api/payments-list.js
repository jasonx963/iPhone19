import { kv } from '@vercel/kv';
export default async function handler(req,res){
  try{
    const limit = Math.min(parseInt(req.query.limit||'100',10)||100, 500);
    const ids = await kv.zrange('payments:index', -limit, -1);
    const items = await Promise.all(ids.map(id => kv.get(`payment:${id}`)));
    items.reverse();
    res.json({ ok:true, items });
  }catch(e){
    res.status(500).json({ ok:false, message: e?.message || 'failed' });
  }
}