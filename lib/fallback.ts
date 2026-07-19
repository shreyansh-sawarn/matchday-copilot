/**
 * Degraded mode (D-08): when Gemini is unavailable (no key, quota, timeout),
 * this keyword-intent resolver answers the core fan journeys with canned
 * multilingual text + REAL routing from lib/venue.ts. Same ChatEvent shape as
 * the AI path, so the map and cards work identically. Zero AI required.
 */

import type { ChatEvent, PoiKind } from "@/lib/types";
import { nearestPoi, route, transportOptions } from "@/lib/venue";
import { allCrowd, bestGateAdvice } from "@/lib/simulation";
import { transportSuggestion } from "@/lib/tools";

export type Lang = "en" | "es" | "fr" | "ar" | "pt" | "hi";

/** Cheap script/keyword language detection — good enough for canned replies. */
export function detectLang(text: string): Lang {
  if (/[؀-ۿ]/.test(text)) return "ar";
  if (/[ऀ-ॿ]/.test(text)) return "hi";
  const t = ` ${text.toLowerCase()} `;
  const hit = (words: string[]) => words.some((w) => t.includes(` ${w} `) || t.includes(`${w} `) || t.includes(` ${w}`));
  // Portuguese first: its distinctive words (saída, banheiro…) never appear in
  // Spanish, while shared words like "está"/"como" would otherwise misfire.
  if (hit(["onde", "assento", "banheiro", "portão", "saída", "ajuda", "chego", "volto", "cidade", "estádio", "lotada", "lotado", "próximo"])) return "pt";
  if (hit(["dónde", "donde", "asiento", "baño", "cómo", "como llego", "puerta", "comida", "salida", "ayuda", "está"])) return "es";
  if (hit(["où", "siège", "toilettes", "porte", "nourriture", "sortie", "aide", "comment"])) return "fr";
  return "en";
}

type Intent =
  | { kind: "route"; to: string; accessible: boolean }
  | { kind: "nearest"; poi: PoiKind; tags: string[]; accessible: boolean }
  | { kind: "crowd" }
  | { kind: "transport" }
  | { kind: "help" }
  | { kind: "unknown" };

const SEAT_RE = /(?:seat|section|asiento|sección|siège|assento|सीट|मेरी|مقعد)?\s*#?\s*\b([12][0-9]{2})\b/i;
const GATE_RE = /(?:gate|puerta|porte|portão|गेट|بوابة)\s*([a-d])\b/i;

function wheelchairAsked(t: string): boolean {
  return /wheelchair|accessib|silla de ruedas|fauteuil|cadeira de rodas|व्हीलचेयर|كرسي|step.?free|sin escaleras/i.test(t);
}

/** Map a user message to one of the supported canned intents. */
export function resolveIntent(text: string): Intent {
  const t = text.toLowerCase();
  const accessible = wheelchairAsked(t);

  const seat = t.match(SEAT_RE);
  if (seat && /seat|asiento|siège|assento|सीट|مقعد|section|secc|llego|get to|find/i.test(t))
    return { kind: "route", to: `seat ${seat[1]}`, accessible };

  const gate = t.match(GATE_RE);
  if (gate && /exit|get to|how|salida|llego|sortie|saída|كيف|कैसे|جою/i.test(t))
    return { kind: "route", to: `gate ${gate[1]}`, accessible };

  if (/halal|حلال|हलाल/i.test(t)) return { kind: "nearest", poi: "food", tags: ["halal"], accessible };
  if (/vegetari|vegan|शाकाहारी|نباتي/i.test(t)) return { kind: "nearest", poi: "food", tags: ["vegetarian"], accessible };
  if (/food|eat|hungry|comida|comer|nourriture|manger|खाना|भोजन|طعام|أكل|lanche/i.test(t))
    return { kind: "nearest", poi: "food", tags: [], accessible };
  if (/restroom|toilet|bathroom|baño|toilettes|banheiro|शौचालय|टॉयलेट|حمام|مرحاض|wc/i.test(t))
    return { kind: "nearest", poi: "restroom", tags: accessible ? ["accessible"] : [], accessible };
  if (/prayer|pray|oración|prière|oração|नमाज़|प्रार्थना|صلاة|مصلى/i.test(t))
    return { kind: "nearest", poi: "prayer", tags: [], accessible };
  if (/medic|first aid|doctor|médic|premiers secours|प्राथमिक|طبيب|إسعاف/i.test(t))
    return { kind: "nearest", poi: "medical", tags: [], accessible };
  if (/water|agua|eau|água|पानी|ماء/i.test(t)) return { kind: "nearest", poi: "water", tags: [], accessible };
  // crowd-awareness wins over plain exit routing ("which exit is least crowded?")
  if (/crowd|busy|congest|llen|gente|foule|monde|bond[ée]|lotad|भीड़|زدحام|زحام|مزدحم/i.test(t)) return { kind: "crowd" };
  if (/exit|leave|salida|salir|sortie|saída|sair|निकास|बाहर|خروج|مخرج/i.test(t))
    return { kind: "nearest", poi: "exit", tags: [], accessible };
  if (/metro|train|bus|transport|parking|home|hotel|estación|gare|casa|घर|मेट्रो|بيت|مترو|حافلة|get back|estaciona|city|ciudad|ville|cidade|शहर|مدينة|airport|aeropuerto|aéroport|aeroporto|مطار|एयरपोर्ट|vuelvo|volto|rentrer|أعود|वापस/i.test(t))
    return { kind: "transport" };
  if (/help|hello|hi|hola|bonjour|olá|मदद|नमस्ते|مرحبا|مساعدة|salut|ayuda/i.test(t)) return { kind: "help" };
  return { kind: "unknown" };
}

