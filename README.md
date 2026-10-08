# Catwalk Sterren 👗✨

Een browser-aankleedspel voor kinderen. Maak je eigen model, loop door het dorp naar het Modehuis, kleed je model aan voor een opdracht, laat de jury oordelen en speel steeds meer kleding, kapsels, make-up, accessoires en decors vrij.

## Spelen

Open `index.html` in een browser, of speel online via GitHub Pages. Vanaf een los bestand werkt alles behalve het opslaan van de foto (daar heeft de browser een website voor nodig).
De voortgang wordt per speler in de browser bewaard (localStorage), dus meerdere kinderen kunnen op hetzelfde apparaat elk hun eigen profiel hebben.

## Hoe het spel werkt

- **Model maken**: huidskleur, ogen, postuur (slider van dun naar dik), kapsel (twintig sprites) en twintig haarkleuren.
- **Het dorp**: wandel door vier buurten met dertien gebouwen, parkjes, een fontein en een vijver met brug. Gebruik de pijltjes, WASD, loopknoppen of tik op de grond. Via **🗺️ Kaart** kies je een gebouw en loop je er automatisch heen. Bij aankomst ga je naar binnen; wie zelf naar een deur loopt gebruikt Enter of de knop. **📖 Dorpsboek** bevat opdrachten van bewoners en je dorpspaspoort. Vanuit activiteiten keer je terug bij de deur waar je naar binnen ging.
- **Opdrachten**: elke ronde krijg je een thema (bijv. Dagje Strand, Balletles, Prinsessenthee, Ruimtereis). De stickers bij de opdracht laten zien wat de jury zoekt. De setting hoort bij de opdracht; alleen bij vrij spelen kies je zelf waar je staat.
- **Kast**: je ziet alleen wat je al hebt vrijgespeeld. Wat er op het volgende level bijkomt blijft een verrassing, je ziet alleen de aantallen.
- **Jury**: drie juryleden beoordelen elk met een eigen smaak:
  - Madame Fleur let op kleurharmonie en glamour
  - Meester Ties let op het thema, compleetheid en de setting
  - DJ Luna let op accessoires en fun
- **Sterren en levels**: sterren geven XP. Elk level speelt nieuwe spullen en nieuwe opdrachten vrij. Er zijn 20 levels.
- **Munten en winkel**: elke jurybeurt levert munten op. Bij een level-up krijg je twee cadeautjes, de rest van dat level komt in de winkel. Bij het kopen komt een rekenvraagje (hoeveel houd je over?), goed gerekend geeft bonusmunten.
- **Duel**: twee spelers, dezelfde opdracht, om de beurt aankleden. De jury beoordeelt beiden naast elkaar. Allebei krijgen sterren en munten, de winnaar iets extra.
- **Kleuratelier**: Madame Fleur geeft een kleurdoel: één kleurfamilie, buurkleuren of contrastkleuren. Je kleedt je eigen model aan met je eigen kast. Alleen haalbare kleurdoelen worden aangeboden. De jury beoordeelt de kleuren en een complete outfit en geeft sterren, XP en munten.
- **Kleurenopdrachten**: vier opdrachten (Buurkleurenfeest, Eén-kleur-dag, Knalcombinatie, Kleurenmeester) waarin het kleurenwiel op de kaart laat zien welke kleuren gevraagd worden. De kleuren wisselen per keer.
- **Kleurenlesje**: elke opdracht heeft een kort lesje. Bij kleuropdrachten staat het meteen open; na de jury volgt uitleg over jouw outfit en welke kledingstukken je kunt aanpassen.
- **Vrij spelen**: aankleden zonder jury, met een modeshow als finale.

## Nieuwe vriendjes en zelf kleding en sieraden maken

Bij **Extra → In je hand** vind je **Coco**, een beige knuffelkonijn met lange oren, en de nieuwe knuffels Bibi (beer, level 2), Lila (axolotl, level 3) en Bamboe (panda, level 5). Bij **Extra → Huisdier** komen Pip (hamster), Moos (schildpad, level 2), Ollie (otter, level 4) en Prik (egeltje, level 6). Coco en Pip zijn gratis beschikbaar voor nieuwe én bestaande spelers; de overige vriendjes gebruiken de bestaande cadeaus en winkel. Je kunt tegelijk een knuffel vasthouden en een huisdier meenemen.

