"use client";

import { useEffect, useMemo, useState } from "react";

type Article = {
  title: string;
  link: string;
  publishedAt?: string;
  source?: string;
};

type NewsResponse = { articles: Article[] };

function useLocalSetting(key: string, initial: string = "") {
  const [value, setValue] = useState<string>("");
  useEffect(() => {
    const v = window.localStorage.getItem(key);
    setValue(v ?? initial);
  }, [key, initial]);
  useEffect(() => {
    if (value !== undefined) {
      window.localStorage.setItem(key, value);
    }
  }, [key, value]);
  return [value, setValue] as const;
}

export default function Page() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [token, setToken] = useLocalSetting("telegram.botToken");
  const [chatId, setChatId] = useLocalSetting("telegram.chatId");

  const anySelected = useMemo(() => Object.values(selected).some(Boolean), [selected]);

  async function fetchNews(query: string) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/news?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur de chargement des news");
      const data: NewsResponse = await res.json();
      setArticles(data.articles);
      const defaults: Record<string, boolean> = {};
      for (const a of data.articles) defaults[a.link] = false;
      setSelected(defaults);
    } catch (e) {
      console.error(e);
      alert("Impossible de r?cup?rer les news.");
    } finally {
      setLoading(false);
    }
  }

  async function publishSelected() {
    const chosen = articles.filter(a => selected[a.link]);
    if (chosen.length === 0) return;
    if (!token || !chatId) {
      alert("Renseignez le token et le chat id Telegram dans R?glages.");
      setShowSettings(true);
      return;
    }
    const messages = chosen.map(a => `${a.title}\n${a.link}`);
    const res = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, chatId, messages })
    });
    if (!res.ok) {
      const t = await res.text();
      alert(`?chec d'envoi: ${t}`);
      return;
    }
    alert("Messages envoy?s sur Telegram ?");
  }

  useEffect(() => {
    fetchNews("");
  }, []);

  return (
    <div className="container">
      <div className="header">
        <div className="title">Agent News ? Telegram</div>
        <div className="row">
          <button className="button" onClick={() => setShowSettings(true)}>R?glages</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="row" style={{ gap: 8 }}>
          <input
            className="input"
            placeholder="Rechercher des news (ex: IA, ?conomie, sport)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') fetchNews(q); }}
          />
          <button className="button" onClick={() => fetchNews(q)} disabled={loading}>
            {loading ? "Chargement..." : "Chercher"}
          </button>
          <button className="button" onClick={publishSelected} disabled={!anySelected}>
            Publier sur Telegram
          </button>
        </div>
        <div className="small" style={{ marginTop: 8 }}>
          Astuce: configurez votre bot et chat id dans R?glages. Rien n'est stock? c?t? serveur.
        </div>
      </div>

      <div className="grid">
        {articles.map((a) => (
          <label key={a.link} className="card" style={{ display: 'block', cursor: 'pointer' }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div className="badge">{a.source ?? 'Google News'}</div>
              <input type="checkbox" checked={Boolean(selected[a.link])} onChange={(e) => setSelected(s => ({ ...s, [a.link]: e.target.checked }))} />
            </div>
            <div style={{ marginTop: 8, fontWeight: 600 }}>{a.title}</div>
            <a className="link mono" href={a.link} target="_blank" rel="noreferrer" style={{ display:'inline-block', marginTop: 6 }}>{a.link}</a>
            {a.publishedAt && (
              <div className="small" style={{ marginTop: 6 }}>Publi?: {new Date(a.publishedAt).toLocaleString()}</div>
            )}
          </label>
        ))}
      </div>

      {showSettings && (
        <div className="modal-backdrop" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="title" style={{ marginBottom: 8 }}>R?glages Telegram</div>
            <div className="small" style={{ marginBottom: 12 }}>
              Le token et le chat id sont stock?s seulement dans votre navigateur.
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              <label>
                <div className="small">Bot Token</div>
                <input className="input" value={token} onChange={(e)=>setToken(e.target.value)} placeholder="1234567:ABC-DEF..." />
              </label>
              <label>
                <div className="small">Chat ID (utilisateur, groupe ou canal)</div>
                <input className="input" value={chatId} onChange={(e)=>setChatId(e.target.value)} placeholder="@nom_du_canal ou 123456789" />
              </label>
              <div className="row" style={{ justifyContent:'flex-end', gap:8 }}>
                <button className="button" onClick={() => setShowSettings(false)}>Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