const M: Record<Lang, Record<string, string>> = {
  en: {
    routeIntro: "Here is your route ({dist} m):",
    nearest: "The nearest {what} is {name} ({dist} m). Route:",
    crowd: "Current crowd levels: {summary}. {advice}",
    transport: "Ways to leave the stadium: {options}. {suggestion}",
    help: "I can help you find your seat, food, restrooms, exits and transport — in your language. Try: “Take me to seat 214”.",
    unknown: "I don't have that information. The Information Desk on the North Concourse (near Gate A) can help with anything else!",
    demoNote: "(Demo mode — AI is offline, but navigation still works.)",
    notFound: "I couldn't find that place. Please check with the Information Desk near Gate A.",
  },
  es: {
    routeIntro: "Aquí está tu ruta ({dist} m):",
    nearest: "El {what} más cercano es {name} ({dist} m). Ruta:",
    crowd: "Niveles de gente ahora: {summary}. {advice}",
    transport: "Opciones para salir del estadio: {options}. {suggestion}",
    help: "Puedo ayudarte a encontrar tu asiento, comida, baños, salidas y transporte — en tu idioma. Prueba: «Llévame al asiento 214».",
    unknown: "No tengo esa información. ¡El mostrador de información en el pasillo norte (junto a la Puerta A) puede ayudarte!",
    demoNote: "(Modo demo — la IA está desconectada, pero la navegación funciona.)",
    notFound: "No encontré ese lugar. Consulta el mostrador de información junto a la Puerta A.",
  },
  fr: {
    routeIntro: "Voici votre itinéraire ({dist} m) :",
    nearest: "Le {what} le plus proche est {name} ({dist} m). Itinéraire :",
    crowd: "Affluence actuelle : {summary}. {advice}",
    transport: "Pour quitter le stade : {options}. {suggestion}",
    help: "Je peux vous aider à trouver votre siège, à manger, les toilettes, les sorties et les transports — dans votre langue. Essayez : « Emmène-moi au siège 214 ».",
    unknown: "Je n'ai pas cette information. Le comptoir d'information du hall nord (près de la Porte A) pourra vous aider !",
    demoNote: "(Mode démo — l'IA est hors ligne, mais la navigation fonctionne.)",
    notFound: "Je n'ai pas trouvé cet endroit. Voyez le comptoir d'information près de la Porte A.",
  },
  ar: {
    routeIntro: "إليك مسارك ({dist} م):",
    nearest: "أقرب {what} هو {name} ({dist} م). المسار:",
    crowd: "مستويات الازدحام الآن: {summary}. {advice}",
    transport: "خيارات مغادرة الملعب: {options}. {suggestion}",
    help: "يمكنني مساعدتك في العثور على مقعدك والطعام ودورات المياه والمخارج والمواصلات — بلغتك. جرّب: «خذني إلى المقعد 214».",
    unknown: "لا أملك هذه المعلومة. مكتب الاستعلامات في الممر الشمالي (قرب البوابة A) يمكنه مساعدتك!",
    demoNote: "(وضع تجريبي — الذكاء الاصطناعي غير متصل، لكن الملاحة تعمل.)",
    notFound: "لم أجد هذا المكان. يرجى مراجعة مكتب الاستعلامات قرب البوابة A.",
  },
  pt: {
    routeIntro: "Aqui está sua rota ({dist} m):",
    nearest: "O {what} mais próximo é {name} ({dist} m). Rota:",
    crowd: "Níveis de público agora: {summary}. {advice}",
    transport: "Opções para sair do estádio: {options}. {suggestion}",
    help: "Posso ajudar você a encontrar seu assento, comida, banheiros, saídas e transporte — no seu idioma. Tente: «Leve-me ao assento 214».",
    unknown: "Não tenho essa informação. O balcão de informações no corredor norte (perto do Portão A) pode ajudar!",
    demoNote: "(Modo demo — a IA está offline, mas a navegação funciona.)",
    notFound: "Não encontrei esse lugar. Procure o balcão de informações perto do Portão A.",
  },
  hi: {
    routeIntro: "यह रहा आपका रास्ता ({dist} मीटर):",
    nearest: "सबसे नज़दीकी {what} है {name} ({dist} मीटर)। रास्ता:",
    crowd: "अभी भीड़ का स्तर: {summary}। {advice}",
    transport: "स्टेडियम से निकलने के विकल्प: {options}। {suggestion}",
    help: "मैं आपकी सीट, खाना, शौचालय, निकास और परिवहन खोजने में मदद कर सकता हूँ — आपकी भाषा में। आज़माएँ: «मुझे सीट 214 तक ले चलो»।",
    unknown: "मेरे पास यह जानकारी नहीं है। गेट A के पास उत्तर गलियारे में सूचना डेस्क आपकी मदद कर सकती है!",
    demoNote: "(डेमो मोड — AI ऑफ़लाइन है, लेकिन नेविगेशन काम करता है।)",
    notFound: "वह जगह नहीं मिली। कृपया गेट A के पास सूचना डेस्क से पूछें।",
  },
};

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