Open **✂️ Zelf maken** via het dorpsmenu, het kleedkamermenu of bovenaan een kledingcategorie. Het naaiatelier is gratis vanaf level 1:

- Kies een top, broek of rok, jurk, schoenen of hakjes, iets op je hoofd of oorbellen, met in totaal 34 vormen. Op je hoofd: haarband, grote strik, tiara, kroon, muts, baret, katten- en konijnenoortjes. Oorbellen: knopjes, ringen, hartjes, sterretjes, bloemetjes, parels en hangers.
- Kies een hoofdkleur en patroonkleur, uit de kleurvakjes of met de vrije kleurkiezer. Er zijn tien stofkeuzes, waaronder effen, strepen, bloemen, glitter en regenboog.
- Bij hoofdjes en oorbellen kleurt de tweede kleur de steentjes en versiering. Oorbellen kunnen effen, glitter of regenboog zijn; stickers zijn er alleen voor kleding en schoenen. In de kast staan oorbellen bij **Sieraden → Oorbellen**; Parelknopjes heb je meteen, vier andere komen in de winkel vanaf level 2.
- Voeg maximaal vijf stickers toe. Kies een geplakte sticker om de plaats, grootte en draaiing met schuifjes aan te passen. De stickers blijven op de stof; bij schoenen komen ze op beide schoenen.
- Geef je kleding een naam en kies **Opslaan & aantrekken**. Het ontwerp staat daarna ook in de gewone kledingkast en werkt bij de jury, foto’s, duels en races.
- Bij **Mijn ontwerpen** kun je een ontwerp opnieuw openen en aanpassen, of **Bewaar als nieuw** kiezen voor een variant. Iedere speler heeft een eigen collectie van maximaal 60 ontwerpen. Een onafgemaakt ontwerp blijft als werkversie bewaard bij teruggaan en herladen, zolang browseropslag beschikbaar is.

Op telefoons blijven het voorbeeld en de bewaarknop zichtbaar terwijl je door de werktafel scrolt. Ontwerpen veranderen je gedragen outfit pas na opslaan. Een mislukte opslag toont een melding en behoudt je eerdere ontwerp.

De ontwerpregels staan in `js/clothing-designs.js`, het atelier in `js/designer.js` en `css/designer.css`. Controleer regels en migratie met `node tools/test-designs.js`. Met een lokale server: `playwright-cli -s=atelier open http://127.0.0.1:4173 --browser=chrome`, daarna `playwright-cli -s=atelier run-code --filename=tools/test-designer-browser.js`. Deze test gebruikt een afzonderlijke browsercontext. `tools/preview-designs.html` toont alle nieuwe vriendjes en kledingvormen voor visuele controle; `tools/preview-accessories.html` toont de hoofdjes, oorbellen en hakjes op verschillende kapsels.

## Een gezellig dorp om te ontdekken

De grotere wereld is 2480 × 1760 wereldpixels. De camera volgt je model; huizen en de vijver blokkeren de doorgang, de brug is begaanbaar. Je kunt ook over het gras wandelen. Gebouwen, bewoners en zoekvoorwerpen hebben een eigen plek. Klikken op een verre plek laat je erheen lopen. Kaart, dorpsboek en menu pauzeren het wandelen; pijltjes of WASD onderbreken een gekozen route. De wandelpositie wordt per speler bewaard. Spelers van de oude kaart beginnen op het nieuwe Modeplein met behoud van hun kleding en voortgang.

| Gebouw | Wat je er doet |
| --- | --- |
| Modehuis | Aankleden, modeopdrachten, jury en vrij spelen |
| Naaiatelier | Eigen kleding, hakjes, hoofdjes en oorbellen ontwerpen, dragen en aanpassen |
| Sterrenwinkel | Spullen kopen met een rekenvraag |
| Kleurenhuis | Kleurcombinaties oefenen met de jury |
| Spiegelsalon | Je model, kapsel en uiterlijk aanpassen |
| Duelhuis | Met twee spelers een modeduel spelen |
| Weer & Winkelhuis | Aankleden voor het weer en slim winkelen met een beetje geld |
| Raceclub | De vijf bestaande raceparcoursen |
| Binnenspeeltuin | De bestaande springbaan en trampoline |
| Fotostudio | Een decor kiezen en je outfit als foto bewaren |
| Knuffelhuis | Huisdier en knuffel kiezen; aaien, water geven en spelen |
| Sterrenclub | Twaalf pijlen op het ritme aantikken |
| Rozenzaal | Vier steeds langere reeksen danspassen onthouden en nadoen |

