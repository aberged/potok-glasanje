# potok glasanje

Tabla glasanja jedne grupe: Potok aplikacija koju donosi šablon **Glasanja** u meniju „Kreiraj podgrupu“. Napravljena je po šablonu [potok-vite](../potok-vite/README.md): Vite, TypeScript, Tailwind, daisyUI sa prefiksom `d-` i lit-html.

Glasanja, glasovi i pravila su na serveru, u `PotokIde.Polls`. Isti model čitaju kartica u četu i kartica Glasanja na stranici grupe, a aplikacija je treći prikaz.

Aplikacija zato samo čita:

- `listPolls` i `getPoll` vraćaju ono što pravila glasanja pokazuju ovom gledaocu. Skriven broj je `null`.
- `onPollChange` javlja koje se glasanje promenilo, a aplikacija ga ponovo čita.
- `openPoll` i `openPollForm` otvaraju dijalog Potoka preko aplikacije. Tu se glasa i pokreće novo glasanje.

Aplikacija ne može da glasa i ne menja glasanje. Radi za svakog gledaoca, a glas može da bude konačan, pa to ostaje na stranici Potoka.

Ranija verzija, koja je sve čuvala u data vrednostima, ostaje u `../potok-vite-example`. Kopije nalepljene u grupe rade i dalje, a ništa se ne seli.

## Brzi start

```sh
npm install
npm run dev      # lokalno, na portu 5176, uz dev mock potok API-ja
npm test
npm run build    # tsc + vite build → dist/potok-build.html
```

Posle builda, u `potok-ide`:

```sh
mix potok.sync_apps
```

Kopija ide u `priv/apps/glasanje.html`, a nova verzija stiže samo u grupe napravljene posle nje. Svaka grupa čuva svoju kopiju, kao Feed.

## Jezici

Stranica Potoka upisuje jezik u `<html lang>` okvira: `sr`, `sr-Cyrl` ili `en`. Reči su u `src/i18n.ts`. Srpski je referenca, a ćirilica se računa iz njega i važi samo za reči aplikacije, nikad za ono što su ljudi upisali.

U dev režimu jezik se bira sa `?lang=en` ili `?lang=sr-Cyrl`.

## Struktura

| Fajl | Šta je |
|---|---|
| [index.html](index.html) | koren aplikacije i opis za karticu linka, koji mora da bude u `<body>` |
| [src/main.ts](src/main.ts) | ulaz |
| [src/board.ts](src/board.ts) | stanje table i kako promena ulazi u nju |
| [src/ui.ts](src/ui.ts) | lit-html prikaz |
| [src/i18n.ts](src/i18n.ts) | reči |
| [src/board.test.ts](src/board.test.ts) | vitest testovi |
| [src/dev-tools.ts](src/dev-tools.ts), [src/dev-theme.css](src/dev-theme.css) | samo za dev |
| [src/potok.ts](src/potok.ts), [src/potok-dev.ts](src/potok-dev.ts), [vite.config.ts](vite.config.ts) | iz šablona, bez izmena |

Dev mock glasanja čuva u `localStorage` pod `potok-dev:polls`. `openPollForm` dodaje glasanje, a `openPoll` glasa za prvi odgovor. Za novi početak: `localStorage.removeItem('potok-dev:polls')`.
