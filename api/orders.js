import { kv } from '@vercel/kv';
async function readBody(req){
  return new Promise((resolve, reject) => {
    let data=''; req.on('data', c => data += c);
    req.on('end', () => { try{ resolve(data ? JSON.parse(data) : {}); }catch(e){ reject(e); } });
    req.on('error', reject);
  });
}
export default async function handler(req, res){
  try{
    if(req.method === 'POST'){
      const b = await readBody(req);
      const id = (b.id || Date.now().toString(36));
      const order = {
        id,
        productId: b.productId || '',
        product: b.product || '',
        price: b.price || '',
        name: b.name || '',
        phone: b.phone || '',
        address: b.address || '',
        note: b.note || '',
        status: 'pending',
        createdAt: new Date().toISOString().replace('T',' ').slice(0,19)
      };
      await kv.set(`order:${id}`, order);
      await kv.zadd('orders:index', { score: Date.now(), member: id });
      return res.json({ ok:true, id, order });
    }
    if(req.method === 'PUT' || req.method === 'PATCH'){
      const b = await readBody(req);
      const id = b.id;
      if(!id) return res.status(400).json({ ok:false, message:'id is required' });
      const old = await kv.get(`order:${id}`);
      if(!old) return res.status(404).json({ ok:false, message:'order not found' });
      const updated = { ...old, ...b, id };
      await kv.set(`order:${id}`, updated);
      return res.json({ ok:true, order: updated });
    }
    if(req.method === 'GET'){
      const { id, list, limit } = req.query;
      if(id){
        const order = await kv.get(`order:${id}`);
        if(!order) return res.status(404).json({ ok:false, message:'order not found' });
        return res.json({ ok:true, order });
      }
      if(list !== undefined){
        const m = Math.min(parseInt(limit||'100',10)||100, 500);
        const ids = await kv.zrange('orders:index', -m, -1);
        const items = await Promise.all(ids.map(i => kv.get(`order:${i}`)));
        items.reverse();
        return res.json({ ok:true, items });
      }
      return res.status(400).json({ ok:false, message:'use ?id=xxx or ?list=1' });
    }
    return res.status(405).json({ ok:false, message:'Method not allowed' });
  }catch(e){
    console.error(e); return res.status(500).json({ ok:false, message:e?.message || 'failed' });
  }
}