De Sterrenclub beloont 10–12 goede passen met drie sterren, 6–9 met twee en 1–5 met één. Je hebt ongeveer 0,43 seconde aan elke kant van de tel; per tel telt maximaal één poging. De Rozenzaal heeft reeksen van drie tot zes passen, met onbeperkt opnieuw kijken. Na alle vier reeksen krijg je drie sterren bij maximaal twee vergissingen, twee bij maximaal vijf, anders één. Dansen pauzeert bij tab- of vensterwissel, met P/Escape of de pauzeknop. Je kunt beide spellen opnieuw spelen; records blijven per speler bewaard. Het Knuffelhuis geeft één verzorgingsbeloning per huisdier; daarna kun je je vriendje blijven verzorgen.

Fleur vraagt om drie bloembakken water te geven. Noor wil feestlintjes laten bezorgen bij het Naaiatelier, de Sterrenclub en de Rozenzaal. Bo zoekt vijf gouden knopen in het dorp. Neem een opdracht aan via de bewoner of het dorpsboek. Je paspoort verzamelt automatisch dertien stempels door gebouwen te bezoeken. Met **Wijs de weg** krijg je hulp bij je volgende bestemming. Iedere dorpsopdracht beloont één keer sterren, XP en munten; herladen geeft geen tweede beloning. Er zijn geen tijdslimieten of dagelijkse verplichtingen.

`js/town-rules.js` bevat kaart, routes, opdrachten en dansregels. `js/village-art.js` tekent het dorp; `js/world.js` regelt lopen en interacties. `js/town-activities.js` verzorgt de nieuwe binnenactiviteiten. `node tools/test-town.js` controleert alle deuren, routes, de brug, opslag, opdrachten en dansregels. De browsertest is `playwright-cli -s=town run-code --filename=tools/test-town-browser.js` met het spel in die browsersessie geopend; deze test gebruikt een eigen context.

## Raceparkours

Het kleuratelier vervangt de losse quiz en bonusvraag. Kies het via het Kleurenhuis of de knop **🎨 Kleuratelier**. Met **Volgende opdracht** blijf je bij hetzelfde soort kleurdoel; **Gewone opdrachten** brengt je terug naar de gewone modeshows. De hoofdkleur per item telt, neutrale kleuren mogen erbij, en minstens één top, broek, rok of jurk moet een doelkleur hebben. De kleurregels en haalbaarheid staan in `js/color-challenges.js`; controleer ze met `node tools/test-colors.js`.

Open **🏁 Raceparkours** in het dorp, of **🏁 Parkours** in de kleedkamer. Kies een baan en pas in de racekast je outfit aan; je gebruikt de kleding die je bezit. Papa heeft bij zijn race een eigen outfit uit dezelfde kast.

| Baan | 3 sterren | 2 sterren | 1 ster | Uitdaging |
| --- | --- | --- | --- | --- |
| Te laat voor school | 20 s | 29 s | 42 s | Twee oversteekplaatsen; een auto raken geeft 5 seconden stilstand |
| Samen naar de gym | 11 s | 16 s | 25 s | Doolhof, verkeerde afslagen en twee rennende vriendinnen |
| Sneller dan papa | 13 s | 18 s | 27 s | Automatisch lopen, herhaald tikken/Enter voor sprintenergie |
| Voor de bui thuis | 21 s | 30 s | 44 s | Over plassen en lage hekjes springen; geraakt worden geeft 2 seconden stilstand |
| Tikkertje op het gras | 14 s | 22 s | 34 s | Vijf vlaggen op volgorde, bewegende vriendinnen ontwijken en finishen |

De grenzen zijn inclusief. Na de 1-sterlimiet stopt de poging zonder beloning. Een finish geeft XP, munten en sterren via de bestaande levelcurve; records en papa’s outfit worden per speler bewaard. De plaats in een race wordt apart vermeld: de eigen tijd bepaalt de sterren.

