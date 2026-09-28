/* Namma Bharat Vault – script.js
 * Pipeline: User Message -> Text Analysis -> Local Rule-Based Risk Engine
 *           -> Risk Score -> Risk Explanation -> Safety Guidance
 * Everything runs locally in the browser. No backend, no API, no AI.
 */

// ---------- 1. RULES: each rule has a weight (risk points), reason, advice, Tamil advice ----------
const LANGUAGE_KEY = "nbv-preferred-language";
const UI_TEXT = window.NBV_TRANSLATIONS.ui;
const RULE_COPY = window.NBV_TRANSLATIONS.rules;

const RULES = [
  { id:"otp",    weight:30, test:/\botp\b|one[\s-]?time\s*password/i,
    reason:"Asks for or mentions an OTP – scammers use OTPs to take money.",
    advice:"Never share your OTP with anyone, even bank staff.",
    tamil:"OTP-ஐ யாரிடமும் பகிராதீர்கள். வங்கி ஊழியர்கள் கூட கேட்க மாட்டார்கள்." },
  { id:"upipin", weight:30, test:/upi\s*pin/i,
    reason:"Mentions UPI PIN – a PIN is only for YOU to send money.",
    advice:"Never tell your UPI PIN to anyone. You never need it to receive money.",
    tamil:"UPI PIN-ஐ யாரிடமும் சொல்லாதீர்கள். பணம் பெற PIN தேவையில்லை." },
  { id:"pin",    weight:20, test:/\bpin\b/i, skipIf:"upipin",
    reason:"Mentions a PIN.", advice:"Keep all PINs secret.",
    tamil:"உங்கள் PIN எண்ணை ரகசியமாக வைத்திருங்கள்." },
  { id:"url",    weight:25, test:/https?:\/\/|www\.|\b[a-z0-9-]+\.(xyz|top|tk|ml|cf|ga|click|info|club)\b|bit\.ly|tinyurl/i,
    reason:"Contains a web link (URL), which may lead to a fake website.",
    advice:"Do not click links in unknown messages. Open your bank's official app instead.",
    tamil:"சந்தேகமான இணைப்புகளை (link) கிளிக் செய்யாதீர்கள்." },
  { id:"clicklink", weight:10, test:/click\s*(the\s*)?(link|here|below)|tap\s*(the\s*)?link/i,
    reason:"Tells you to click a link.", advice:"Ignore instructions to click links.",
    tamil:"இணைப்பை கிளிக் செய்யச் சொன்னால் புறக்கணிக்கவும்." },
  { id:"kyc",    weight:15, test:/\bkyc\b|update\s*(your\s*)?(pan|aadhaar|aadhar)/i,
    reason:"Mentions KYC/document update – a common scam excuse.",
    advice:"Verify KYC only at your bank branch or the official bank app.",
    tamil:"KYC-ஐ வங்கிக் கிளை அல்லது அதிகாரப்பூர்வ செயலியில் மட்டுமே சரிபார்க்கவும்." },
  { id:"blocked", weight:15, test:/(account|card|sim).{0,30}(blocked|suspended|closed|deactivated|frozen)|will be (blocked|suspended)/i,
    reason:"Threatens that your account will be blocked or suspended.",
    advice:"Call your bank using the number on your passbook or card to check.",
    tamil:"கணக்கு முடக்கப்படும் என்ற மிரட்டலை நம்பாதீர்கள்; வங்கியை நேரில் தொடர்பு கொள்ளுங்கள்." },
  { id:"urgent", weight:12, test:/\burgent(ly)?\b|immediately|right now|within\s*\d+\s*(hours?|hrs?|minutes?|mins?)|last chance|today only/i,
    reason:"Uses urgent or threatening language to make you panic.",
    advice:"Stop and think. Real banks do not rush you.",
    tamil:"அவசரப்படுத்தும் செய்திகளை நம்பாதீர்கள். நிதானமாக யோசியுங்கள்." },
  { id:"verify", weight:10, test:/verify\s*(now|immediately|your)|confirm\s*(now|your)/i,
    reason:"Asks you to 'verify' or 'confirm' details.", advice:"Do not give details through SMS or calls.",
    tamil:"SMS அல்லது அழைப்பில் விவரங்களைத் தராதீர்கள்." },
  { id:"prize",  weight:15, test:/\b(prize|reward|lottery|winner|won|cashback|gift)\b/i,
    reason:"Promises a prize, reward or free gift.", advice:"If it sounds too good to be true, it is a scam.",
    tamil:"பரிசு அல்லது லாட்டரி செய்திகள் பெரும்பாலும் மோசடி." },
  { id:"loan",   weight:15, test:/loan\s*(is\s*)?(approved|approval|offer)|pre-?approved/i,
    reason:"Offers a loan approval you did not ask for.", advice:"Genuine loans never ask for fees before approval.",
    tamil:"நீங்கள் கேட்காத கடன் ஒப்புதல் செய்திகளை நம்பாதீர்கள்." },
  { id:"money",  weight:20, test:/send\s*(us\s*)?(money|rs\.?|₹)|transfer\s*(money|rs\.?|₹)|pay\s*(a\s*)?(fee|charge)|processing\s*fee/i,
    reason:"Asks you to send money or pay a fee.", advice:"Do not send money because of a message.",
    tamil:"செய்தியைப் பார்த்து பணம் அனுப்பாதீர்கள்." },
  { id:"payment", weight:15, test:/payment\s*(is\s*)?(required|pending|due)|pay\s*now/i,
    reason:"Says a payment is required.", advice:"Check any payment demand with the official source.",
    tamil:"பணம் கேட்கும் செய்திகளை அதிகாரப்பூர்வ மூலத்தில் சரிபார்க்கவும்." }
];

