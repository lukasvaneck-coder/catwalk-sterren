# Catwalk Sterren 👗✨

Een browser-aankleedspel voor kinderen. Maak je eigen model, loop door het dorp naar het Modehuis, kleed je model aan voor een opdracht, laat de jury oordelen en speel steeds meer kleding, kapsels, make-up, accessoires en decors vrij.

## Spelen

Open `index.html` in een browser, of speel online via GitHub Pages. Vanaf een los bestand werkt alles behalve het opslaan van de foto (daar heeft de browser een website voor nodig).
De voortgang wordt per speler in de browser bewaard (localStorage), dus meerdere kinderen kunnen op hetzelfde apparaat elk hun eigen profiel hebben.

## Hoe het spel werkt

- **Model maken**: huidskleur, ogen, postuur (slider van dun naar dik), kapsel (twintig sprites) en haarkleur.
- **Het dorp**: na het kiezen van je speler sta je met je poppetje op het bloemenplein. Loop met de pijltjes, WASD, de loopknoppen of door op het pad te tikken naar een van de vier huisjes: **Modehuis** (opdrachten en kleedkamer), **Sterrenwinkel**, **Kleurenhuis** (kleurenpuzzel) en **Duelhuis** (samen spelen). Bij de deur druk je op Enter of de knop om naar binnen te gaan. Vanuit de kleedkamer kom je met 🏡 Dorp weer buiten.
- **Opdrachten**: elke ronde krijg je een thema (bijv. Dagje Strand, Balletles, Prinsessenthee, Ruimtereis). De stickers bij de opdracht laten zien wat de jury zoekt. De setting hoort bij de opdracht; alleen bij vrij spelen kies je zelf waar je staat.
- **Kast**: je ziet alleen wat je al hebt vrijgespeeld. Wat er op het volgende level bijkomt blijft een verrassing, je ziet alleen de aantallen.
- **Jury**: drie juryleden beoordelen elk met een eigen smaak:
  - Madame Fleur let op kleurharmonie en glamour
  - Meester Ties let op het thema, compleetheid en de setting
  - DJ Luna let op accessoires en fun
- **Sterren en levels**: sterren geven XP. Elk level speelt nieuwe spullen en nieuwe opdrachten vrij. Er zijn 20 levels.
- **Munten en winkel**: elke jurybeurt levert munten op. Bij een level-up krijg je twee cadeautjes, de rest van dat level komt in de winkel. Bij het kopen komt een rekenvraagje (hoeveel houd je over?), goed gerekend geeft bonusmunten.
- **Duel**: twee spelers, dezelfde opdracht, om de beurt aankleden. De jury beoordeelt beiden naast elkaar. Allebei krijgen sterren en munten, de winnaar iets extra.
- **Kleurenpuzzel**: drie vragen over het kleurenwiel (buurkleur, tegenoverliggende kleur, welke outfit is rustig). Vijf rondes per dag leveren munten op, oefenen mag altijd.
- **Kleurenopdrachten**: vier opdrachten (Buurkleurenfeest, Eén-kleur-dag, Knalcombinatie, Kleurenmeester) waarin het kleurenwiel op de kaart laat zien welke kleuren gevraagd worden. De kleuren wisselen per keer.
- **Bonusvraag**: waren de kleuren geen vriendjes, dan stelt Madame Fleur na de jury één vraag over jouw eigen outfit. Goed antwoord is 4 munten, proberen is er altijd 1.
- **Vrij spelen**: aankleden zonder jury, met een modeshow als finale.

## Hoe het eruitziet

Het poppetje, het dorp en de decors komen uit de illustraties van *Sterreneiland* (`styling inspo.zip`). Het poppetje is een 3D-achtige pop die uit losse lagen wordt opgebouwd: elke laag is een grijze uitsnede uit `assets/doll.png` die in het spel met een kleur wordt vermenigvuldigd. Zo krijgen huid, ogen, haar en elk kledingstuk hun eigen kleur, met de schaduwen van de illustratie erin. Hoedjes, brillen, sieraden, tassen, spulletjes, vleugels en huisdieren zijn emoji (in de gekozen kleur) of kleine getekende vormpjes, geplaatst op de ogen-, mond- en handposities uit het manifest.

De decors zijn uitsneden uit de wereldillustraties (`assets/bg/`), soms met een sfeerlaag (nacht, regen, slingers), of worden in dezelfde zachte stijl getekend (`js/bg.js`). Het dorp is de dorpskaart met een loopraster dat uit de padkleur is afgeleid.

## Projectstructuur

| Bestand | Wat erin zit |
| --- | --- |
| `index.html` | De pagina en de schermen |
| `css/style.css` | Stijl |
| `js/data.js` | Alle items, thema's, jury en levelcurve. Hier voeg je nieuwe spullen toe |
| `js/avatar.js` | Het model samenstellen uit de sprite-lagen; accessoires en make-up |
| `js/bg.js` | De decors (settings) |
| `js/world.js` | Het dorp: lopen, route zoeken, huisjes |
| `js/game.js` | Spellogica: profielen, kleedkamer, beoordeling, voortgang |
| `assets/` | Gegenereerd: sprite-atlas, manifest, dorpskaart, decors |
| `tools/build-assets.py` | Maakt `assets/` uit de illustraties van de zip |
| `build-artifact.js` | Maakt `dist/artifact.html` (zonder assets; alleen voor een snelle preview) |

## Een nieuw item toevoegen

1. Voeg in `js/data.js` een regel toe bij de juiste categorie met `id`, `shape`, `name`, kleuren `c`, `tags`, `glam`, `hue` en `lvl`.
2. Kleding: kies een bestaande `shape` (bijv. `tshirt`, `sweater`, `hoodie`, `pants`, `skirt`, `tutu`, `aline`, `ballgown`, `sneaker`, `boot`). Elke shape is in `js/avatar.js` gekoppeld aan een of meer sprite-lagen (`TOP_RECIPES`, `BOTTOM_KEY`, `DRESS_RECIPES`, `SHOE_KEY`). Patronen (`stripes`, `dots`, `hearts`, `stars`, `checks`, `scales`, `flowers`, `glitter`, `rainbow`) worden over de stof gelegd.
3. Accessoires: bestaat de `shape` nog niet? Voeg dan een tekenfunctie toe in `js/avatar.js` bij `HATS`, `GLASSES`, `NECKS`, `BAGS`, `HAND`, `BACK`, `PETS` of `MAKEUP`. Een emoji plaatsen kan met `E('🎩', x, y, grootte, { tint: 0 })`.
4. Herlaad de pagina. Klaar.

## Assets opnieuw bouwen

Pak `styling inspo.zip` uit en draai:

```bash
python tools/build-assets.py <map>/public --preview <map-voor-controlebladen>
```

Nodig: Python 3 met Pillow, NumPy en SciPy. Het script splitst de sprites in lagen (stof, huid, haar, ogen, vaste details), bouwt de atlas en het manifest, maakt de dorpskaart met loopraster en de decor-uitsneden.