/** Localized names for POI kinds used in canned replies. */
const KIND_NAMES: Record<Lang, Partial<Record<PoiKind, string>>> = {
  en: { food: "food stand", restroom: "restroom", water: "water refill", exit: "exit", medical: "first aid station", prayer: "prayer room", info: "information desk", shop: "shop", gate: "gate" },
  es: { food: "puesto de comida", restroom: "baño", water: "punto de agua", exit: "salida", medical: "puesto de primeros auxilios", prayer: "sala de oración", info: "mostrador de información", shop: "tienda", gate: "puerta" },
  fr: { food: "stand de nourriture", restroom: "toilettes", water: "point d'eau", exit: "sortie", medical: "poste de secours", prayer: "salle de prière", info: "comptoir d'information", shop: "boutique", gate: "porte" },
  ar: { food: "منفذ طعام", restroom: "دورة مياه", water: "نقطة مياه", exit: "مخرج", medical: "نقطة إسعاف", prayer: "مصلى", info: "مكتب استعلامات", shop: "متجر", gate: "بوابة" },
  pt: { food: "barraca de comida", restroom: "banheiro", water: "ponto de água", exit: "saída", medical: "posto de primeiros socorros", prayer: "sala de oração", info: "balcão de informações", shop: "loja", gate: "portão" },
  hi: { food: "खाने का स्टॉल", restroom: "शौचालय", water: "पानी का पॉइंट", exit: "निकास", medical: "प्राथमिक चिकित्सा केंद्र", prayer: "प्रार्थना कक्ष", info: "सूचना डेस्क", shop: "दुकान", gate: "गेट" },
};

/**
 * Answer a message without AI. Returns the same event stream shape as the
 * Gemini path, prefixed with a `degraded` event so the UI shows the badge.
 */
export function fallbackRespond(
  text: string,
  opts: { seat?: string; accessibilityMode?: boolean; reason: string },
): ChatEvent[] {
  const lang = detectLang(text);
  const msgs = M[lang];
  const events: ChatEvent[] = [{ type: "degraded", reason: opts.reason }];
  const from = opts.seat ? `seat ${opts.seat}` : "gate a";
  const accessibleDefault = opts.accessibilityMode ?? false;
  const intent = resolveIntent(text);
  const say = (t: string) => events.push({ type: "text", text: t });

  switch (intent.kind) {
    case "route": {
      const r = route(from, intent.to, { accessible: intent.accessible || accessibleDefault });
      if (!r.found) {
        say(msgs.notFound);
        break;
      }
      say(fill(msgs.routeIntro, { dist: String(r.totalDistance) }));
      r.steps.forEach((s, i) => say(`\n${i + 1}. ${s.instruction}`));
      events.push({ type: "route", route: r });
      break;
    }
    case "nearest": {
      const hit = nearestPoi(intent.poi, from, {
        accessible: intent.accessible || accessibleDefault,
        tags: intent.tags,
      });
      if (!hit) {
        say(msgs.notFound);
        break;
      }
      say(
        fill(msgs.nearest, {
          what: KIND_NAMES[lang][intent.poi] ?? intent.poi,
          name: hit.poi.name,
          dist: String(hit.route.totalDistance),
        }),
      );
      hit.route.steps.forEach((s, i) => say(`\n${i + 1}. ${s.instruction}`));
      events.push({ type: "route", route: hit.route });
      break;
    }
    case "crowd": {
      const readings = allCrowd();
      const busiest = [...readings].sort((a, b) => b.occupancy - a.occupancy)[0];
      const summary = `${busiest.zoneName}: ${busiest.level}`;
      const advice = bestGateAdvice();
      say(fill(msgs.crowd, { summary, advice }));
      events.push({ type: "crowd", readings, advisory: advice });
      break;
    }
    case "transport": {
      const options = transportOptions();
      const names = options.slice(0, 3).map((o) => o.name).join(", ");
      const suggestion = transportSuggestion();
      say(fill(msgs.transport, { options: names, suggestion }));
      events.push({ type: "transport", options, suggestion });
      break;
    }
    case "help":
      say(msgs.help);
      break;
    default:
      say(msgs.unknown);
  }

  say(`\n\n${msgs.demoNote}`);
  events.push({ type: "done" });
  return events;
}