// ---------- 2. RISK ENGINE ----------
function analyzeMessage(text) {
  const found = [];   // rules that matched
  let score = 0;
  for (const rule of RULES) {
    if (rule.skipIf && found.some(f => f.id === rule.skipIf)) continue; // avoid double counting
    if (rule.test.test(text)) { found.push(rule); score += rule.weight; }
  }
  score = Math.min(score, 100);
  // Levels: 0-24 LOW, 25-59 MEDIUM, 60-100 HIGH
  const level = score >= 60 ? "HIGH" : score >= 25 ? "MEDIUM" : "LOW";
  return { score, level, found };
}

// ---------- 3. SHOW RESULT ----------
const $ = id => document.getElementById(id);
const LEVEL_KEYS = { HIGH:"highText", MEDIUM:"mediumText", LOW:"lowText" };
const LEVEL_LABEL_KEYS = { HIGH:"highLevel", MEDIUM:"mediumLevel", LOW:"lowLevel" };

function fillList(el, items) {
  el.innerHTML = "";
  items.forEach(t => { const li = document.createElement("li"); li.textContent = t; el.appendChild(li); });
}

function showResult({score, level, found}, scroll = true) {
  lastAnalysis = {score, level, found};
  const box = $("result");
  box.className = "result " + level;           // colour comes from this class
  $("scoreNum").textContent = score;
  $("levelBadge").textContent = t(LEVEL_LABEL_KEYS[level]);
  $("levelText").textContent = t(LEVEL_KEYS[level]);
  $("meterFill").style.width = "0%";
  setTimeout(() => $("meterFill").style.width = score + "%", 50); // animate bar

  const translated = RULE_COPY[currentLanguage] || {};
  fillList($("reasonList"), found.length ? found.map(rule => translated[rule.id]?.[0] || rule.reason) : [t("noSigns")]);
  const advice = found.length ? found.map(rule => translated[rule.id]?.[1] || (currentLanguage === "ta" ? rule.tamil : rule.advice)) : [t("safeAdvice")];
  if (level !== "LOW") advice.push(t("helplineReminder"));
  fillList($("adviceList"), advice);
  $("guidanceTitle").textContent = t("guidanceTitle");
  const tamilAdvice = found.length ? found.map(rule => rule.tamil) : ["OTP மற்றும் PIN-ஐ யாரிடமும் பகிராதீர்கள்."];
  fillList($("tamilList"), tamilAdvice);
  $("tamilList").closest(".tamil-box").hidden = currentLanguage === "ta";
  if (scroll) box.scrollIntoView({behavior:"smooth", block:"start"});
}

// ---------- 4. BUTTONS & PAGE NAVIGATION ----------
function goTo(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p.id === page));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.page === page));
  window.scrollTo(0, 0);
}
document.querySelectorAll("[data-page]").forEach(b => b.addEventListener("click", () => goTo(b.dataset.page)));