De snelheidsbonus is maximaal 40%: bovenkleding weegt 25%, onderkleding 25%, schoenen 35% en accessoires 15%. Een jurk telt voor boven en onder. Sneakers scoren beter dan hakjes, sportkleding helpt en zware accessoires remmen af. Accessoires worden gemiddeld; zonder accessoires is de score 6/10. Huidskleur, kapsel en postuur veranderen de snelheid niet.

Besturing: pijltjes/WASD of schermpijlen; spatie/Spring voor een sprong; Enter/Sprint herhaald indrukken bij papa. Ingedrukt houden van Enter telt niet als extra tikken. P/Escape of de pauzeknop pauzeert; bij venster- of tabwissel pauzeert de race automatisch. Sprongen hebben een korte hersteltijd en werken niet over auto's of heggen.

`js/parkour-rules.js` bevat parcoursen, scores en simulatie. `js/parkour.js` verzorgt de schermen, bediening en canvas. Controleer regels en beloningen met `node tools/test-parkour.js`. `tools/preview-parkour.html` is een aparte speeltest met een profiel in geheugen, zonder echte opslag te wijzigen.

## Binnenspeeltuin

Open **🛝 Binnenspeeltuin** in het dorp. Er zijn twee spelletjes in een speelhal met een ballenbak, regenboog, klimmuur en klimrek met glijbaan:

| Spel | Hoe het werkt | Sterren |
| --- | --- | --- |
| 🧱 Springbaan | Je rent vanzelf. Spring over schuimblokken, pionnen en rollende strandballen; bij een hoge toren spring je in de lucht nog een keer (dubbele sprong). Drie hartjes; elke botsing kost er één. Onderweg hangen boogjes sterren op springhoogte. Elke ronde is een nieuwe, willekeurige baan van ongeveer 21 seconden. | 1 voor de finish, +1 als je niets raakt, +1 voor minstens 60% van de sterren |
| 🤸 Trampolinesterren | 40 seconden stuiteren. Druk op Spring als je de mat raakt (vlak ervoor of tijdens het indeuken), dan ga je een niveau hoger (max. 5); niet of te vroeg drukken laat je zakken. Stuur met links/rechts naar de sterren. Een ster die 7 seconden niet gepakt wordt, verschijnt ergens anders. De springknop licht geel op op het goede moment. | 25 / 15 / 6 gevangen sterren |

Besturing: spatie, pijltje omhoog, W, de Spring-knop of (bij de springbaan) tikken op het speelveld; links/rechts met pijltjes, A/D of de schermknoppen. P/Escape pauzeert; bij tab- of vensterwissel pauzeert het spel vanzelf. Sterren geven XP, munten en sterren via de bestaande levelcurve (`speeltuin_springbaan` en `speeltuin_trampoline`); het record (meeste gevangen sterren) wordt per speler bewaard. Bij de springbaan telt een record alleen als je de finish haalt.

`js/speeltuin-rules.js` bevat de regels en simulatie, `js/speeltuin.js` de schermen, bediening en canvas. `node tools/test-speeltuin.js` controleert sprongen, hartjes, timing en de sterrengrenzen met bots (een perfecte speler, een kind met slordige timing, alleen sturen en alleen rammelen: rammelen of alleen sturen levert hooguit één ster op). `tools/test-speeltuin-browser.js` speelt beide spelletjes echt uit in de browser en controleert beloning, opslag, de telefoonindeling, aanraken en pauze:

```powershell
playwright-cli -s=speeltuin open http://127.0.0.1:4173 --browser=chrome
playwright-cli -s=speeltuin run-code --filename=tools/test-speeltuin-browser.js
playwright-cli -s=speeltuin close
```

## Kleden voor het weer en winkelen met een budget

Via **🌦️ Weer & budget** in het dorp of de kleedkamer kies je gericht een scenario. Elk scenario heeft een lesje, concrete kledingcriteria en een kleurentip. Alle criteria gehaald met een complete outfit geeft drie sterren. De bestaande jury deelt XP en munten uit; persoonlijke scores blijven bewaard.

