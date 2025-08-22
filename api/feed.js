import { kv } from '@vercel/kv';
export default async function handler(req, res){
  try{
    const limit = Math.min(parseInt(req.query.limit||'20',10)||20, 100);
    const ids = await kv.zrange('orders:index', -limit, -1);
    const items = await Promise.all(ids.map(i => kv.get(`order:${i}`)));
    items.reverse();
    const xmlItems = items.map(o => `<item><title><![CDATA[${o.product||'Pedido'}]]></title><description><![CDATA[Pedido ${o.id||''} - ${o.status||''}]]></description><guid>${o.id||''}</guid><pubDate>${new Date(o.createdAt||Date.now()).toUTCString()}</pubDate></item>`).join('');
    const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Pedidos</title><link>/</link><description>Últimos pedidos</description>${xmlItems}</channel></rss>`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.status(200).send(xml);
  }catch(e){
    res.status(500).send('Error');
  }
}