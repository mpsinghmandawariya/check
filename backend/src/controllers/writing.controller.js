const { analyzeText } = require("../services/ml.service");
async function analyzeWriting(req, res, next) {
  try {
    const { text } = req.body || {};
    if (typeof text !== "string")
      return res
        .status(400)
        .json({ success: false, message: "Text must be a string." });
    if (text.length > 5000)
      return res
        .status(400)
        .json({
          success: false,
          message: "Text must be 5,000 characters or fewer.",
        });
    return res.json(await analyzeText(text));
  } catch (e) {
    return next(e);
  }
}
module.exports = { analyzeWriting };
