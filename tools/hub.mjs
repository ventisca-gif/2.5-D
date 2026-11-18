// Relé de pruebas para el multijugador (mismo protocolo que NetHub.java).
// Uso: node tools/hub.mjs   -> anfitrión en ws://127.0.0.1:47800/host, jugadores en ws://IP:47800/
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT || 47800);
const wss = new WebSocketServer({ port: PORT });
let host = null, nextId = 1;
const clients = new Map();
wss.on('connection', (ws, req) => {
  if (req.url.startsWith('/host')) {
    if (host) return ws.close();
    host = ws;
    ws.on('message', (buf) => {
      const text = buf.toString();
      const bar = text.indexOf('|');
      if (bar < 0) return;
      const to = text.slice(0, bar), payload = text.slice(bar + 1);
      if (to === '*') for (const c of clients.values()) c.send(payload);
      else clients.get(Number(to))?.send(payload);
    });
    ws.on('close', () => { host = null; for (const c of clients.values()) c.close(); clients.clear(); });
    return;
  }
  if (!host || clients.size >= 4) { ws.send('{"t":"full"}'); return ws.close(); }
  const id = nextId++;
  clients.set(id, ws);
  ws.send(JSON.stringify({ t: 'hello', id }));
  host.send(`{"from":${id},"d":{"t":"join"}}`);
  ws.on('message', (buf) => host && host.send(`{"from":${id},"d":${buf.toString()}}`));
  ws.on('close', () => { clients.delete(id); host && host.send(`{"from":${id},"d":{"t":"leave"}}`); });
});
console.log(`hub en ${PORT}`);
