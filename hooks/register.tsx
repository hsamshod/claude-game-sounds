import type { EngineInterface, Register } from 'claude-code'

// Категории событий → номера звуков. Номер N — файл sounds/wN.mp3 (нумерация со страницы
// zvukipro.com). Чтобы изменить озвучку, правь списки ниже: добавляй или убирай номера.
// Не скачиваются и не используются: 20 «Gold mine explosion», 41 «Да», 44 «Food limit exceeded».
const SOUNDS = {
  // Старт Claude Code
  start: [
    1, // «Чего желает мой повелитель» (послушник)
    13, // «Что прикажете»
    46, // «Пора просыпаться» (друид-медведь)
    49, // «Я жажду служить» (послушник)
  ],
  // Вход в режим планирования
  planStart: [
    45, // «О, позабавимся»
    31, // «Провижу грядущее» (говорящий с духами)
    16, // «Король мертвых дал мне истинную силу»
    55, // «Да воцарится ночь» (дредлорд)
  ],
  // План готов
  planReady: [
    50, // «Лови ядро» (орудийный расчёт)
    47, // «Да свершится предначертанное!» (нежить)
  ],
  // Начало задачи (отправка промпта)
  task: [
    2, // «Да, повелитель» (нежить)
    3, // «Жизнь за Нер'Зула!»
    4, // «Я готова» (лучница)
    6, // «За честь и отвагу» (Артас)
    17, // «Пора убивать» (лесной тролль)
    18, // «Мне это нравится»
    19, // «Никому не двигаться, у меня бомба» (гоблин)
    26, // «Моя жизнь принадлежит орде» (таурен)
    30, // «Да, повелитель» (мастер клинка)
    34, // «А вот так мне нравится» (орк)
    38, // «Да, господин»
    39, // «Опять работа?»
    40, // «Готов вкалывать» (раб орды)
  ],
  // Работа закончена (ответ готов)
  done: [
    32, // Hero level up
    35, // «Готово» (рабочий альянса)
    48, // «Постройка завершена» (послушник)
  ],
  // Лимит подписки ≥ LIMIT_PERCENT
  limit: [
    21, // «Золотой рудник обрушился»
    22, // «Наш рудник скоро иссякнет»
    24, // «Нужно золото»
    25, // «Нужно больше золота» (нежить)
  ],
  // Ошибка хода (API error, отказ модели)
  error: [
    7, // «Жалкий глупец»
    15, // Error sound
    23, // «Наш герой мертв»
    27, // «На наш город напали»
    28, // «Нас атакуют»
    37, // «Здесь нельзя строить»
    52, // «На нас напали» (некромант)
  ],
  // Диалог разрешения на экране (Claude ждёт ответа)
  waiting: [
    29, // «Думаешь?» (грифон)
    42, // «Чё надо, хозяин»
    43, // «Чего хочешь, зайка» (волшебница)
    60, // «Чего?» (рабочий людей)
    61, // «Ты что ли король? А я за тебя не голосовал»
  ],
  // Конец сессии
  end: [
    12, // «Когда же кончится эта война» (Кэрн)
  ],
  // Субагент завершился с ошибкой: звуки смерти
  death: [
    5, // лучница
    9, // бандит
    36, // рабочий альянса
    51, // друид-медведь
    53, // таурен
    54, // бугай
    56, // волшебница
    57, // друид-ворон
    58, // охотник за головами
    59, // кобольд
  ],
  // Edit / Write: звуки стройки
  fx: [
    8, // топор по дереву
    10, // стройка
    11, // здание поставлено
    14, // стройка идёт
    33, // казармы орков
  ],
} as const

type Category = keyof typeof SOUNDS

// Эти категории играют всегда; остальные пропускаются, пока звучит предыдущий клип.
const ALWAYS: readonly Category[] = ['limit', 'error', 'end', 'start']
const LIMIT_PERCENT = 90
const CLIP_MS = 2500

let busyUntil = 0

function pick(category: Category): number {
  const pool: readonly number[] = SOUNDS[category]

  return pool[Math.floor(Math.random() * pool.length)]!
}

async function play($: EngineInterface, category: Category, isAwaited = false) {
  const now = await $.clock.now()

  if (now < busyUntil && !ALWAYS.includes(category)) {
    return
  }

  busyUntil = now + CLIP_MS
  const clip = $.audio.play({ asset: `sounds/w${pick(category)}.mp3` }).catch(() => undefined)

  if (isAwaited) {
    await clip
  }
}

export const register: Register = on => {
  const limitFired = new Set<string>()

  on('session.start', async ($, e, next) => {
    await play($, 'start')

    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    await play($, 'task')

    return next(e)
  })

  on('tool.call', { tool: 'EnterPlanMode' }, async ($, e, next) => {
    await play($, 'planStart')

    return next(e)
  })

  on('tool.call', { tool: 'ExitPlanMode' }, async ($, e, next) => {
    await play($, 'planReady')

    return next(e)
  })

  on('tool.call', { tool: 'Edit' }, async ($, e, next) => {
    await play($, 'fx')

    return next(e)
  })

  on('tool.call', { tool: 'Write' }, async ($, e, next) => {
    await play($, 'fx')

    return next(e)
  })

  // Классический хук PermissionRequest срабатывает, когда Claude реально показывает диалог разрешения.
  on('classic.PermissionRequest', async ($, e, next) => {
    await play($, 'waiting')

    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) {
      if (e.reason === 'error') {
        await play($, 'death')
      }
    } else if (e.reason === 'answer') {
      await play($, 'done')
    } else if (e.reason === 'error' || e.reason === 'refusal') {
      await play($, 'error')
    }

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    for (const window of e.rateLimits) {
      if (window.percentUsed >= LIMIT_PERCENT) {
        if (!limitFired.has(window.kind)) {
          limitFired.add(window.kind)
          await play($, 'limit')
        }
      } else {
        limitFired.delete(window.kind)
      }
    }

    return next(e)
  })

  on('session.end', async ($, e, next) => {
    await play($, 'end', true)

    return next(e)
  })
}
