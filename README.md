# Catwalk Sterren 👗✨

Een browser-aankleedspel voor kinderen. Maak je eigen model, kleed het aan voor een opdracht, laat de jury oordelen en speel steeds meer kleding, kapsels, make-up, accessoires en decors vrij.

## Spelen

Open `index.html` in een browser. Meer is niet nodig: geen installatie, geen server.
De voortgang wordt per speler in de browser bewaard (localStorage), dus meerdere kinderen kunnen op hetzelfde apparaat elk hun eigen profiel hebben.

## Hoe het spel werkt

- **Model maken**: huidskleur, ogen, gezichtsvorm, postuur (slider van dun naar dik), kapsel en haarkleur.
- **Opdrachten**: elke ronde krijg je een thema (bijv. Dagje Strand, Balletles, Prinsessenthee, Ruimtereis). De stickers bij de opdracht laten zien wat de jury zoekt. De setting hoort bij de opdracht; alleen bij vrij spelen kies je zelf waar je staat.
- **Kast**: je ziet alleen wat je al hebt vrijgespeeld. Wat er op het volgende level bijkomt blijft een verrassing, je ziet alleen de aantallen.
- **Jury**: drie juryleden beoordelen elk met een eigen smaak:
  - Madame Fleur let op kleurharmonie en glamour
  - Meester Ties let op het thema, compleetheid en de setting
  - DJ Luna let op accessoires en fun
- **Sterren en levels**: sterren geven XP. Elk level speelt nieuwe spullen en nieuwe opdrachten vrij. Er zijn 20 levels.
- **Vrij spelen**: aankleden zonder jury, met een modeshow als finale.

## Projectstructuur

| Bestand | Wat erin zit |
| --- | --- |
| `index.html` | De pagina en de schermen |
| `css/style.css` | Stijl, licht en donker thema |
| `js/data.js` | Alle items, thema's, jury en levelcurve. Hier voeg je nieuwe spullen toe |
| `js/avatar.js` | Het model tekenen in SVG: lichaam, gezicht, haar, kleding, accessoires |
| `js/bg.js` | De decors (settings) |
| `js/game.js` | Spellogica: profielen, kleedkamer, beoordeling, voortgang |
| `build-artifact.js` | Maakt `dist/artifact.html` voor publicatie als Claude-artifact |

## Een nieuw item toevoegen

1. Voeg in `js/data.js` een regel toe bij de juiste categorie met `id`, `shape`, `name`, kleuren `c`, `tags`, `glam`, `hue` en `lvl`.
2. Bestaat de `shape` nog niet? Voeg dan een tekenfunctie toe in `js/avatar.js` in de bijbehorende map (`TOPS`, `SHOES`, `HATS`, ...).
3. Herlaad de pagina. Klaar.
