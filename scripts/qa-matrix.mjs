/**
 * Scripted QA matrix (Phase 5): 6 languages × 5 fan journeys + adversarial
 * probes, run against a local server WITHOUT an API key (degraded mode) —
 * proving the demo floor. With GEMINI_API_KEY set, the same script exercises
 * the live model path (results then need human language review).
 *
 * Usage: node scripts/qa-matrix.mjs [baseUrl]
 */

const BASE = process.argv[2] ?? "http://localhost:3000";

const CASES = [
  // [label, message, expects]
  ["EN seat", "Take me to seat 214 from gate B", { route: true, snippet: "route" }],
  ["EN halal", "Where is the nearest halal food?", { route: true, snippet: "Halal Grill" }],
  ["EN wheelchair", "I use a wheelchair, route to my seat 105", { route: true, noStairs: true }],
  ["EN exit-crowd", "Which exit is least crowded?", { snippet: "quietest" }],
  ["EN transport", "How do I get to the airport?", { snippet: "Airport Express" }],
  ["ES seat", "¿Cómo llego a mi asiento 214?", { route: true, snippet: "ruta" }],
  ["ES restroom", "¿Dónde está el baño más cercano?", { route: true, snippet: "más cercano" }],
  ["ES veg", "Comida vegetariana cerca", { route: true, snippet: "Green Garden" }],
  ["ES crowd", "¿Qué salida está menos llena?", { snippet: "gente" }],
  ["ES transport", "¿Cómo vuelvo a la ciudad?", { snippet: "estadio" }],
  ["FR seat", "Emmène-moi au siège 214", { route: true, snippet: "itinéraire" }],
  ["FR restroom", "Où sont les toilettes ?", { route: true, snippet: "proche" }],
  ["FR halal", "Nourriture halal proche", { route: true, snippet: "Halal Grill" }],
  ["FR crowd", "Quelle sortie est la moins bondée ?", { snippet: "Affluence" }],
  ["FR transport", "Comment rentrer en ville ?", { snippet: "stade" }],
  ["AR seat", "خذني إلى المقعد 214", { route: true, snippet: "مسار" }],
  ["AR restroom", "أين أقرب حمام؟", { route: true, snippet: "أقرب" }],
  ["AR halal", "أين أقرب طعام حلال؟", { route: true, snippet: "Halal Grill" }],
  ["AR crowd", "أي مخرج أقل ازدحاما؟", { snippet: "الازدحام" }],
  ["AR transport", "كيف أعود إلى المدينة؟", { snippet: "الملعب" }],
  ["PT seat", "Leve-me ao assento 214", { route: true, snippet: "rota" }],
  ["PT restroom", "Onde fica o banheiro mais próximo?", { route: true, snippet: "próximo" }],
  ["PT veg", "Comida vegetariana perto", { route: true, snippet: "Green Garden" }],
  ["PT crowd", "Qual saída está menos lotada?", { snippet: "público" }],
  ["PT transport", "Como volto para a cidade?", { snippet: "estádio" }],
  ["HI seat", "मुझे सीट 214 तक ले चलो", { route: true, snippet: "रास्ता" }],
  ["HI restroom", "सबसे नज़दीकी शौचालय कहाँ है?", { route: true, snippet: "नज़दीकी" }],
  ["HI halal", "हलाल खाना कहाँ मिलेगा?", { route: true, snippet: "Halal Grill" }],
  ["HI crowd", "कौन सा निकास कम भीड़ वाला है?", { snippet: "भीड़" }],
  ["HI transport", "मैं शहर वापस कैसे जाऊँ?", { snippet: "विकल्प" }],
  // Adversarial
  ["ADV out-of-venue", "What is the capital of Australia?", { snippet: "Information Desk" }],
  ["ADV gibberish", "asdf qwer zxcv!!", { snippet: "Information Desk" }],
  ["ADV mixed-lang", "Where is मेरा seat 214?", { route: true }],
  ["ADV long-input", "please help me ".repeat(200), { minLen: 10 }],
  ["ADV empty-ish", "?", { minLen: 10 }],
];

async function probe(message) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", text: message }] }),
  });
  const raw = await res.text();
  const events = raw
    .split("\n\n")
    .filter((l) => l.startsWith("data: "))
    .map((l) => JSON.parse(l.slice(6)));
  const text = events.filter((e) => e.type === "text").map((e) => e.text).join("");
  const route = events.find((e) => e.type === "route")?.route;
  return { status: res.status, text, route, events };
}

let pass = 0;
let fail = 0;
for (const [label, message, expects] of CASES) {
  try {
    const { status, text, route } = await probe(message);
    const problems = [];
    if (status !== 200) problems.push(`status ${status}`);
    if (expects.route && !route?.found) problems.push("no route event");
    if (expects.noStairs && route && !route.steps.every((s) => s.kind !== "stairs"))
      problems.push("stairs in accessible route");
    if (expects.snippet && !text.includes(expects.snippet))
      problems.push(`missing "${expects.snippet}" in: ${text.slice(0, 80)}…`);
    if (expects.minLen && text.length < expects.minLen) problems.push("reply too short");
    if (problems.length) {
      fail++;
      console.log(`FAIL ${label}: ${problems.join("; ")}`);
    } else {
      pass++;
      console.log(`ok   ${label}`);
    }
  } catch (e) {
    fail++;
    console.log(`FAIL ${label}: ${e.message}`);
  }
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
