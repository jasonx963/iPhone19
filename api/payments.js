import { kv } from '@vercel/kv';
export default async function handler(req,res){
  try{
    const { orderId } = req.query;
    if(!orderId) return res.status(400).json({ ok:false, message:'orderId is required' });
    const p = await kv.get(`payment:${orderId}`);
    if(!p) return res.status(404).json({ ok:false, message:'payment not found' });
    res.json({ ok:true, payment: p });
  }catch(e){
    res.status(500).json({ ok:false, message:e?.message || 'failed' });
  }
}