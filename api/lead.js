/*
 * POST /api/lead saves a lead to the Supabase `leads` table.
 * GET  /api/lead runs a small query; the daily cron in vercel.json uses it
 *      so a free Supabase project doesn't get paused for inactivity.
 *
 * Needs the SUPABASE_SECRET_KEY environment variable in Vercel.
 */
const SUPABASE_URL = 'https://xwwyigmdydnrqvyjqofx.supabase.co';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[0-9+()\s-]{7,20}$/;
const SOURCES = ['popup', 'page'];

const clean = (value) => (typeof value === 'string' ? value.trim() : '');

function leads(query, options = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/leads${query}`, {
    ...options,
    headers: { apikey: process.env.SUPABASE_SECRET_KEY, ...options.headers },
  });
}

async function saveLead(body) {
  const email = clean(body.email).slice(0, 254);
  const phone = clean(body.phone);
  const source = clean(body.source);
  if (!EMAIL.test(email) || !PHONE.test(phone) || !SOURCES.includes(source)) return 400;

  // Bots fill the hidden "company" field. Pretend it worked and save nothing.
  if (clean(body.company)) return 200;

  const response = await leads('', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ email, phone, source, needs: clean(body.needs).slice(0, 300) || null }),
  });
  if (response.ok) return 200;
  console.error('Supabase insert failed', response.status, await response.text());
  return 502;
}

module.exports = async (req, res) => {
  if (!process.env.SUPABASE_SECRET_KEY) {
    console.error('SUPABASE_SECRET_KEY is not set');
    return res.status(500).json({ ok: false });
  }
  try {
    if (req.method === 'GET') {
      const response = await leads('?select=id&limit=1');
      return res.status(response.ok ? 200 : 502).json({ ok: response.ok });
    }
    if (req.method === 'POST') {
      const status = await saveLead(req.body ?? {});
      return res.status(status).json({ ok: status === 200 });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false });
  } catch (error) {
    console.error('Lead request failed', error);
    return res.status(500).json({ ok: false });
  }
};
