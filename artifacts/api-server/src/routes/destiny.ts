import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] || "dummy",
});

function getZodiacSign(birthDate: string): string {
  const date = new Date(birthDate);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Овен";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Телец";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Близнецы";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Рак";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Лев";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Дева";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Весы";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Скорпион";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Стрелец";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Козерог";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Водолей";
  return "Рыбы";
}

function getLifePathNumber(birthDate: string): number {
  const digits = birthDate.replace(/-/g, "").split("").map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split("").map(Number).reduce((a, b) => a + b, 0);
  }
  return sum;
}

router.post("/analyze", async (req, res) => {
  const { name, birthDate, birthTime, gender, palmImageBase64, palmImageMimeType } = req.body as {
    name: string;
    birthDate: string;
    birthTime?: string;
    gender?: string;
    palmImageBase64?: string;
    palmImageMimeType?: string;
  };
  const mime = palmImageMimeType && /^image\/(jpeg|png|webp|gif)$/.test(palmImageMimeType)
    ? palmImageMimeType
    : "image/jpeg";

  if (!palmImageBase64) {
    res.status(400).json({ error: "Фото ладони обязательно для анализа." });
    return;
  }

  const zodiacSign = getZodiacSign(birthDate);
  const lifePathNumber = getLifePathNumber(birthDate);

  const archetypes = [
    "Мистический Провидец",
    "Звёздный Воин",
    "Душа Луны",
    "Огненный Феникс",
    "Хранитель Тайн",
    "Небесный Странник",
    "Дитя Вселенной",
    "Тёмный Мудрец",
  ];
  const archetype = archetypes[Math.floor(Math.random() * archetypes.length)];

  const auraColors = [
    { type: "Фиолетовая аура", color: "#8B5CF6" },
    { type: "Синяя аура", color: "#3B82F6" },
    { type: "Золотая аура", color: "#F59E0B" },
    { type: "Изумрудная аура", color: "#10B981" },
    { type: "Розовая аура", color: "#EC4899" },
    { type: "Серебряная аура", color: "#94A3B8" },
    { type: "Рубиновая аура", color: "#DC2626" },
    { type: "Белая аура", color: "#F0F0FF" },
  ];
  const aura = auraColors[Math.floor(Math.random() * auraColors.length)];

  const luckyNums = Array.from({ length: 5 }, () => Math.floor(Math.random() * 99) + 1);
  const days = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
  const luckyDays = [days[Math.floor(Math.random() * 7)], days[Math.floor(Math.random() * 7)]];
  const destinyScore = Math.floor(Math.random() * 20) + 75;

  const prompt = `Ты — мистический AI-хиромант и оракул. Перед тобой фотография ладони человека по имени ${name}. Изучи линии судьбы, жизни, ума, сердца, форму руки и пальцев, выпуклости (холмы), особенности кожи. Сопоставь увиденное с астрологией и нумерологией.

Данные клиента:
- Знак зодиака: ${zodiacSign}
- Число жизненного пути: ${lifePathNumber}
- Архетип судьбы: ${archetype}
- Аура: ${aura.type}
- Пол: ${gender || "не указан"}
- Время рождения: ${birthTime || "не указано"}

ВАЖНО: ссылайся на конкретные особенности ладони, которые видишь на фото (например: "длинная линия жизни", "разветвление линии сердца", "ярко выраженный холм Венеры"). Если на фото не видно ладони — всё равно дай мистический анализ, основываясь на данных, но упомяни общие черты "увиденного".

Создай ответ в формате JSON (все тексты на русском, эмоциональные, мистические, персональные):
{
  "personalityProfile": "2-3 предложения — глубокая характеристика, со ссылкой на линии ладони",
  "strengths": ["3 уникальные сильные стороны"],
  "weaknesses": ["2 слабости — мягко"],
  "hiddenTalents": "2-3 предложения о скрытых дарах",
  "loveStyle": "2-3 предложения о любовном стиле и линии сердца",
  "moneyEnergy": "2-3 предложения об энергии денег и линии судьбы",
  "futurePrediction": "3-4 предложения о ближайших 6 месяцах — драматично, с надеждой",
  "soulmateType": "2-3 предложения о родственной душе"
}

Пиши страстно, мистически, глубоко персонально.`;

  const portraitPrompt = `Mystical fantasy portrait of a person named ${name}. ${gender === "Женский" ? "Woman" : gender === "Мужской" ? "Man" : "Androgynous figure"}, ethereal and otherworldly, embodying the archetype "${archetype}" with a glowing ${aura.type.toLowerCase()} surrounding them. Cosmic background with stars, nebula, swirling magical energy. ${destinyArchetypeVisualHint(archetype)} Dark mystical palette: deep purples, neon blues, gold accents. Highly detailed digital painting, dramatic lighting, glowing eyes, mystical symbols floating around. No text, no watermark.`;

  let parsed: Record<string, unknown> = {};
  let portraitImageBase64: string | null = null;

  try {
    const [analysisResult, imageResult] = await Promise.allSettled([
      openai.chat.completions.create({
        model: "gpt-5-mini",
        max_completion_tokens: 2500,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: `data:${mime};base64,${palmImageBase64}` },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
      openai.images.generate({
        model: "gpt-image-1",
        prompt: portraitPrompt,
        size: "1024x1024",
        n: 1,
      }),
    ]);

    if (analysisResult.status === "rejected") {
      req.log.error({ err: analysisResult.reason }, "destiny/analyze: vision call failed");
      res.status(502).json({ error: "Не удалось получить анализ от оракула. Попробуй снова." });
      return;
    }
    const raw = analysisResult.value.choices[0]?.message?.content || "{}";
    parsed = JSON.parse(raw);

    if (imageResult.status === "fulfilled") {
      portraitImageBase64 = imageResult.value.data?.[0]?.b64_json ?? null;
    } else {
      req.log.warn({ err: imageResult.reason }, "destiny/analyze: portrait generation failed");
    }
  } catch (err) {
    req.log.error({ err }, "destiny/analyze: parallel call failed");
    res.status(502).json({ error: "Не удалось получить анализ от оракула. Попробуй снова." });
    return;
  }

  res.json({
    personalityProfile: parsed.personalityProfile || "",
    strengths: parsed.strengths || [],
    weaknesses: parsed.weaknesses || [],
    hiddenTalents: parsed.hiddenTalents || "",
    loveStyle: parsed.loveStyle || "",
    moneyEnergy: parsed.moneyEnergy || "",
    futurePrediction: parsed.futurePrediction || "",
    soulmateType: parsed.soulmateType || "",
    auraType: aura.type,
    auraColor: aura.color,
    destinyScore,
    luckyNumbers: luckyNums,
    luckyDays,
    zodiacSign,
    destinyArchetype: archetype,
    lifePathNumber,
    portraitImageBase64,
  });
});

function destinyArchetypeVisualHint(archetype: string): string {
  const hints: Record<string, string> = {
    "Мистический Провидец": "Wearing flowing robes, third eye glowing on forehead, holding a crystal orb.",
    "Звёздный Воин": "Cosmic warrior armor with constellation patterns, holding a sword of light.",
    "Душа Луны": "Silver lunar crown, soft moonlight aura, surrounded by crescent moons.",
    "Огненный Феникс": "Flames swirling around them, phoenix wings of fire emerging from back.",
    "Хранитель Тайн": "Hooded mystic, ancient runes floating, holding a glowing tome.",
    "Небесный Странник": "Traveler's cloak, compass and astrolabe, distant galaxies behind.",
    "Дитя Вселенной": "Radiant innocent expression, surrounded by tiny galaxies and stardust.",
    "Тёмный Мудрец": "Wise dark-clad figure, ancient eyes, shadows and starlight intertwined.",
  };
  return hints[archetype] || "Surrounded by mystical symbols and celestial energy.";
}

router.post("/daily", async (req, res) => {
  const { name, zodiacSign, auraType, lifePathNumber, destinyArchetype, birthDate } = req.body as {
    name: string;
    zodiacSign: string;
    auraType?: string;
    lifePathNumber?: number;
    destinyArchetype?: string;
    birthDate?: string;
  };

  if (!name || typeof name !== "string" || !zodiacSign || typeof zodiacSign !== "string") {
    res.status(400).json({ error: "Имя и знак зодиака обязательны." });
    return;
  }

  const energyLevel = Math.floor(Math.random() * 40) + 60;
  const luckyNumber = Math.floor(Math.random() * 99) + 1;
  const luckyColors = ["Фиолетовый", "Синий", "Золотой", "Розовый", "Изумрудный", "Серебряный", "Рубиновый", "Лазурный"];
  const luckyColor = luckyColors[Math.floor(Math.random() * luckyColors.length)];

  const spiritAnimals = [
    { name: "Волк", emoji: "🐺" },
    { name: "Сова", emoji: "🦉" },
    { name: "Орёл", emoji: "🦅" },
    { name: "Чёрная пантера", emoji: "🐆" },
    { name: "Феникс", emoji: "🔥" },
    { name: "Дельфин", emoji: "🐬" },
    { name: "Тигр", emoji: "🐅" },
    { name: "Лебедь", emoji: "🦢" },
    { name: "Лиса", emoji: "🦊" },
    { name: "Олень", emoji: "🦌" },
    { name: "Бабочка", emoji: "🦋" },
    { name: "Единорог", emoji: "🦄" },
  ];
  const spirit = spiritAnimals[Math.floor(Math.random() * spiritAnimals.length)];

  const now = new Date();
  const todayStr = now.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const moonDay = ((Math.floor(now.getTime() / 86400000) % 29) + 1);

  const lifePath = typeof lifePathNumber === "number" ? lifePathNumber : 0;
  const computedLifePath = lifePath || (birthDate ? getLifePathNumber(birthDate) : 0);

  const prompt = `Ты — мудрый мистический AI-оракул, который читает энергию дня для конкретного человека. Создай глубокое, личное, развёрнутое предсказание на сегодня (${todayStr}, лунный день ${moonDay}).

ЛИЧНОСТЬ:
- Имя: ${name}
- Знак зодиака: ${zodiacSign}
- Число жизненного пути: ${computedLifePath || "—"}
- Архетип судьбы: ${destinyArchetype || "—"}
- Аура: ${auraType || "—"}
- Духовный талисман сегодня: ${spirit.name}
- Счастливое число дня: ${luckyNumber}
- Цвет дня: ${luckyColor}
- Уровень космической энергии: ${energyLevel}%

Обращайся к человеку по имени (${name}). Используй детали его профиля — упоминай зодиак, число судьбы, талисман. Пиши страстно, мистически, эмоционально. Никаких общих фраз — будь конкретным и персональным.

Ответ строго в JSON:
{
  "message": "4-6 предложений — главное предсказание на сегодня. Упомяни имя, зодиак, лунную энергию. Опиши настроение дня, ключевую возможность и важный момент.",
  "loveInsight": "2-3 предложения о любви и отношениях сегодня для ${name}. Конкретно — что произойдёт или что важно сделать.",
  "careerInsight": "2-3 предложения о работе, деньгах, целях сегодня. Конкретные действия или возможности.",
  "healthInsight": "1-2 предложения о теле и энергии — что нужно сегодня (сон, движение, питание).",
  "bestTime": "Конкретный временной интервал, когда энергия пиковая (например, '14:00–17:00 — окно удачи').",
  "affirmation": "Короткая мощная аффирмация от первого лица — то, что ${name} должен повторять сегодня.",
  "warningArea": "Одна короткая фраза — чего избегать сегодня (например, 'Импульсивные решения').",
  "cosmicTip": "1-2 предложения — мистический совет или ритуал на сегодня (свеча, медитация, благодарность и т.д.)."
}`;

  let parsed: Record<string, unknown> = {};
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1800,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content || "{}";
    parsed = JSON.parse(raw);
  } catch (err) {
    req.log.error({ err }, "destiny/daily: OpenAI call failed");
    res.status(502).json({ error: "Не удалось получить предсказание. Попробуй позже." });
    return;
  }

  const safeString = (v: unknown, fallback: string): string =>
    typeof v === "string" && v.length > 0 ? v : fallback;

  res.json({
    message: safeString(parsed.message, `${name}, сегодня вселенная говорит с тобой особенно громко.`),
    energyLevel,
    luckyColor,
    luckyNumber,
    affirmation: safeString(parsed.affirmation, "Я открыт для чудес вселенной."),
    warningArea: safeString(parsed.warningArea, "Импульсивные решения"),
    spiritAnimal: spirit.name,
    spiritAnimalEmoji: spirit.emoji,
    loveInsight: safeString(parsed.loveInsight, "Сердце открыто для новых эмоций — слушай его."),
    careerInsight: safeString(parsed.careerInsight, "Время для смелых шагов в делах."),
    healthInsight: safeString(parsed.healthInsight, "Уделите внимание дыханию и отдыху."),
    bestTime: safeString(parsed.bestTime, "Полдень — пиковая энергия дня"),
    cosmicTip: safeString(parsed.cosmicTip, "Зажги свечу и поблагодари вселенную."),
  });
});

