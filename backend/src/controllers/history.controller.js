const { db } = require("../config/database");
const { analyzeText } = require("../services/ml.service");
function parse(row) {
  return {
    id: row.id,
    originalText: row.original_text,
    correctedText: row.corrected_text,
    corrections: JSON.parse(row.corrections_json || "[]"),
    suggestions: JSON.parse(row.suggestions_json || "[]"),
    createdAt: row.created_at,
  };
}
async function saveHistory(req, res, next) {
  try {
    const { text } = req.body || {};
    if (typeof text !== "string" || !text.trim())
      return res
        .status(400)
        .json({ success: false, message: "Please provide text to save." });
    if (text.length > 5000)
      return res
        .status(400)
        .json({
          success: false,
          message: "Text must be 5,000 characters or fewer.",
        });
    const result = await analyzeText(text);
    const info = db
      .prepare(
        "INSERT INTO writing_history (original_text,corrected_text,corrections_json,suggestions_json) VALUES (?,?,?,?)",
      )
      .run(
        result.originalText,
        result.correctedText,
        JSON.stringify(result.corrections || []),
        JSON.stringify(result.suggestions || []),
      );
    const row = db
      .prepare("SELECT * FROM writing_history WHERE id=?")
      .get(info.lastInsertRowid);
    return res
      .status(201)
      .json({ success: true, message: "Writing saved.", record: parse(row) });
  } catch (e) {
    return next(e);
  }
}
function getHistory(req, res, next) {
  try {
    const n = Number.parseInt(req.query.limit, 10) || 20;
    const rows = db
      .prepare(
        "SELECT * FROM writing_history ORDER BY created_at DESC,id DESC LIMIT ?",
      )
      .all(Math.min(Math.max(n, 1), 100));
    return res.json({
      success: true,
      count: rows.length,
      records: rows.map(parse),
    });
  } catch (e) {
    return next(e);
  }
}
function getById(req, res, next) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1)
      return res
        .status(400)
        .json({ success: false, message: "Invalid history ID." });
    const row = db.prepare("SELECT * FROM writing_history WHERE id=?").get(id);
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "History record not found." });
    return res.json({ success: true, record: parse(row) });
  } catch (e) {
    return next(e);
  }
}
function deleteHistory(req, res, next) {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1)
      return res
        .status(400)
        .json({ success: false, message: "Invalid history ID." });
    const r = db.prepare("DELETE FROM writing_history WHERE id=?").run(id);
    if (!r.changes)
      return res
        .status(404)
        .json({ success: false, message: "History record not found." });
    return res.json({ success: true, message: "History record deleted." });
  } catch (e) {
    return next(e);
  }
}
module.exports = { saveHistory, getHistory, getById, deleteHistory };