// ---------- 5. LOCAL PROTOTYPE LOGIN ----------
const AUTH_KEY = "nbv-demo-authenticated";
const VOICE_COPY = window.NBV_VOICE;
const SPEECH_LOCALE = VOICE_COPY.locale;
const loginScreen = $("loginScreen");
const appShell = $("appShell");
const loginForm = $("loginForm");
const mobileInput = $("mobileInput");
const pinInput = $("pinInput");
const loginLanguage = $("loginLanguage");
const appLanguageSelect = $("appLanguageSelect");
let currentLanguage = "en";
let lastAnalysis = null;
let voiceRecognition = null;
let voiceListening = false;
let lastVoiceResponse = "";
let recognitionFailed = false;
let lastResponseLanguage = "en";
let assistantRequestId = 0;
let activeAssistantController = null;

try {
  const savedLanguage = localStorage.getItem(LANGUAGE_KEY);
  if (UI_TEXT[savedLanguage]) currentLanguage = savedLanguage;
} catch (error) {
  currentLanguage = "en";
}

function t(key) {
  return UI_TEXT[currentLanguage]?.[key] || UI_TEXT.en[key] || key;
}

function voiceText(key, language = currentLanguage) {
  const uiLanguage = VOICE_COPY.ui[language] ? language : language === "tanglish" ? "tanglish" : currentLanguage;
  return VOICE_COPY.ui[uiLanguage]?.[key] || VOICE_COPY.ui.en[key] || key;
}

function getRecognitionConstructor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function applyVoiceLanguage() {
  document.querySelectorAll("[data-voice]").forEach(element => {
    element.textContent = voiceText(element.dataset.voice);
  });
  $("voiceQuestion").placeholder = voiceText("questionPlaceholder");
  $("voiceStart").disabled = !getRecognitionConstructor();
  $("voiceStart").hidden = voiceListening;
  $("voiceStop").hidden = !voiceListening;
  $("voiceStart").setAttribute("aria-label", voiceText("start"));
  $("voiceStop").setAttribute("aria-label", voiceText("stop"));

  const speechOutputAvailable = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  $("voiceSpeak").hidden = !speechOutputAvailable || !lastVoiceResponse;
  $("voiceStatus").textContent = getRecognitionConstructor() ? "" : voiceText("unsupported");
  $("voiceResponse").textContent = lastVoiceResponse || voiceText("initialResponse");
}

function applyLanguage() {
  document.documentElement.lang = currentLanguage;
  document.querySelectorAll("[data-i18n]").forEach(element => {
    const value = t(element.dataset.i18n);
    if (value) element.textContent = value;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(element => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });
  loginLanguage.value = currentLanguage;
  appLanguageSelect.value = currentLanguage;
  appLanguageSelect.setAttribute("aria-label", t("language"));
  $("togglePin").textContent = t(pinInput.type === "password" ? "showPin" : "hidePin");
  applyVoiceLanguage();
  clearLoginErrors();
  if (lastAnalysis && !$("result").classList.contains("hidden")) showResult(lastAnalysis, false);
}

function setLanguage(language) {
  if (!UI_TEXT[language]) return;
  assistantRequestId += 1;
  activeAssistantController?.abort();
  activeAssistantController = null;
  if (voiceRecognition && voiceListening) voiceRecognition.abort();
  voiceListening = false;
  voiceRecognition = null;
  lastVoiceResponse = "";
  $("voiceTranscript").textContent = "";
  currentLanguage = language;
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    // Keep the selection for this visit if local storage is unavailable.
  }
  applyLanguage();
}