| Weerscenario | Vanaf level | Wat je oefent |
| --- | --- | --- |
| Frisse schoolochtend, 9 °C | 1 | Warme bovenkant, lange broek, dichte schoenen |
| Picknick in de zon, 27 °C | 2 | Luchtige kleding, lichte schoenen, pet of zonnehoed |
| Uitwaaien op het strand, 13 °C | 3 | Bedekkende kleding; geen losse hoed of paraplu |
| Sneeuwpret | 4 | Warme kleding, lange broek, laarzen en muts |
| Regen naar de bibliotheek | 6 | Regenjas of paraplu, lange broek en regenlaarzen |

| Budgetscenario | Bestedingsgrens | Maximaal nieuwe spullen |
| --- | --- | --- |
| Terug naar school | 30 munten | 2 |
| Verjaardagsfeest | 40 munten | 2 |
| Sportdag | 35 munten | 2 |
| Zomeruitje (vanaf level 2) | 45 munten | 3 |
| Eén nieuwe blikvanger | 25 munten | 1 |

De bestedingsgrens is geen extra geld: aankopen gebruiken de eigen spelmunten. Hergebruik is gratis en niets kopen mag. Alle aankopen tijdens de opdracht tellen mee, ook als je ze niet draagt. Rekenbonussen vergroten de bestedingsgrens niet. De winkel blokkeert aankopen boven het bedrag of aantal. De kassabon blijft bij herladen en opnieuw openen van dezelfde opdracht bewaard; een volgende opdracht begint met een nieuwe kassabon. Eerdere aankopen blijven eigendom, zonder terugbetaling.

Controle: `node tools/test-learning.js` (weercriteria, haalbaarheid per level, budgetgrenzen, hergebruik en opslag). De regels staan in `js/learning-challenges.js` en de tien scenario’s in `js/data.js`.

## Illustraties van het spel

Het poppetje, het dorp en de decors komen uit de illustraties van *Sterreneiland* (`styling inspo.zip`). Het poppetje is een 3D-achtige pop die uit losse lagen wordt opgebouwd: elke laag is een grijze uitsnede uit `assets/doll.png` die in het spel met een kleur wordt vermenigvuldigd. Zo krijgen huid, ogen, haar en elk kledingstuk hun eigen kleur, met de schaduwen van de illustratie erin. Hoedjes, brillen, sieraden, tassen, spulletjes, vleugels en huisdieren zijn emoji (in de gekozen kleur) of kleine getekende vormpjes, geplaatst op de ogen-, mond- en handposities uit het manifest.

De decors zijn uitsneden uit de wereldillustraties (`assets/bg/`), soms met een sfeerlaag (nacht, regen, slingers), of worden in dezelfde zachte stijl getekend (`js/bg.js`). Het grotere dorp heeft een eigen SVG-illustratie met winkelpanden, bomen, paden, parkjes en een vijver. De illustratie en het loopraster gebruiken dezelfde gebouwcoördinaten; de oude kaart in `assets/village.jpg` blijft als oorspronkelijke referentie aanwezig.

Het ijspaleis, de balzaal en de disco en alle plaatjes van de binnenspeeltuin (`assets/speeltuin/`: de speelhal en de blokken, bal, pion, ster en trampoline) zijn in Blender gebouwd en gerenderd, in een zachte speelgoedstijl die bij de illustraties past. Zie *Blender-decors* hieronder.

## Mobiele portrettest