router.post("/compatibility", async (req, res) => {
  const { userName, userBirthDate, userZodiacSign, partnerName, partnerBirthDate } = req.body as {
    userName: string;
    userBirthDate: string;
    userZodiacSign: string;
    partnerName: string;
    partnerBirthDate: string;
  };

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  if (
    !userName || typeof userName !== "string" ||
    !userBirthDate || typeof userBirthDate !== "string" || !dateRe.test(userBirthDate) ||
    !userZodiacSign || typeof userZodiacSign !== "string" ||
    !partnerName || typeof partnerName !== "string" ||
    !partnerBirthDate || typeof partnerBirthDate !== "string" || !dateRe.test(partnerBirthDate)
  ) {
    res.status(400).json({ error: "Проверь, что все поля заполнены, а даты в формате ГГГГ-ММ-ДД." });
    return;
  }

  const partnerZodiacSign = getZodiacSign(partnerBirthDate);
  const userLifePath = getLifePathNumber(userBirthDate);
  const partnerLifePath = getLifePathNumber(partnerBirthDate);

  const score = Math.floor(Math.random() * 30) + 65;
  const loveCompatibility = Math.floor(Math.random() * 30) + 65;
  const friendshipCompatibility = Math.floor(Math.random() * 30) + 65;
  const passionLevel = Math.floor(Math.random() * 35) + 60;

  const prompt = `Ты — мистический AI-астролог совместимости. Проанализируй пару:

КЛИЕНТ:
- Имя: ${userName}
- Знак зодиака: ${userZodiacSign}
- Число жизненного пути: ${userLifePath}

ПАРТНЁР:
- Имя: ${partnerName}
- Знак зодиака: ${partnerZodiacSign}
- Число жизненного пути: ${partnerLifePath}

Сгенерируй глубокий, эмоциональный, персональный анализ совместимости на русском в формате JSON:
{
  "summary": "2-3 предложения — общее впечатление о паре, мистически и страстно",
  "strengths": ["3 сильные стороны этой пары — конкретно и живо"],
  "challenges": ["2 вызова — мягко, с надеждой"],
  "advice": "2-3 предложения совета для гармонии",
  "sharedDestiny": "2-3 предложения о возможной общей судьбе пары"
}

Используй имена. Пиши страстно, мистически, как будто читаешь звёздную карту судьбы.`;

  let parsed: Record<string, unknown> = {};
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    const raw = completion.choices[0]?.message?.content || "{}";
    parsed = JSON.parse(raw);
  } catch (err) {
    req.log.error({ err }, "destiny/compatibility: OpenAI call failed");
    res.status(502).json({ error: "Звёзды затуманены. Попробуй позже." });
    return;
  }

  const safeStringArray = (v: unknown, fallback: string[]): string[] => {
    if (!Array.isArray(v)) return fallback;
    const filtered = v.filter((x): x is string => typeof x === "string" && x.length > 0);
    return filtered.length > 0 ? filtered : fallback;
  };
  const safeString = (v: unknown, fallback: string): string =>
    typeof v === "string" && v.length > 0 ? v : fallback;

  res.json({
    score,
    partnerZodiacSign,
    summary: safeString(parsed.summary, "Ваши души связаны космической нитью."),
    loveCompatibility,
    friendshipCompatibility,
    passionLevel,
    strengths: safeStringArray(parsed.strengths, ["Глубокая эмоциональная связь", "Взаимное доверие", "Общие ценности"]),
    challenges: safeStringArray(parsed.challenges, ["Разные ритмы жизни", "Нужно больше открытого диалога"]),
    advice: safeString(parsed.advice, "Слушайте сердце, говорите открыто."),
    sharedDestiny: safeString(parsed.sharedDestiny, "Ваш путь сплетается в едином узоре."),
  });
});

export default router;