function normalizeVoiceText(value) {
  return value.toLocaleLowerCase().normalize("NFKC").replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function detectQuestionLanguage(question) {
  if (/[\u0B80-\u0BFF]/u.test(question)) return "ta";
  if (/[\u0C00-\u0C7F]/u.test(question)) return "te";
  if (/[\u0900-\u097F]/u.test(question)) return "hi";
  if (/[\u0D00-\u0D7F]/u.test(question)) return "ml";
  if (/\b(?:ah|pannalama|sollalama|sollanum|kitayum|yaar|poiduchu|enna|panradhu|indha|intha)\b/i.test(question)) return "tanglish";
  if (/[a-z]/i.test(question)) return "en";
  return currentLanguage;
}

function findVoiceIntent(question, language = detectQuestionLanguage(question)) {
  const normalized = normalizeVoiceText(question);
  const currentScanPatterns = Object.values(VOICE_COPY.intents).flatMap(intents => intents.currentScan || []);
  if (currentScanPatterns.some(pattern => pattern.test(normalized))) return "currentScan";
  const intents = VOICE_COPY.intents[language] || VOICE_COPY.intents[currentLanguage] || VOICE_COPY.intents.en;
  const priority = ["currentScan", "lostMoney", "upiPinWhat", "upiPin", "otp", "scanner", "safetyGuide", "home"];
  return priority.find(intent => intents[intent]?.some(pattern => pattern.test(normalized))) || null;
}

function renderVoiceResponse(template, values = {}) {
  return template.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? "");
}

function showVoiceResponse(response, language = currentLanguage) {
  lastVoiceResponse = response;
  lastResponseLanguage = language;
  $("voiceResponse").textContent = response;
  $("voiceSpeak").hidden = !("speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
}

function captureCurrentScan() {
  if (!lastAnalysis || $("result").classList.contains("hidden")) return null;
  return {
    scan: {
      score: lastAnalysis.score,
      level: lastAnalysis.level,
      reasons: [...$("reasonList").querySelectorAll("li")].map(item => item.textContent)
    },
    foundRules: lastAnalysis.found
  };
}

function buildCurrentScanAnswer(context, language) {
  const answerSet = VOICE_COPY.answers[language] || VOICE_COPY.answers[currentLanguage] || VOICE_COPY.answers.en;
  const copyLanguage = language === "tanglish" ? "ta" : language;
  const ruleTranslations = RULE_COPY[copyLanguage] || {};
  const reasonText = context.foundRules
    .map(rule => (ruleTranslations[rule.id]?.[0] || rule.reason).replace(/[.!?]+$/, ""))
    .join("; ");
  const level = VOICE_COPY.levelAdjective?.[language]?.[context.scan.level] || context.scan.level;
  const isClear = context.foundRules.length === 0;
  const template = isClear ? answerSet.currentClear : answerSet.current;
  return renderVoiceResponse(template, {
    level,
    score: context.scan.score,
    reasons: reasonText,
    safety: answerSet.currentSafety
  });
}

function buildLocalVoiceAnswer(question) {
  const language = detectQuestionLanguage(question);
  const intent = findVoiceIntent(question, language);
  const answers = VOICE_COPY.answers[language] || VOICE_COPY.answers[currentLanguage] || VOICE_COPY.answers.en;
  const responseSet = VOICE_COPY.response[language] || VOICE_COPY.answers[language] || VOICE_COPY.response[currentLanguage] || VOICE_COPY.response.en;
  const scanContext = intent === "currentScan" ? captureCurrentScan() : null;
  let answer;

  if (intent === "currentScan") {
    answer = scanContext ? buildCurrentScanAnswer(scanContext, language) : answers.noCurrent;
  } else if (intent) {
    answer = answers[intent] || responseSet[intent] || responseSet.unknown;
    if (intent === "home") goTo("home");
    if (intent === "scanner") goTo("scanner");
    if (intent === "safetyGuide") goTo("guide");
  } else {
    answer = responseSet.unknown;
  }

  return {answer, intent, language, scanContext};
}

function getAiStatus(key, language) {
  const statusLanguage = VOICE_COPY.aiStatus[language] ? language : language === "tanglish" ? "tanglish" : "en";
  return VOICE_COPY.aiStatus[statusLanguage][key];
}

async function fetchAiAnswer(question, language, currentScan, signal) {
  const response = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({question, language, currentScan}),
    signal
  });
  if (!response.ok) throw new Error("AI assistant unavailable");
  const result = await response.json();
  if (typeof result.answer !== "string" || !result.answer.trim()) throw new Error("Empty AI response");
  const supportedLanguages = ["en", "ta", "te", "hi", "ml", "tanglish"];
  return {
    answer: result.answer.trim(),
    language: supportedLanguages.includes(result.language) ? result.language : language
  };
}

