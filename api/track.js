import { kv } from '@vercel/kv';
export default async function handler(req,res){
  try{
    const { orderId } = req.query;
    if(!orderId) return res.status(400).json({ ok:false, message:'orderId is required' });
    const order = await kv.get(`order:${orderId}`);
    if(!order) return res.status(404).json({ ok:false, message:'order not found' });
    const { trackingNumber, trackingUrl, carrier, status } = order;
    res.json({ ok:true, orderId, trackingNumber: trackingNumber || null, trackingUrl: trackingUrl || null, carrier: carrier || null, status: status || 'pending' });
  }catch(e){
    res.status(500).json({ ok:false, message:e?.message || 'failed' });
  }
}