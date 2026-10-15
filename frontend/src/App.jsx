import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  Command,
  Feather,
  FileText,
  History,
  Lightbulb,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  SpellCheck2,
  Trash2,
  WandSparkles,
  X,
  CircleHelp,
} from "lucide-react";
const API = import.meta.env.VITE_API_BASE_URL || "/api";
const starter =
  "Good writing is not about using the biggest words. It is about making your ideas clear, thoughtful, and easy to understand.";
async function api(path, options = {}) {
  const r = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || "Request failed. Please try again.");
  return d;
}

function LiveEditor({ value, onChange, editorRef, api }) {
  const [prediction, setPrediction] = useState("");
  const [corrections, setCorrections] = useState([]);
  const [activeCorrection, setActiveCorrection] = useState(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef(null);
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);
  useEffect(() => () => clearTimeout(timer.current), []);
  function schedule(next) {
    clearTimeout(timer.current);
    setPrediction("");
    timer.current = setTimeout(async () => {
      if (!next.trim()) {
        setCorrections([]);
        return;
      }
      setBusy(true);
      try {
        const result = await api("/writing/analyze", {
          method: "POST",
          body: JSON.stringify({ text: next }),
        });
        if (latest.current !== next) return;
        const items = (result.corrections || []).filter(
          (c) => c.original && c.corrected,
        );
        setCorrections(items.slice(0, 4));
        const suggestions = result.suggestions || [];
        const last = next.match(/[A-Za-z']+$/);
        if (
          suggestions.length &&
          (next.endsWith(" ") || next.endsWith("\\n") || !last)
        ) {
          setPrediction(suggestions[0].word || "");
        } else setPrediction("");
      } catch {
        setCorrections([]);
        setPrediction("");
      } finally {
        setBusy(false);
      }
    }, 350);
  }
  function change(e) {
    const next = e.target.value;
    latest.current = next;
    onChange(next);
    schedule(next);
  }
  function acceptCorrection(item) {
    const escaped = item.original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const next = latest.current.replace(
      new RegExp("\\b" + escaped + "\\b", "i"),
      item.corrected,
    );
    latest.current = next;
    onChange(next);
    setCorrections((p) => p.filter((c) => c !== item));
    setActiveCorrection(null);
    editorRef.current?.focus();
    schedule(next);
  }
  function acceptPrediction() {
    if (!prediction) return;
    const next =
      latest.current +
      (latest.current && !/\s$/.test(latest.current) ? " " : "") +
      prediction +
      " ";
    latest.current = next;
    onChange(next);
    setPrediction("");
    editorRef.current?.focus();
    schedule(next);
  }
  function keyDown(e) {
    if ((e.key === "Tab" || e.key === "Enter") && prediction) {
      e.preventDefault();
      acceptPrediction();
    }
    if (e.key === "Escape") {
      setPrediction("");
      setActiveCorrection(null);
    }
  }
  return (
    <div className="live-editor-wrap">
      <textarea
        ref={editorRef}
        value={value}
        maxLength={5000}
        spellCheck="false"
        onChange={change}
        onKeyDown={keyDown}
        placeholder="Start writing something wonderful..."
        aria-label="Writing editor"
      />
      {prediction && (
        <div className="prediction-line">
          <span className="prediction-label">
            <Sparkles size={12} /> WORDWISE SUGGESTS
          </span>
          <button
            type="button"
            className="prediction-accept"
            onMouseDown={(e) => e.preventDefault()}
            onClick={acceptPrediction}
          >
            {prediction}
            <kbd>Tab ↵</kbd>
          </button>
        </div>
      )}
      {(corrections.length > 0 || busy) && (
        <div className="inline-corrections">
          <span className="inline-correction-title">
            <SpellCheck2 size={13} />{" "}
            {busy ? "Checking as you type" : "Possible corrections"}
          </span>
          {corrections.map((item, i) => (
            <button
              type="button"
              key={item.original + i}
              className="correction-chip"
              title={`Replace ${item.original} with ${item.corrected}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => acceptCorrection(item)}
            >
              <del>{item.original}</del>
              <ArrowRight size={11} />
              <strong>{item.corrected}</strong>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [text, setText] = useState(starter),
    [analysis, setAnalysis] = useState(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [error, setError] = useState(""),
    [history, setHistory] = useState([]),
    [historyOpen, setHistoryOpen] = useState(false),
    [health, setHealth] = useState("checking");
  const editor = useRef(null);
  const words = useMemo(
    () => (text.trim() ? text.trim().split(/\s+/).length : 0),
    [text],
  );
  const chars = text.length;
  useEffect(() => {
    api("/health")
      .then((d) =>
        setHealth(
          d.dependencies?.pythonML === "running" ? "online" : "partial",
        ),
      )
      .catch(() => setHealth("offline"));
    loadHistory();
  }, []);
  async function loadHistory() {
    try {
      setHistory((await api("/history?limit=12")).records || []);
    } catch {}
  }
  async function analyze() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      setAnalysis(
        await api("/writing/analyze", {
          method: "POST",
          body: JSON.stringify({ text }),
        }),
      );
      setNotice("Your writing has been reviewed.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setError("");
    try {
      const d = await api("/history", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      setHistory((p) =>
        [d.record, ...p.filter((x) => x.id !== d.record.id)].slice(0, 12),
      );
      setNotice("Saved to your local writing history.");
    } catch (e) {
      setError(e.message);
    }
  }
  function apply() {
    if (analysis) {
      setText(analysis.correctedText);
      setAnalysis(null);
      setNotice("Suggested corrections applied.");
    }
  }
  function suggest(word) {
    setText((t) => `${t.trimEnd()}${t.trim() ? " " : ""}${word} `);
    setAnalysis(null);
    editor.current?.focus();
  }
  async function remove(id) {
    try {
      await api(`/history/${id}`, { method: "DELETE" });
      setHistory((p) => p.filter((x) => x.id !== id));
      setNotice("History item deleted.");
    } catch (e) {
      setError(e.message);
    }
  }
  function open(item) {
    setText(item.originalText);
    setAnalysis({
      originalText: item.originalText,
      correctedText: item.correctedText,
      corrections: item.corrections || [],
      suggestions: item.suggestions || [],
    });
    setHistoryOpen(false);
  }
  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brandmark">
            <Feather size={19} />
          </span>
          <span>
            wordwise<span className="ai">.ai</span>
          </span>
        </a>
        <div className="topright">
          <span className={`health ${health}`}>
            <i />
            {health === "online"
              ? "AI ready"
              : health === "partial"
                ? "AI reconnecting"
                : health === "offline"
                  ? "Service offline"
                  : "Checking services"}
          </span>
          <button className="historybtn" onClick={() => setHistoryOpen(true)}>
            <History size={16} /> History
          </button>
          <span className="avatar">W</span>
        </div>
      </header>
      <main className="layout">
        <section className="intro">
          <div className="eyebrow">
            <Sparkles size={14} /> YOUR THOUGHTS, POLISHED
          </div>
          <h1>
            Find your flow.
            <br />
            <em>Say it better.</em>
          </h1>
          <p>
            A quieter kind of writing assistant. Clear up the little things,
            find the next word, and keep your ideas moving.
          </p>
          <div className="note">
            <span />
            Made for the way you think.
          </div>
        </section>
        <section className="workspace">
          <div className="editor">
            <div className="editortop">
              <div className="doclabel">
                <FileText size={16} /> Untitled note <small>LOCAL DRAFT</small>
              </div>
              <button
                className="quiet"
                onClick={() => {
                  setText("");
                  setAnalysis(null);
                  setNotice("");
                  setError("");
                  editor.current?.focus();
                }}
              >
                <RotateCcw size={14} /> Clear
              </button>
            </div>
            <LiveEditor
              value={text}
              onChange={(value) => {
                setText(value);
                setAnalysis(null);
                setNotice("");
              }}
              editorRef={editor}
              api={api}
            />
            <div className="stats">
              <span>{words} words</span>
              <b>·</b>
              <span>{chars} characters</span>
              <span className="hint">
                <Command size={12} /> Take your time
              </span>
            </div>
            <div className="actions">
              <button
                className="secondary"
                disabled={!text.trim()}
                onClick={save}
              >
                <FileText size={15} /> Save draft
              </button>
              <span className="live-status">
                <Sparkles size={14} /> Inline AI is active
              </span>
            </div>
          </div>
          <div className="subnote">
            <span>✳ &nbsp; A LITTLE HELP, NOT A LOT OF NOISE</span>
            <span>Suggestions are yours to accept or ignore.</span>
          </div>
          {error && (
            <div className="message error">
              <CircleHelp size={16} />
              {error}
              <button onClick={() => setError("")}>
                <X size={14} />
              </button>
            </div>
          )}
          {notice && !error && (
            <div className="message success">
              <Check size={16} />
              {notice}
              <button onClick={() => setNotice("")}>
                <X size={14} />
              </button>
            </div>
          )}

          <div className="privacy">
            <Clock3 size={15} />
            <span>
              Your drafts are saved in the SQLite database on this server. Avoid
              saving sensitive information in a shared demo.
            </span>
          </div>
        </section>
      </main>
      <footer>
        <span>© 2026 WordWise AI</span>
        <span>
          Write with intention <b>✳</b>
        </span>
        <span>Autocorrect · Word suggestions</span>
      </footer>
      {historyOpen && (
        <div className="overlay" onClick={() => setHistoryOpen(false)}>
          <aside className="panel" onClick={(e) => e.stopPropagation()}>
            <div className="panelhead">
              <div>
                <div className="kicker">YOUR RECENT WORK</div>
                <h2>Writing history</h2>
              </div>
              <button className="close" onClick={() => setHistoryOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <p className="paneldesc">
              Drafts saved on this server appear here.
            </p>
            {history.length === 0 ? (
              <div className="empty">
                <History size={23} />
                <strong>A little room to begin.</strong>
                <p>Save your first draft and it will be waiting here.</p>
              </div>
            ) : (
              <div className="historylist">
                {history.map((item) => (
                  <article className="historyitem" key={item.id}>
                    <button className="historymain" onClick={() => open(item)}>
                      <small>
                        {new Date(
                          item.createdAt.endsWith("Z")
                            ? item.createdAt
                            : item.createdAt + "Z",
                        ).toLocaleString()}
                      </small>
                      <span>{item.originalText}</span>
                      <small>
                        {item.originalText.trim().split(/\s+/).length} words{" "}
                        <ChevronRight size={12} />
                      </small>
                    </button>
                    <button
                      className="delete"
                      aria-label="Delete saved draft"
                      onClick={() => remove(item.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </article>
                ))}
              </div>
            )}
            <div className="panelfoot">
              <span>Saved with SQLite</span>
              <button onClick={loadHistory}>
                Refresh <RotateCcw size={12} />
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
