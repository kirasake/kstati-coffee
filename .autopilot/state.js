window.STATE =
{
  "version": 2,
  "slug": "kstati-coffee",
  "dir": "2026-11-24-kstati-coffee--wip",
  "title": "Сайт кофейни «Кстати» (концепт)",
  "mode": "semi",
  "depth": "normal",
  "tier": "T1",
  "briefFile": "2026-11-24-brief.md",
  "memoryFile": "AGENTS.md",
  "memoryOwner": "autopilot",
  "skillDir": "C:/Users/X-GAMING/.claude/skills/autopilot",
  "baseCommit": null,
  "startedAt": "2026-11-24T15:22:53+03:00",
  "updatedAt": "2026-11-24T15:27:33+03:00",
  "finishedAt": null,
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-11-24T15:22:53+03:00",
      "finishedAt": "2026-11-24T15:23:07+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-11-24T15:23:07+03:00",
      "finishedAt": "2026-11-24T15:25:55+03:00"
    },
    {
      "id": "briefing",
      "status": "skipped",
      "startedAt": "2026-11-24T15:24:18+03:00",
      "finishedAt": "2026-11-24T15:24:18+03:00",
      "note": "вопросов не потребовалось: данные сняты с Яндекса, фото — генерация, как разрешил пользователь"
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-11-24T15:25:55+03:00",
      "finishedAt": "2026-11-24T15:27:09+03:00"
    },
    {
      "id": "plan",
      "status": "active",
      "startedAt": "2026-11-24T15:27:09+03:00"
    },
    {
      "id": "build",
      "status": "pending"
    },
    {
      "id": "review",
      "status": "pending"
    },
    {
      "id": "final",
      "status": "pending"
    }
  ],
  "requirements": {
    "total": 11,
    "done": 0,
    "inTicket": 10,
    "inSpec": 0,
    "placeholder": 0,
    "deferred": 1,
    "dropped": 0
  },
  "tickets": [
    {
      "id": "01",
      "title": "Фотографии напитков и атмосферы",
      "requirements": [
        "R07",
        "R08"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "assets/img/"
      ],
      "review": "нет",
      "model": "обычная",
      "status": "pending",
      "retries": 0,
      "repairs": 0
    },
    {
      "id": "02",
      "title": "Сайт кофейни с анимациями",
      "requirements": [
        "R01",
        "R02",
        "R03",
        "R04",
        "R06",
        "R09i",
        "R10i",
        "R11i"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "index.html",
        "css/",
        "js/",
        "tools/"
      ],
      "review": "нет",
      "model": "сильная",
      "status": "pending",
      "retries": 0,
      "repairs": 0
    }
  ],
  "tests": null,
  "debt": {
    "placeholders": [],
    "assumptions": [
      "Фото не с Яндекса, а сгенерированы в Higgsfield — права на фото с карт не наши",
      "В футере пометка «концепт для портфолио»"
    ],
    "emptyEnv": []
  },
  "additions": [],
  "coverage": null,
  "concerns": [],
  "blind": null,
  "beats": [
    "2026-11-24T15:22:53+03:00",
    "2026-11-24T15:23:07+03:00",
    "2026-11-24T15:23:28+03:00",
    "2026-11-24T15:24:18+03:00",
    "2026-11-24T15:25:55+03:00",
    "2026-11-24T15:27:01+03:00",
    "2026-11-24T15:27:09+03:00",
    "2026-11-24T15:27:33+03:00"
  ],
  "rev": 11,
  "waiting": null,
  "waits": [],
  "log": [
    {
      "t": "2026-11-24T15:22:53+03:00",
      "k": "init"
    },
    {
      "t": "2026-11-24T15:23:07+03:00",
      "k": "stage",
      "id": "manifest",
      "act": "start"
    },
    {
      "t": "2026-11-24T15:24:18+03:00",
      "k": "add",
      "key": "debt.assumptions",
      "n": 2
    },
    {
      "t": "2026-11-24T15:24:18+03:00",
      "k": "stage",
      "id": "briefing",
      "act": "skip",
      "note": "вопросов не потребовалось: данные сняты с Яндекса, фото — генерация, как разрешил пользователь"
    },
    {
      "t": "2026-11-24T15:25:55+03:00",
      "k": "gate",
      "g": "G1",
      "ok": false,
      "open": 11,
      "total": 11
    },
    {
      "t": "2026-11-24T15:25:55+03:00",
      "k": "stage",
      "id": "spec",
      "act": "start"
    },
    {
      "t": "2026-11-24T15:27:01+03:00",
      "k": "tier",
      "v": "T1"
    },
    {
      "t": "2026-11-24T15:27:01+03:00",
      "k": "gate",
      "g": "G1",
      "ok": true,
      "open": 0,
      "total": 11
    },
    {
      "t": "2026-11-24T15:27:09+03:00",
      "k": "stage",
      "id": "plan",
      "act": "start"
    },
    {
      "t": "2026-11-24T15:27:33+03:00",
      "k": "tickets",
      "n": 2
    },
    {
      "t": "2026-11-24T15:27:33+03:00",
      "k": "gate",
      "g": "G3",
      "ok": true,
      "problems": 0
    }
  ],
  "reqList": [
    {
      "id": "R01",
      "text": "«выбери кофейню у которой нет сайта и начнем делать» → «сайт для кофейни»",
      "status": "in-ticket"
    },
    {
      "id": "R02",
      "text": "«с плавными … анимациями»",
      "status": "in-ticket"
    },
    {
      "id": "R03",
      "text": "«интересными анимациями»",
      "status": "in-ticket"
    },
    {
      "id": "R04",
      "text": "«скинул референсы»",
      "status": "in-ticket"
    },
    {
      "id": "R05",
      "text": "«если можешь используй фотки … которые на яндексе»",
      "status": "deferred",
      "why": "ASSUMPTION — фото с Яндекса загружены посетителями/владельцем, права не наши и качество низкое → все фото генерируем в Higgsfield (R08)"
    },
    {
      "id": "R06",
      "text": "«все цены которые на яндексе расположены»",
      "status": "in-ticket"
    },
    {
      "id": "R07",
      "text": "«и их картинки»",
      "status": "in-ticket"
    },
    {
      "id": "R08",
      "text": "«если нет можешь генерировать в нейронке которую я тебе добавлял»",
      "status": "in-ticket"
    },
    {
      "id": "R09i",
      "text": "(подразумевается) сайт нормально выглядит с телефона",
      "status": "in-ticket"
    },
    {
      "id": "R10i",
      "text": "(подразумевается) адрес, часы, телефон, карта — чтобы дойти до кофейни",
      "status": "in-ticket"
    },
    {
      "id": "R11i",
      "text": "(подразумевается) это портфолио-концепт реального бизнеса, сайт не выдаёт себя за официальный",
      "status": "in-ticket"
    }
  ],
  "gates": {
    "G1": {
      "ok": true,
      "at": "2026-11-24T15:27:01+03:00",
      "open": 0,
      "total": 11
    },
    "G3": {
      "ok": true,
      "at": "2026-11-24T15:27:33+03:00",
      "problems": 0
    }
  },
  "result": null
}