De Playwright-CLI is te installeren met `npm install -g @playwright/cli@latest` ([officiële installatie](https://playwright.dev/docs/getting-started-cli)). Start de game lokaal in een aparte terminal:

```powershell
py -3 -m http.server 4173 --bind 127.0.0.1
```

Voer daarna de mobiele regressietest uit:

```powershell
playwright-cli -s=portrait open http://127.0.0.1:4173 --device="Pixel 7" --browser=chrome
playwright-cli -s=portrait run-code --filename=tools/test-mobile-portrait.js
playwright-cli -s=portrait close
```

Voor WebKit: `playwright-cli install-browser webkit`, open daarna met `--device="iPhone SE" --browser=webkit` en voer hetzelfde testbestand uit. De test gebruikt een eigen browsercontext met touch, zonder bestaande spelers te wijzigen. Hij controleert 320 × 568, 375 × 667 en 412 × 839: het model blijft in beeld bij scrollen door de kast, de juryknop heeft eigen ruimte, menu en opdrachtuitleg zijn bereikbaar en de racebediening past onder het vergrote speelveld. Ook hoge vensters, terugkeer naar het dorp, achtergronden, springen en pauzeren worden gecontroleerd. In Chromium wordt springen met twee gelijktijdige vingers getest; WebKit controleert een gewone aanraking.

De uitgebreide speeltest van 26 september 2026 staat lokaal in `test-results/mobile-portrait/report.md`, met screenshots en JSON-resultaten. Testuitvoer en tijdelijke CLI-bestanden worden niet door Git bijgehouden.

De daaropvolgende mobiele indeling staat beschreven in `test-results/mobile-ui/report.md`. In portretstand scroll je alleen door de kledingkast. Tik op **Uitleg** voor de volledige opdracht, kleurenles en andere spelkeuzes; **Menu** bevat de winkel, spelmodi, voortgang en instellingen. Races gebruiken een camera die aan de schermverhouding wordt aangepast; doolhof en tikkertje hebben een kleine overzichtskaart.

## Projectstructuur

| Bestand | Wat erin zit |
| --- | --- |
| `index.html` | De pagina en de schermen |
| `css/style.css` | Stijl |
| `js/data.js` | Alle items, thema's, jury en levelcurve. Hier voeg je nieuwe spullen toe |
| `js/avatar.js` | Het model samenstellen uit de sprite-lagen; accessoires en make-up |
| `js/bg.js` | De decors (settings) |
| `js/world.js` | Het dorp: lopen, deuren, bewoners, kaart en dorpsboek |
| `js/town-rules.js`, `js/village-art.js` | Dorpskaart, botsingen, routes, opdrachten, dansregels en illustraties |
| `js/town-activities.js` | Disco, balzaal, Knuffelhuis en Fotostudio |
| `js/speeltuin-rules.js`, `js/speeltuin.js` | Binnenspeeltuin: regels en scherm van de Springbaan en de Trampoline |
| `js/game.js` | Spellogica: profielen, kleedkamer, beoordeling, voortgang |
| `assets/` | Gegenereerd: sprite-atlas, manifest, dorpskaart, decors |
| `tools/build-assets.py` | Maakt `assets/` uit de illustraties van de zip |
| `tools/blender/` | Blender-scripts voor de gerenderde decors en de speeltuinplaatjes |
| `build-artifact.js` | Maakt `dist/artifact.html` (zonder assets; alleen voor een snelle preview) |

## Een nieuw item toevoegen

De uitgebreide collectie bevat 6 extra haarkleuren, 72 kledingstukken in 12 combineerbare collecties, 6 wijde pijpenbroeken, 6 paar hakjes en 25 accessoires. Ze gebruiken de bestaande levels (1–20), cadeaus en winkel. Bestaande spelers vinden beschikbare nieuwe items in de Sterrenwinkel; nieuwe spelers beginnen ook met de nieuwe level-1-items. De losse haarverlengingen zijn verwijderd; opgeslagen outfits gebruiken automatisch weer het bijbehorende oorspronkelijke kapsel. `tools/preview-tailoring.html` toont de wijde broeken en hakjes op volledige modellen bij verschillende posturen. `tools/preview-expansion.html` toont alle nieuwe miniaturen en controleert het samenstellen van de modellen; voeg `?accessories` toe voor alleen accessoires.

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

### Blender-decors

De gerenderde plaatjes worden door scripts in `tools/blender/` opgebouwd (gedeelde vormen, materialen, licht en renderinstellingen in `lib.py`). Ze draaien in een losse Blender-instantie, dus een geopend Blender-bestand blijft onaangeroerd:

```powershell
& "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe" -b --factory-startup --python tools/blender/disco.py -- render
```

| Script | Maakt | Kopieer naar |
| --- | --- | --- |
| `ijspaleis.py`, `balzaal.py`, `disco.py` | `<naam>.jpg` (480 × 720) | `assets/bg/` |
| `speeltuin-hal.py` | `speeltuin-hal.jpg`: naadloos herhalende strook van de speelhal | `assets/speeltuin/hal.jpg` |
| `speeltuin-sprites.py` | `<naam>-klein.png` met doorzichtige achtergrond | `assets/speeltuin/<naam>.png` |

Elk script schrijft ook een `.blend` en een grote PNG in de uitvoermap, om in Blender verder te kijken. Getest met Blender 5.1 (Eevee).
