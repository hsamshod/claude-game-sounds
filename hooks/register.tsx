import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

// Категории событий → номера звуков. Номер N — файл sounds/<пак>/N.mp3 (нумерация со страницы
// zvukipro.com). Чтобы изменить озвучку, правь списки ниже: добавляй или убирай номера.
// Warcraft III. Не скачиваются и не используются: 20 «Gold mine explosion», 41 «Да»,
// 44 «Food limit exceeded».
const WARCRAFT3 = {
  // Старт Claude Code
  start: [
    1, // «Чего желает мой повелитель» (послушник)
    13, // «Что прикажете»
    46, // «Пора просыпаться» (друид-медведь)
    49, // «Я жажду служить» (послушник)
    38, // «Да, господин»
    42, // «Чё надо, хозяин»
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
    39, // «Опять работа?»
    3, // «Жизнь за Нер'Зула!»
    39, // «Опять работа?»
    6, // «За честь и отвагу» (Артас)
    39, // «Опять работа?»
    17, // «Пора убивать» (лесной тролль)
    39, // «Опять работа?»
    18, // «Мне это нравится»
    39, // «Опять работа?»
    19, // «Никому не двигаться, у меня бомба» (гоблин)
    39, // «Опять работа?»
    26, // «Моя жизнь принадлежит орде» (таурен)
    39, // «Опять работа?»
    30, // «Да, повелитель» (мастер клинка)
    39, // «Опять работа?»
    34, // «А вот так мне нравится» (орк)
    39, // «Опять работа?»
    40, // «Готов вкалывать» (раб орды)
    39, // «Опять работа?»
  ],
  // Работа закончена (ответ готов)
  done: [
    32, // Hero level up
    4, // «Я готова» (лучница)
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
    43, // «Чего хочешь, зайка» (волшебница)
    60, // «Чего?» (рабочий людей)
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

// Counter-Strike 1.6: голосовые команды, https://zvukipro.com/games/1771-zvuki-golosovyh-komand-v-igre-counter-strike-16.html
const CS16 = {
  // Старт Claude Code
  start: [
    32, // locknload
    31, // letsgo
    27, // go
  ],
  // Вход в режим планирования
  planStart: [
    9, // com_followcom
    37, // position
  ],
  // План готов
  planReady: [
    1, // com_go
    35, // moveout
    42, // stormfront
    25, // followme
  ],
  // Начало задачи (отправка промпта)
  task: [
    39, // roger
    12, // ct_affirm
    39, // roger
    10, // com_getinpos
    39, // roger
    31, // letsgo
  ],
  // Работа закончена (ответ готов)
  done: [
    43, // takepoint
    6, // clear
    3, // bombdef
    30, // rescued
    21, // elim
    105, // убийство курицы
  ],
  // Лимит подписки ≥ LIMIT_PERCENT
  limit: [
    23, // fallback
    5, // circleback
  ],
  // Ошибка хода (API error, отказ модели)
  error: [
    36, // negative
    17, // ct_imhit
    2, // blow
    29, // hosdown
  ],
  // Диалог разрешения на экране (Claude ждёт ответа)
  waiting: [
    13, // ct_backup
    14, // ct_coverme
    19, // ct_point
    38, // regroup
    16, // ct_fireinhole
    4, // bombpl
    24, // fireassis
    122, // бомба пикнула
  ],
  // Конец сессии
  end: [
    40, // rounddraw
    7, // ctwin
  ],
  // Субагент завершился с ошибкой
  death: [
    33, // matedown
    17, // ct_imhit
  ],
  // Edit / Write
  fx: [
    118, // калашников
    119, // калашников (вариант 2)
    120, // АВП
    124, // дигл
    129, // MP5 с глушителем
    135, // AUG
    128, // рикошет
    126, // удар ножом
    127, // нож достали
  ],
} as const satisfies Record<keyof typeof WARCRAFT3, readonly number[]>

const PACKS = { warcraft3: WARCRAFT3, cs16: CS16 } as const

type Pack = keyof typeof PACKS

const PACK_TITLES: Record<Pack, string> = {
  warcraft3: 'Warcraft III',
  cs16: 'Counter-Strike 1.6',
}

// Последний скачиваемый файл пака: если его нет, звуки не докачаны (или не скачивались вовсе).
const PACK_MARKERS: Record<Pack, string> = {
  warcraft3: 'sounds/warcraft3/61.mp3',
  cs16: 'sounds/cs16/135.mp3',
}

function isPack(value: unknown): value is Pack {
  return typeof value === 'string' && value in PACKS
}

type Category = keyof typeof WARCRAFT3

// Эти категории играют всегда; остальные пропускаются, пока звучит предыдущий клип.
const ALWAYS: readonly Category[] = ['limit', 'error', 'end', 'start']
const LIMIT_PERCENT = 90
const CLIP_MS = 2500

let busyUntil = 0

// Выбранный пак; null — ещё не выбран, звуков нет (на старте спросим).
let activePack: Pack | null = null

function pick(pack: Pack, category: Category): number {
  const pool: readonly number[] = PACKS[pack][category]

  return pool[Math.floor(Math.random() * pool.length)]!
}

async function play($: EngineInterface, category: Category, isAwaited = false) {
  if (activePack === null) {
    return
  }

  const now = await $.clock.now()

  if (now < busyUntil && !ALWAYS.includes(category)) {
    return
  }

  busyUntil = now + CLIP_MS
  const clip = $.audio.play({ asset: `sounds/${activePack}/${pick(activePack, category)}.mp3` }).catch(() => undefined)

  if (isAwaited) {
    await clip
  }
}

const downloadFrame = atom({ plugin: 'game-sounds', key: 'downloadFrame' } as const, null)

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const FRAME_MS = 250

// Звуки не лежат в репозитории: при первом выборе пака докачиваем их скриптом.
async function ensureSounds($: EngineInterface, pack: Pack) {
  if (await $.fs.exists(`${$.plugin.root}/${PACK_MARKERS[pack]}`)) {
    return
  }

  // Пока идёт загрузка, над промптом крутится индикатор (см. ui.render ниже).
  await update($, downloadFrame, () => 0)
  const tick = $.clock.every(FRAME_MS, () => update($, downloadFrame, frame => (frame ?? 0) + 1))
  let exitCode: number | null = null

  try {
    // spawn отдаёт код выхода как возвращаемое значение стрима, а for await его теряет,
    // поэтому используем run: он ждёт завершения и сразу возвращает exitCode.
    const result = await $.process.run(['bash', `${$.plugin.root}/download-sounds.sh`, pack], {
      timeoutMs: 600_000,
    })
    exitCode = result.exitCode
  } catch {
    exitCode = null
  } finally {
    tick.cancel()
    await update($, downloadFrame, () => null)
  }

  $.ui.toast(
    exitCode === 0
      ? `game-sounds: звуки ${PACK_TITLES[pack]} скачаны`
      : `game-sounds: не все звуки скачались, запусти download-sounds.sh ${pack} вручную`,
  )
}

async function setPack($: EngineInterface, pack: Pack) {
  activePack = pack
  await $.config.set({ key: 'game-sounds.pack', value: pack })
  void ensureSounds($, pack).catch(() => undefined)
}

// Спрашивает пак диалогом; null, если диалог закрыт (спросим снова в следующий раз).
async function choosePack($: EngineInterface): Promise<Pack | null> {
  const packs = Object.keys(PACKS) as Pack[]
  const answer = await $.ui
    .ask('Какой звуковой пак включить?', packs.map(pack => PACK_TITLES[pack]))
    .catch(() => null)
  const pack = packs.find(candidate => PACK_TITLES[candidate] === answer)

  if (pack === undefined) {
    return null
  }

  await setPack($, pack)

  return pack
}

export const register: Register = (on, options) => {
  const limitFired = new Set<string>()

  activePack = isPack(options.pack) ? options.pack : null

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'sound-pack',
      description: 'Выбрать звуковой пак: Warcraft III или Counter-Strike 1.6',
      argumentHint: Object.keys(PACKS).join(' | '),
    })

    if (activePack === null) {
      if (e.isInteractive) {
        await choosePack($)
      }
    } else {
      void ensureSounds($, activePack).catch(() => undefined)
    }

    await play($, 'start')

    return next(e)
  })

  on('command.run', { command: 'sound-pack' }, async ($, e) => {
    const arg = e.args.trim()

    if (arg === '') {
      const pack = await choosePack($)

      return { text: pack === null ? 'Пак не выбран.' : `Пак: ${PACK_TITLES[pack]}` }
    }

    if (!isPack(arg)) {
      return { text: `Неизвестный пак «${arg}». Доступны: ${Object.keys(PACKS).join(', ')}.` }
    }

    await setPack($, arg)

    return { text: `Пак: ${PACK_TITLES[arg]}` }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const frame = await read($, downloadFrame)

    if (frame === null || e.props.hasSurvey) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    const seconds = Math.floor((frame * FRAME_MS) / 1000)

    return (
      <Box>
        <Text color="yellow">{SPINNER[frame % SPINNER.length]} </Text>
        <Text>game-sounds: скачиваю звуки ({seconds} с, около минуты). </Text>
        <Text dimColor>Можно продолжать работу, звуки появятся после загрузки.</Text>
      </Box>
    )
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
