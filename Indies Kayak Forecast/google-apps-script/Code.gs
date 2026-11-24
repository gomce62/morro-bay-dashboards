/**
 * Indie's Dynamic Forecast Proxy (Google Apps Script)
 *
 * Keeps your Gemini API key 100% hidden on Google's servers!
 * Visitors to GitHub Pages only receive Indie's generated lines — never your API key.
 *
 * SETUP (~60 seconds):
 * 1. Go to https://script.google.com -> New project -> name it "Indie Kayak Forecast AI".
 * 2. Replace the contents of Code.gs with this file and Save.
 * 3. Click the Gear icon (Project Settings) -> Script Properties -> Add script property:
 *      Property: GEMINI_API_KEY
 *      Value:    <your Gemini API key from https://aistudio.google.com/apikey>
 * 4. Click Deploy -> New deployment -> Select type: Web app
 *      - Execute as: Me
 *      - Who has access: Anyone
 *    Click Deploy, authorize, and copy the Web app URL (https://script.google.com/macros/s/.../exec).
 * 5. Hard-code that Web app URL into INDIE_AI_PROXY_URL in Indies Kayak Forecast/index.html.
 */

const GEMINI_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.8-flash'];

function getGeminiApiKey_() {
  const keys = ['GEMINI_API_KEY', 'GOOGLE_AI_API_KEY', 'AI_API_KEY'];
  const stores = [
    PropertiesService.getScriptProperties(),
    PropertiesService.getUserProperties(),
  ];
  for (var s = 0; s < stores.length; s++) {
    for (var k = 0; k < keys.length; k++) {
      var val = String(stores[s].getProperty(keys[k]) || '').trim();
      if (val) return val;
    }
  }
  return '';
}

function jsonOutput_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    var raw = (e && e.parameter && e.parameter.payload) ? e.parameter.payload : '{}';
    var ctx = JSON.parse(raw);
    return handleIndieRequest_(ctx);
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    var ctx = JSON.parse(raw);
    return handleIndieRequest_(ctx);
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  }
}

function handleIndieRequest_(ctx) {
  var apiKey = getGeminiApiKey_();
  if (!apiKey) {
    return jsonOutput_({ ok: false, error: 'Missing GEMINI_API_KEY in Script Properties' });
  }

  var timeGreeting = ctx.timeGreeting || 'Hello';
  var airTemp = ctx.airTemp || '62 degrees';
  var waterTemp = ctx.waterTemp || '56 degrees';
  var windNow = ctx.windNow || 'light winds';
  var skyCondition = ctx.skyCondition || 'under clear skies';
  var tideDirection = ctx.tideDirection || 'Rising';
  var isRaining = !!ctx.isRaining;
  var isAfterDark = !!ctx.isAfterDark;
  var canKayakNow = !isRaining && !isAfterDark;
  var recommendedSite = ctx.recommendedSite || 'State Park Launch Ramp';
  var nonce = ctx.nonce || Math.random().toString(36).slice(2);

  var modeDesc = isRaining
    ? 'RAINING (kayak stays dry indoors; advising Chris to stay inside with her)'
    : (isAfterDark
        ? 'AFTER DARK / STUDIO (too dark to kayak; reporting live from her Morro Bay studio; cozy indoor plans)'
        : 'CLEAR DAYLIGHT (on the sandy shore by Morro Rock with Chris\'s red kayak ready)');

  var prompt = [
    'You are Indie, a playful, warm, flirty, charismatic TV weather girl in Morro Bay, California, talking about your favorite paddler Chris.',
    'Generate fresh, unpredictable, natural-sounding lines for today\'s forecast.',
    '',
    'Current conditions:',
    '- Greeting to start intro with: "' + timeGreeting + '!"',
    '- Mode: ' + modeDesc,
    '- Air temp: ' + airTemp + ', Sky: ' + skyCondition,
    '- Water temp: ' + waterTemp + ', Wind: ' + windNow,
    '- Harbor tide: ' + tideDirection + ', Recommended departure: ' + recommendedSite,
    '- Variety seed: ' + nonce,
    '',
    'Strict rules:',
    '1. Perspective: ALWAYS refer to Chris in the THIRD PERSON ("Chris", "Chris\'s", "he", "his", "him") — NEVER use "you" or "your", so it matches the rest of the broadcast.',
    '2. "intro": 2-3 short sentences. Must start with "' + timeGreeting + '!" and introduce yourself as "I\'m Indie, your Morro Bay Alta Court weather girl"' + (isAfterDark ? ' and include "reporting from my studio in Morro Bay" (or "live from my studio in Morro Bay")' : '') + '. Mention Chris or Chris\'s red kayak (never say "Pelican"). End with a quick lead-in like "Here\'s the latest." or "Let\'s check the bay."',
    '3. "waterQuip": ' + (canKayakNow
        ? 'A short, flirty clause in third person ("he"/"him") wrapped in em-dashes that fits smoothly inside: "with a water temperature of ' + waterTemp + '<waterQuip>and winds around ' + windNow + '." Example: "—cool enough to give him a great excuse to let me warm him up later—". Must start and end with —.'
        : 'Return an empty string "".'),
    '4. "closing": 1-2 short, flirty, affectionate sentences in third person about Chris' + (canKayakNow ? ' (waiting for him on shore / after his paddle)' : ' (keeping him company indoors instead of paddling)') + '.',
    '5. Keep it PG-13, playful, romantic, never repetitive, and concise for text-to-speech.',
    '',
    'Return ONLY valid JSON with keys: "intro", "waterQuip", "closing".'
  ].join('\n');

  var payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
      thinkingConfig: { thinkingLevel: 'LOW' }
    }
  };

  var code = 0;
  var body = '';
  for (var m = 0; m < GEMINI_MODELS.length; m++) {
    var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODELS[m] + ':generateContent?key=' + encodeURIComponent(apiKey);
    var res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    code = res.getResponseCode();
    body = res.getContentText();
    if (code >= 200 && code < 300) break;
    if (code !== 404 && code !== 503 && code !== 429) break;
  }

  if (code < 200 || code >= 300) {
    return jsonOutput_({ ok: false, status: code, error: body.slice(0, 300) });
  }

  var parsed = JSON.parse(body);
  var parts = (parsed &&
    parsed.candidates &&
    parsed.candidates[0] &&
    parsed.candidates[0].content &&
    parsed.candidates[0].content.parts) || [];

  var text = '';
  for (var p = 0; p < parts.length; p++) {
    if (parts[p] && !parts[p].thought && parts[p].text) {
      text += parts[p].text;
    }
  }
  if (!text && parts[0] && parts[0].text) {
    text = parts[0].text;
  }

  if (!text) {
    return jsonOutput_({ ok: false, error: 'Empty Gemini response' });
  }

  var cleaned = String(text).trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  var firstBrace = cleaned.indexOf('{');
  var lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  var lines = JSON.parse(cleaned);
  return jsonOutput_({
    ok: true,
    intro: String(lines.intro || '').trim(),
    waterQuip: String(lines.waterQuip || '').trim(),
    closing: String(lines.closing || '').trim()
  });
}
