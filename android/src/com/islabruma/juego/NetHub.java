package com.islabruma.juego;

import android.util.Base64;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InterfaceAddress;
import java.net.NetworkInterface;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.Charset;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Relé WebSocket para el multijugador local (sin internet).
 * - El anfitrión se conecta a ws://127.0.0.1:PORT/host; los demás a ws://IP:PORT/.
 * - Mensajes de jugadores -> anfitrión envueltos como {"from":ID,"d":MENSAJE}.
 * - Mensajes del anfitrión "DESTINO|MENSAJE" (DESTINO = id o *) -> jugadores.
 * - Descubrimiento por UDP: "THEBRUMA?" -> "THEBRUMA!nombre|puerto".
 */
public class NetHub {
    public static final int PORT = 47800;
    public static final int UDP_PORT = 47801;
    public static final int MAX_CLIENTS = 4;
    private static final Charset UTF8 = Charset.forName("UTF-8");

    private ServerSocket server;
    private DatagramSocket udp;
    private volatile boolean running = false;
    private volatile Conn host = null;
    private final Map<Integer, Conn> clients = new ConcurrentHashMap<Integer, Conn>();
    private int nextId = 1;
    private String name = "TheBruma";

    public synchronized boolean start(String hostName) {
        if (running) return true;
        name = hostName == null ? "TheBruma" : hostName;
        try {
            server = new ServerSocket(PORT);
            running = true;
            new Thread(new Runnable() {
                @Override
                public void run() {
                    acceptLoop();
                }
            }, "hub-accept").start();
            new Thread(new Runnable() {
                @Override
                public void run() {
                    udpLoop();
                }
            }, "hub-udp").start();
            return true;
        } catch (IOException e) {
            running = false;
            return false;
        }
    }

    public synchronized void stop() {
        running = false;
        try { if (server != null) server.close(); } catch (IOException ignored) { }
        try { if (udp != null) udp.close(); } catch (Exception ignored) { }
        for (Conn c : clients.values()) c.close();
        clients.clear();
        if (host != null) host.close();
        host = null;
    }

    private void acceptLoop() {
        while (running) {
            try {
                final Socket s = server.accept();
                s.setTcpNoDelay(true);
                new Thread(new Conn(s), "hub-conn").start();
            } catch (IOException e) {
                if (!running) return;
            }
        }
    }

    private void udpLoop() {
        try {
            udp = new DatagramSocket(null);
            udp.setReuseAddress(true);
            udp.bind(new java.net.InetSocketAddress(UDP_PORT));
            udp.setBroadcast(true);
            byte[] buf = new byte[256];
            while (running) {
                DatagramPacket p = new DatagramPacket(buf, buf.length);
                udp.receive(p);
                String msg = new String(p.getData(), 0, p.getLength(), UTF8);
                if (msg.startsWith("THEBRUMA?")) {
                    byte[] out = ("THEBRUMA!" + name + "|" + PORT + "|" + (clients.size() + 1)).getBytes(UTF8);
                    udp.send(new DatagramPacket(out, out.length, p.getAddress(), p.getPort()));
                }
            }
        } catch (Exception ignored) {
        }
    }

    // ------------------------------------------------------------------ conexión WebSocket
    private class Conn implements Runnable {
        final Socket s;
        InputStream in;
        OutputStream out;
        int id = -1;
        boolean isHost = false;

        Conn(Socket s) {
            this.s = s;
        }

        @Override
        public void run() {
            try {
                in = s.getInputStream();
                out = s.getOutputStream();
                String path = handshake();
                if (path == null) { close(); return; }
                if (path.startsWith("/host")) {
                    if (host != null) { close(); return; }
                    isHost = true;
                    id = 0;
                    host = this;
                } else {
                    synchronized (NetHub.this) {
                        if (clients.size() >= MAX_CLIENTS || host == null) { sendText("{\"t\":\"full\"}"); close(); return; }
                        id = nextId++;
                        clients.put(id, this);
                    }
                    sendText("{\"t\":\"hello\",\"id\":" + id + "}");
                    Conn h = host;
                    if (h != null) h.sendText("{\"from\":" + id + ",\"d\":{\"t\":\"join\"}}");
                }
                readLoop();
            } catch (Exception ignored) {
            } finally {
                close();
                if (isHost) {
                    host = null;
                    for (Conn c : clients.values()) c.close();
                    clients.clear();
                } else if (id > 0) {
                    clients.remove(id);
                    Conn h = host;
                    if (h != null) h.sendText("{\"from\":" + id + ",\"d\":{\"t\":\"leave\"}}");
                }
            }
        }

