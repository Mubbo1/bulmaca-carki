// Bulmaca Çarkı bildirim sunucusu (Cloudflare Worker)
// Arkadaşlar arası "oyuna girdi" ve "düello daveti" bildirimlerini Apple'a (APNs) iletir.
// Gizli anahtar: Cloudflare'de APNS_KEY adlı "Secret" olarak saklanır (AuthKey_U73NLUGMLA.p8 dosyasının içeriği).
const DB = "https://bulmaca-carki-default-rtdb.firebaseio.com";
const KEY_ID = "U73NLUGMLA", TEAM_ID = "RQ28S62U63", TOPIC = "com.bulmacacarki.game";
const LIMIT = { online: 30 * 60e3, invite: 20e3 }; // aynı kişiye aynı türde en sık bildirim aralığı
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const ok = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json", ...CORS } });
const safe = s => /^[A-Za-z0-9_-]{6,64}$/.test(s || "");
const pick = a => a[Math.floor(Math.random() * a.length)];
const cleanName = n => String(n || "Arkadaşın").replace(/[\u0000-\u001f<>]/g, "").slice(0, 20) || "Arkadaşın";
async function db(path, tok, opt = {}) {
  const r = await fetch(`${DB}/${path}.json?auth=${encodeURIComponent(tok)}`, opt);
  if (!r.ok) throw new Error("db " + r.status + " " + path);
  return r.json();
}
let jwtCache = { t: 0, v: "" };
const b64u = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64uStr = s => b64u(new TextEncoder().encode(s));
async function apnsJwt(env) {
  if (jwtCache.v && Date.now() - jwtCache.t < 40 * 60e3) return jwtCache.v;
  const pem = String(env.APNS_KEY || "").replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const head = b64uStr(JSON.stringify({ alg: "ES256", kid: KEY_ID }));
  const body = b64uStr(JSON.stringify({ iss: TEAM_ID, iat: Math.floor(Date.now() / 1000) }));
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(head + "." + body));
  jwtCache = { t: Date.now(), v: head + "." + body + "." + b64u(sig) };
  return jwtCache.v;
}
async function apns(env, token, title, body, data) {
  const jwt = await apnsJwt(env);
  const payload = { aps: { alert: { title, body }, sound: "default" }, ...data };
  const send = host => fetch(`https://${host}/3/device/${token}`, { method: "POST", headers: { authorization: "bearer " + jwt, "apns-topic": TOPIC, "apns-push-type": "alert", "apns-priority": "10", "content-type": "application/json" }, body: JSON.stringify(payload) });
  let r = await send("api.push.apple.com");
  if (r.status === 400) { const t = await r.text(); if (/BadDeviceToken/.test(t)) r = await send("api.sandbox.push.apple.com"); else return { s: 400, t }; }
  return { s: r.status, t: r.status === 200 ? "" : await r.text() };
}
const MSG = {
  online: n => [
    [`⚔️ ${n} oyuna girdi!`, `${n} şu an çevrimiçi. Onu yenmeye ne dersin?`],
    [`🔥 ${n} sahada!`, `${n} Bulmaca Çarkı'na girdi. Bir düelloya var mısın?`],
    [`👀 ${n} seni bekliyor`, `${n} şu an oyunda. Hemen meydan oku!`],
    [`🏆 ${n} çevrimiçi`, `Sıralamada ${n}'ı geçmek için tam zamanı. Düelloya gel!`],
  ],
  invite: n => [
    [`⚔️ ${n} sana düello gönderiyor!`, `${n} seni düelloya çağırıyor. Dokun ve hemen kabul et!`],
    [`🎯 Düello daveti`, `${n} seninle kapışmak istiyor. Bekletme, hemen gir!`],
  ],
};
export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (req.method !== "POST") return ok({ ok: true, service: "bulmaca-carki-push" });
    let j; try { j = await req.json(); } catch (e) { return ok({ err: "json" }, 400); }
    const { t, from, to, type } = j || {};
    if (!t || !safe(from) || !safe(to) || from === to || !MSG[type]) return ok({ err: "bad" }, 400);
    try {
      // 1) gönderen gerçekten "from" mu ve "to" onun arkadaşı mı? (friends/from yalnızca sahibi okuyabilir)
      const a = await db(`friends/${from}/${to}`, t);
      if (!a) return ok({ err: "notfriend" }, 403);
      // 2) karşı taraf da onu arkadaş olarak eklemiş mi?
      const b = await db(`friends/${to}/${from}`, t).catch(() => null);
      if (!b) return ok({ err: "notmutual" }, 403);
      // 3) sıklık sınırı
      const lk = `pushLog/${from}/${to}_${type}`;
      const last = await db(lk, t).catch(() => 0);
      if (last && Date.now() - last < LIMIT[type]) return ok({ skip: "limit" });
      await db(lk, t, { method: "PUT", body: JSON.stringify(Date.now()) });
      // 4) alıcının cihaz anahtarı
      const p = await db(`push/${to}`, t).catch(() => null);
      if (!p || !p.tk) return ok({ skip: "notoken" });
      const prof = await db(`profiles/${from}/name`, t).catch(() => "");
      const n = cleanName(prof);
      const [title, body] = pick(MSG[type](n));
      const r = await apns(env, p.tk, title, body, { k: type, f: from, c: j.code ? String(j.code).slice(0, 8) : "" });
      return ok({ sent: r.s === 200, s: r.s, t: r.t });
    } catch (e) { return ok({ err: String(e.message || e) }, 500); }
  },
};