async function answerVoiceQuestion(question, {speak = false} = {}) {
  const cleanedQuestion = question.trim();
  if (!cleanedQuestion) return;

  assistantRequestId += 1;
  const requestId = assistantRequestId;
  activeAssistantController?.abort();
  const local = buildLocalVoiceAnswer(cleanedQuestion);
  showVoiceResponse(local.answer, local.language);
  $("voiceTranscript").textContent = voiceText("youSaid", local.language) + " " + cleanedQuestion;

  if (!navigator.onLine) {
    $("voiceStatus").textContent = getAiStatus("unavailable", local.language);
    if (speak) speakVoiceResponse(local.language);
    return;
  }

  const controller = new AbortController();
  activeAssistantController = controller;
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  $("voiceStatus").textContent = getAiStatus("thinking", local.language);

  try {
    const result = await fetchAiAnswer(
      cleanedQuestion,
      local.language,
      local.scanContext?.scan || null,
      controller.signal
    );
    if (requestId !== assistantRequestId) return;

    let answer = result.answer;
    if (local.scanContext) {
      const trustedScanSummary = buildCurrentScanAnswer(local.scanContext, result.language);
      answer = `${trustedScanSummary} ${answer}`;
    }
    showVoiceResponse(answer, result.language);
    $("voiceTranscript").textContent = voiceText("youSaid", result.language) + " " + cleanedQuestion;
    $("voiceStatus").textContent = getAiStatus("answering", result.language);
    if (speak) speakVoiceResponse(result.language);
  } catch (error) {
    if (requestId === assistantRequestId) {
      showVoiceResponse(local.answer, local.language);
      $("voiceStatus").textContent = getAiStatus("unavailable", local.language);
      if (speak) speakVoiceResponse(local.language);
    }
  } finally {
    window.clearTimeout(timeout);
    if (activeAssistantController === controller) activeAssistantController = null;
  }
}

function startVoiceListening() {
  const Recognition = getRecognitionConstructor();
  if (!Recognition) {
    $("voiceStatus").textContent = voiceText("unsupported");
    return;
  }

  try {
    const recognition = new Recognition();
    voiceRecognition = recognition;
    recognition.lang = SPEECH_LOCALE[currentLanguage] || "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionFailed = false;

    recognition.onstart = () => {
      voiceListening = true;
      $("voiceStart").hidden = true;
      $("voiceStop").hidden = false;
      $("voiceStatus").textContent = voiceText("listening");
    };
    recognition.onresult = event => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      $("voiceQuestion").value = transcript;
      void answerVoiceQuestion(transcript, {speak:true});
    };
    recognition.onerror = event => {
      recognitionFailed = true;
      $("voiceStatus").textContent = event.error === "no-speech" ? voiceText("noSpeech") : voiceText("recognitionError");
    };
    recognition.onend = () => {
      voiceListening = false;
      $("voiceStart").hidden = false;
      $("voiceStop").hidden = true;
      if (!recognitionFailed && $("voiceStatus").textContent === voiceText("listening")) $("voiceStatus").textContent = voiceText("stopped");
    };
    recognition.start();
  } catch (error) {
    voiceListening = false;
    $("voiceStart").hidden = false;
    $("voiceStop").hidden = true;
    $("voiceStatus").textContent = voiceText("recognitionError");
  }
}

function speakVoiceResponse(language = lastResponseLanguage) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window) || !lastVoiceResponse) return;
  try {
    const voices = window.speechSynthesis.getVoices();
    const locale = SPEECH_LOCALE[language] || SPEECH_LOCALE[currentLanguage] || "en-IN";
    const languageCode = locale.split("-")[0].toLowerCase();
    const matchingVoice = voices.find(voice => voice.lang.toLowerCase() === locale.toLowerCase())
      || voices.find(voice => voice.lang.toLowerCase().split("-")[0] === languageCode);

    if (!matchingVoice) {
      $("voiceStatus").textContent = VOICE_COPY.outputStatus[language] || VOICE_COPY.outputStatus.en;
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(lastVoiceResponse);
    utterance.lang = locale;
    utterance.voice = matchingVoice;
    window.speechSynthesis.speak(utterance);
    $("voiceStatus").textContent = "";
  } catch (error) {
    $("voiceStatus").textContent = voiceText("speechUnavailable", language);
  }
}