        private String handshake() throws Exception {
            StringBuilder line = new StringBuilder();
            String path = null, key = null;
            int prev = -1, c;
            List<String> lines = new ArrayList<String>();
            while ((c = in.read()) != -1) {
                if (c == '\n' && prev == '\r') {
                    String l = line.toString().trim();
                    line.setLength(0);
                    if (l.isEmpty()) break;
                    lines.add(l);
                } else if (c != '\r') {
                    line.append((char) c);
                }
                prev = c;
                if (lines.size() > 64) return null;
            }
            for (String l : lines) {
                if (l.startsWith("GET ")) {
                    String[] parts = l.split(" ");
                    if (parts.length > 1) path = parts[1];
                } else if (l.toLowerCase().startsWith("sec-websocket-key:")) {
                    key = l.substring(l.indexOf(':') + 1).trim();
                }
            }
            if (key == null || path == null) return null;
            MessageDigest sha = MessageDigest.getInstance("SHA-1");
            byte[] digest = sha.digest((key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").getBytes(UTF8));
            String accept = Base64.encodeToString(digest, Base64.NO_WRAP);
            String resp = "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + accept + "\r\n\r\n";
            synchronized (this) {
                out.write(resp.getBytes(UTF8));
                out.flush();
            }
            return path;
        }

        private int readByte() throws IOException {
            int b = in.read();
            if (b < 0) throw new IOException("eof");
            return b;
        }

        private void readLoop() throws IOException {
            ByteArrayOutputStream msg = new ByteArrayOutputStream();
            while (running) {
                int b0 = readByte(), b1 = readByte();
                boolean fin = (b0 & 0x80) != 0;
                int op = b0 & 0x0F;
                boolean masked = (b1 & 0x80) != 0;
                long len = b1 & 0x7F;
                if (len == 126) len = (readByte() << 8) | readByte();
                else if (len == 127) { len = 0; for (int i = 0; i < 8; i++) len = (len << 8) | readByte(); }
                if (len > 1 << 20) throw new IOException("grande");
                byte[] mask = new byte[4];
                if (masked) for (int i = 0; i < 4; i++) mask[i] = (byte) readByte();
                byte[] data = new byte[(int) len];
                int off = 0;
                while (off < len) {
                    int r = in.read(data, off, (int) len - off);
                    if (r < 0) throw new IOException("eof");
                    off += r;
                }
                if (masked) for (int i = 0; i < len; i++) data[i] ^= mask[i % 4];
                if (op == 8) return;
                if (op == 9) { sendFrame(0xA, data); continue; }
                if (op == 0xA) continue;
                if (op == 1 || op == 0) {
                    msg.write(data, 0, data.length);
                    if (fin) {
                        onText(new String(msg.toByteArray(), UTF8));
                        msg.reset();
                    }
                }
            }
        }

        private void onText(String text) {
            if (isHost) {
                int bar = text.indexOf('|');
                if (bar < 0) return;
                String to = text.substring(0, bar);
                String payload = text.substring(bar + 1);
                if (to.equals("*")) {
                    for (Conn c : clients.values()) c.sendText(payload);
                } else {
                    try {
                        Conn c = clients.get(Integer.parseInt(to));
                        if (c != null) c.sendText(payload);
                    } catch (NumberFormatException ignored) { }
                }
            } else {
                Conn h = host;
                if (h != null) h.sendText("{\"from\":" + id + ",\"d\":" + text + "}");
            }
        }

        void sendText(String text) {
            sendFrame(1, text.getBytes(UTF8));
        }

        synchronized void sendFrame(int op, byte[] data) {
            try {
                out.write(0x80 | op);
                int len = data.length;
                if (len < 126) out.write(len);
                else if (len < 65536) { out.write(126); out.write((len >> 8) & 0xFF); out.write(len & 0xFF); }
                else { out.write(127); for (int i = 7; i >= 0; i--) out.write((int) (((long) len >> (8 * i)) & 0xFF)); }
                out.write(data);
                out.flush();
            } catch (Exception e) {
                close();
            }
        }

        void close() {
            try { s.close(); } catch (Exception ignored) { }
        }
    }

    // ------------------------------------------------------------------ utilidades
    public static String localIps() {
        JSONArray arr = new JSONArray();
        try {
            for (NetworkInterface ni : Collections.list(NetworkInterface.getNetworkInterfaces())) {
                if (!ni.isUp() || ni.isLoopback()) continue;
                for (InetAddress a : Collections.list(ni.getInetAddresses())) {
                    if (a instanceof Inet4Address) arr.put(a.getHostAddress());
                }
            }
        } catch (Exception ignored) { }
        return arr.toString();
    }

    /** Busca partidas en la red local (bloquea ~1.5 s; llamar en un hilo). */
    public static String discover() {
        JSONArray found = new JSONArray();
        DatagramSocket ds = null;
        try {
            ds = new DatagramSocket();
            ds.setBroadcast(true);
            ds.setSoTimeout(400);
            byte[] q = "THEBRUMA?".getBytes(UTF8);
            List<InetAddress> targets = new ArrayList<InetAddress>();
            targets.add(InetAddress.getByName("255.255.255.255"));
            Enumeration<NetworkInterface> nis = NetworkInterface.getNetworkInterfaces();
            while (nis.hasMoreElements()) {
                NetworkInterface ni = nis.nextElement();
                if (!ni.isUp() || ni.isLoopback()) continue;
                for (InterfaceAddress ia : ni.getInterfaceAddresses()) if (ia.getBroadcast() != null) targets.add(ia.getBroadcast());
            }
            long end = System.currentTimeMillis() + 1600;
            int round = 0;
            List<String> seen = new ArrayList<String>();
            while (System.currentTimeMillis() < end) {
                if (round++ % 2 == 0) for (InetAddress t : targets) {
                    try { ds.send(new DatagramPacket(q, q.length, t, UDP_PORT)); } catch (Exception ignored) { }
                }
                try {
                    byte[] buf = new byte[256];
                    DatagramPacket p = new DatagramPacket(buf, buf.length);
                    ds.receive(p);
                    String msg = new String(p.getData(), 0, p.getLength(), UTF8);
                    String ip = p.getAddress().getHostAddress();
                    if (msg.startsWith("THEBRUMA!") && !seen.contains(ip)) {
                        seen.add(ip);
                        String[] parts = msg.substring(9).split("\\|");
                        JSONObject o = new JSONObject();
                        o.put("ip", ip);
                        o.put("name", parts.length > 0 ? parts[0] : "?");
                        o.put("players", parts.length > 2 ? parts[2] : "1");
                        found.put(o);
                    }
                } catch (Exception ignored) { }
            }
        } catch (Exception ignored) {
        } finally {
            if (ds != null) ds.close();
        }
        return found.toString();
    }
}