$("voiceStart").addEventListener("click", startVoiceListening);
$("voiceStop").addEventListener("click", () => {
  if (voiceRecognition && voiceListening) voiceRecognition.stop();
});
$("voiceAsk").addEventListener("click", () => { void answerVoiceQuestion($("voiceQuestion").value); });
$("voiceQuestion").addEventListener("keydown", event => {
  if (event.key === "Enter") void answerVoiceQuestion($("voiceQuestion").value);
});
$("voiceSpeak").addEventListener("click", speakVoiceResponse);

applyLanguage();
loginLanguage.addEventListener("change", () => setLanguage(loginLanguage.value));
appLanguageSelect.addEventListener("change", () => setLanguage(appLanguageSelect.value));

function clearLoginErrors() {
  $("mobileError").textContent = "";
  $("pinError").textContent = "";
  $("loginMessage").textContent = "";
  mobileInput.removeAttribute("aria-invalid");
  pinInput.removeAttribute("aria-invalid");
}

function showApp() {
  loginScreen.hidden = true;
  appShell.hidden = false;
  goTo("home");
}

loginForm.addEventListener("submit", event => {
  event.preventDefault();
  clearLoginErrors();

  const mobileValid = /^[6-9]\d{9}$/.test(mobileInput.value.trim());
  const pinValid = /^\d{4}$/.test(pinInput.value);

  if (!mobileValid) {
    $("mobileError").textContent = t("mobileError");
    mobileInput.setAttribute("aria-invalid", "true");
  }
  if (!pinValid) {
    $("pinError").textContent = t("pinError");
    pinInput.setAttribute("aria-invalid", "true");
  }
  if (!mobileValid || !pinValid) {
    $("loginMessage").textContent = t("correctFields");
    return;
  }

  try {
    localStorage.setItem(AUTH_KEY, "true");
  } catch (error) {
    $("loginMessage").textContent = t("storageError");
    return;
  }

  mobileInput.value = "";
  pinInput.value = "";
  showApp();
});

mobileInput.addEventListener("input", clearLoginErrors);
pinInput.addEventListener("input", clearLoginErrors);

$("togglePin").addEventListener("click", event => {
  const button = event.currentTarget;
  const showPin = pinInput.type === "password";
  pinInput.type = showPin ? "text" : "password";
  button.textContent = t(showPin ? "hidePin" : "showPin");
  button.setAttribute("aria-pressed", String(showPin));
});

$("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem(AUTH_KEY);
  loginForm.reset();
  pinInput.type = "password";
  $("togglePin").textContent = "Show";
  $("togglePin").setAttribute("aria-pressed", "false");
  clearLoginErrors();
  loginScreen.hidden = false;
  appShell.hidden = true;
});

if (localStorage.getItem(AUTH_KEY) === "true") showApp();

// ---------- 6. OPTIONAL PWA INSTALL PROMPT ----------
let installPrompt = null;
const installButton = $("installBtn");

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
  if (!installPrompt) return;
  const promptEvent = installPrompt;
  installPrompt = null;
  installButton.hidden = true;
  await promptEvent.prompt();
  await promptEvent.userChoice;
});

window.addEventListener("appinstalled", () => {
  installPrompt = null;
  installButton.hidden = true;
});

$("scanBtn").addEventListener("click", () => {
  const text = $("msgInput").value.trim();
  if (!text) { $("scannerMessage").textContent = t("pasteFirst"); return; }
  $("scannerMessage").textContent = "";
  showResult(analyzeMessage(text));
});
$("clearBtn").addEventListener("click", () => { $("msgInput").value = ""; $("scannerMessage").textContent = ""; $("result").classList.add("hidden"); lastAnalysis = null; });
$("msgInput").addEventListener("input", () => { $("scannerMessage").textContent = ""; });
$("sampleBtn").addEventListener("click", () => {
  $("scannerMessage").textContent = "";
  $("msgInput").value = "URGENT: Your SBI account will be blocked today! Complete KYC immediately. Click http://sbi-kyc-verify.xyz and share the OTP sent to your phone.";
});
$("safeBtn").addEventListener("click", () => {
  $("scannerMessage").textContent = "";
  $("msgInput").value = "Your electricity bill of Rs 450 has been paid successfully. Thank you.";
});

// ---------- 7. SERVICE WORKER (works on http://localhost or https, not file://) ----------
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("service-worker.js").catch(err => console.log("SW failed:", err));
}
