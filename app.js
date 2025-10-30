// Lyssnar på DOMContentLoaded—när sidan är redo kör jag igång och sätter min TheMealDB-bas-URL som allt hämtas från.
document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "https://www.themealdb.com/api/json/v1/1/";

    /* Jag plockar ihop alla mina DOM-element i ett objekt som jag kallar “els”.
   Jag hämtar varje element med document.getElementById sen skriver det Id:t som står i min HTML kod.
   Jag ger den ett kort namn för att använda i koden.
   meals är rutnätet med alla receptrutor.
   details är detaljvy när man klickar på ett recept.
   status är där ja skriver  “Laddar…” antal recept mm.
   search är själva sökfältet.
   searchBtn är knappen bredvid söket.
   chips är snabbfiltren: Alla, Kyckling, Sallad.
   toTopBtn är knappen som scrollar upp.
   Om ett id skulle saknas i HTML blir värdet null, men i min sida finns alla.*/

    const els = {
        meals: document.getElementById("mealsContainer"),
        details: document.getElementById("mealDetails"),
        status: document.getElementById("status"),
        search: document.getElementById("searchInput"),
        searchBtn: document.getElementById("searchBtn"),
        chips: document.getElementById("quickFilters"),
        toTopBtn: document.getElementById("scrollTopBtn"),
    };

    /* Här sparar jag datan jag jobbar med:
    ALL_MEALS = alla recept jag hämtar från API:t.
    CURRENT_VIEW = det som visas just nu i grid (ändras när man söker och av snabbfiltret).
    setStatus = det är en liten hjälp som skriver text i #status över listan.
    Jag skickar in t.ex. "Laddar recept …" eller "Visar X recept."
    Om jag inte skickar något blir det tomt */
    let ALL_MEALS = [];
    let CURRENT_VIEW = [];

    const setStatus = (msg = "") => (els.status.textContent = msg);

    /* Här har jag gjort en lista med översättningar från svenska till engelska ord.
Jag vill att man ska kunna söka på svenska men ändå få träffar.
 Exempel om jag skriver  “kyckling” så översätts det till “chicken” innan sökningen körs.
 Varje ord till vänster (svenska) matchas med sitt engelska ord till höger. */
    const svToEn = {
        kyckling: "chicken",
        sallad: "salad",
        fisk: "fish",
        dessert: "dessert",
        pasta: "pasta",
        gryta: "stew",
        soppa: "soup",
        biff: "beef",
        kaka: "cake",
        vegetarisk: "vegetarian",
        lax: "salmon",
        räka: "shrimp",
        räkor: "shrimp",
        potatis: "potato",
        ris: "rice",
    };

    /* I denna funktion så kollar man om jag skrivit ett svenskt ord i sökfältet.
    Först gör jag allt till små bokstäver via toLowerCase.
    Sen loopar jag igenom min lista “svToEn” och kollar efter om sökordet innehåller något av de svenska orden.
    Om det gör det så byter jag ut det svenska ordet mot det engelska.
    Om inget svenskt ord finns så returnerar jag bara det jag skrev in som det är. */
    const translateSwedish = (q) => {
        const lower = (q || "").toLowerCase();
        for (const [sv, en] of Object.entries(svToEn)) {
            if (lower.includes(sv)) return lower.replace(sv, en);
        }
        return lower;
    };

    /* Här plockar jag ut alla ingredienser från ett recept.
    TheMealDB har 20 möjliga ingrediens-fält.
    Jag loopar från 1 till 20 och hämtar varje ingrediens om den finns.
    .trim() tar bort extra mellanslag och toLowerCase() gör allt till små bokstäver.
    Om ingrediensen finns lägger jag in den i min lista “out”.
  Till sist då så returnerar jag listan med alla ingredienser som finns i receptet. */
    const extractIngredients = (m) => {
        const out = [];
        for (let i = 1; i <= 20; i++) {
            const ing = (m["strIngredient" + i] || "").trim();
            if (ing) out.push(ing.toLowerCase());
        }
        return out;
    };


/* Den här funktionen fixar listan med ingredienser som visas i receptdetaljerna.
Använder då for loopar från 1 till 20 och hämtar både ingrediensen och mängden.
.trim() tar bort onödiga mellanslag.
Om ingrediensen finns så lägger jag ihop den med sin mängd typ “pasta – 200 g”.
Alla läggs in i listan dvs, “lines”.
Sen slår jag ihop listan till en text med radbrytningar så allt visas snyggt under “Ingredienser” på sidan. */
    const ingredientListText = (m) => {
        const lines = [];
        for (let i = 1; i <= 20; i++) {
            const ing = (m["strIngredient" + i] || "").trim();
            const meas = (m["strMeasure" + i] || "").trim();
            if (ing) lines.push(`${ing}${meas ? " – " + meas : ""}`);
        }
        return lines.join("\n");
    };

/*Den här funktionen visar själva receptrutorna.
Först gömmer jag detaljrutan om den råkar vara öppen,
och ser till att listan med recept syns igen.
Sen tömmer jag innehållet i mealsContainer så jag börjar med en tom yta.
Om listan “meals” är tom, alltså att inga recept hittades,
då skriver jag ut ett meddelande: “Inga recept hittades.” och avslutar funktionen efter de. */
    const renderCards = (meals) => {
        els.details.classList.add("hidden");
        els.meals.classList.remove("hidden");
        els.meals.innerHTML = "";

        if (!meals.length) {
            els.meals.innerHTML = "<p>Inga recept hittades.</p>";
            return;
        }

/* Här bygger jag upp alla receptrutor som heter cards som ska visas på sidan.
Skapade ett “fragment” – det är som en tillfällig box där jag kan lägga allt innan jag lägger in det i sidan.
Sen använder jag for loopar igenom varje recept i listan “meals”:
Sen skapar ett nytt article-element som blir själva receptrutan.
Jag lägger in bild, titel och lite info om rätten (typ kategori och land).
Om bilden saknas så visar jag en reservbild.
Jag lägger även till en klick-funktion som öppnar detaljerna när man trycker på rutan.
När alla receptrutor är klara lägger jag in hela fragmentet i min grid, els.meals. */
        const frag = document.createDocumentFragment();
        for (const m of meals) {
            const card = document.createElement("article");
            card.className = "card";
            card.innerHTML = `
        <img src="${m.strMealThumb || "https://via.placeholder.com/600x400?text=No+Image"}" alt="${m.strMeal}">
        <h3>${m.strMeal}</h3>
        <p class="meta">${m.strCategory || ""} ${m.strArea ? "• " + m.strArea : ""}</p>
      `;
            card.addEventListener("click", () => showDetails(m));
            frag.appendChild(card);
        }
        els.meals.appendChild(frag);
    };

/* Den här funktionen visar detaljsidan för ett recept när man klickar på en receptruta.
Ja gömmer listan med alla recept,meals, och visar istället detaljrutan, details.
Sen fyller jag detaljrutan med information om det receptet jag klickade på:
Rubriken, bild, kategori, ingridienserna, instruktionen, och tillbaka knappen.
Så när man klickar på tillbaka knappen så göms detaljrutan, listan med alla recept visas då igen
och sidan scrollas upp till toppen av recepten. */
    const showDetails = (m) => {
        els.meals.classList.add("hidden");
        els.details.classList.remove("hidden");
        els.details.innerHTML = `
      <h2>${m.strMeal}</h2>
      <img src="${m.strMealThumb || 'https://via.placeholder.com/600x400?text=No+Image'}" alt="${m.strMeal || 'Meal image'}">
      <p class="meta"><strong>Kategori:</strong> ${m.strCategory || "-"} • <strong>Area:</strong> ${m.strArea || "-"}</p>
      <h3>Ingredienser</h3>
      <pre class="instructions">${ingredientListText(m) || "–"}</pre>
      <h3>Instruktioner</h3>
      <pre class="instructions">${m.strInstructions || "–"}</pre>
      <button class="backBtn">⬅ Tillbaka</button>
    `;
        els.details.querySelector(".backBtn").addEventListener("click", () => {
            els.details.classList.add("hidden");
            els.meals.classList.remove("hidden");
            window.scrollTo({
                top:
                    document.querySelector(".hero").offsetTop +
                    document.querySelector(".hero").offsetHeight,
                behavior: "smooth",
            });
        });
    };

    /* Här har jag två typ hjälpfunktioner.
    sleep, som är paus som väntar antal sek innan den går vidare.
    Jag använder den när jag hämtar många recept så det inte blir för många anrop på en gång.
    fetchJSON används för att hämta data från API:t jag valt.
    Jag lägger då ihop min URL med det jag skickar in och hämtar datan med await fetch.
    Om svaret inte är okej så blir de ett felmeddelande.
    Annars returnerar jag svaret som ett vanligt JS-objekt */
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    async function fetchJSON(endpoint) {
        const res = await fetch(API_BASE + endpoint, { mode: "cors" });
        if (!res.ok) throw new Error(res.status + " " + res.statusText);
        return res.json();
    }

/* Den här funktionen hämtar alla recept från TheMealDB.
Först visar jag i statusfältet att recepten laddas.
Sedan hämtar jag de första recepten via fetchJSON som ger mig en grund lista.
ALL_MEALS sparar alla recept jag får tillbaka, alltså min stora lista.
CURRENT_VIEW kopierar samma lista så jag kan visa den direkt.
Jag uppdaterar statusfältet med hur många recept som hittats hittills och visar dem på sidan.
La även in att om något går fel typ att API:t skulle krångla tar felet i catch och jag skriver ut ett felmeddelande.
Visar också texten “Kunde inte hämta startlistan. Försöker A–Ö i själva statusfältet. */
    async function fetchAllMeals() {
        try {
            setStatus("Laddar recept …");
            const start = await fetchJSON("search.php?s=");
            ALL_MEALS = (start.meals || []).slice();
            CURRENT_VIEW = [...ALL_MEALS];
            setStatus(`Visar ${CURRENT_VIEW.length} recept … fyller på A–Ö …`);
            renderCards(CURRENT_VIEW);
        } catch (e) {
            console.error(e);
            setStatus("Kunde inte hämta startlistan. Försöker A–Ö …");
        }

/* Här hämtar jag fler recept genom att köra bokstav för bokstav, A till Ö.
TheMealDB gör att ja kan söka via första bokstaven.
Så först gör jag en lista med alla bokstäver (a–z).
Sedan skapar jag “seen”, alltså en lista med id:n på de recept jag redan laddat,
så att jag inte får dubbelt upp.
Sen loopar jag igenom varje bokstav:
Först väntar 180 ms mellan varje,sleep. Hämtar då alla recept som börjar på den bokstaven.
Lägger till dem i ALL_MEALS om de inte redan finns.
och om det kom in nya recept så uppdaterar jag sidan med renderCards()
Sen visas statusen med hur många recept som laddats totalt.
Om något fel händer vid en bokstav så hoppar jag bara över den och skriver ut ett varningsmeddelande.
Om inga recept hittades alls skriver jag “Inga recept kunde hämtas.”
Annars visar jag bara “Klart: antal recept.” */
        const letters = "abcdefghijklmnopqrstuvwxyz".split("");
        const seen = new Set(ALL_MEALS.map((m) => m.idMeal));
        for (const l of letters) {
            try {
                await sleep(180);
                const r = await fetchJSON("search.php?f=" + l);
                const arr = r.meals || [];
                let added = 0;
                for (const m of arr) {
                    if (!seen.has(m.idMeal)) {
                        seen.add(m.idMeal);
                        ALL_MEALS.push(m);
                        added++;
                    }
                }
                if (added) {
                    CURRENT_VIEW = [...ALL_MEALS];
                    setStatus(`Laddat totalt: ${ALL_MEALS.length} recept.`);
                    renderCards(CURRENT_VIEW);
                }
            } catch (e) {
                console.warn("Hoppar bokstav", l, e.message);
            }
        }
        if (!ALL_MEALS.length) setStatus("Inga recept kunde hämtas.");
        else setStatus(`Klart: ${ALL_MEALS.length} recept.`);
    }

/* Så, den här funktionen körs när man söker efter något.
Först skickar jag in det man skrivit till min translateSwedish-funktion
så att svenska ord översätts till engelska.
Om sökfältet är tomt så visar jag alla recept.
Om inte så filtrerar jag ut de recept där sökordet finns i.
Dvs, namnet på rätten, kategorin och landet/området.
.toLowerCase() gör att sökningen inte bryr sig om stora eller små bokstäver.
Till slut uppdaterar jag statusfältet med hur många recept som matchade,
och visar resultatet med renderCards(CURRENT_VIEW). */
    const applySearch = (q) => {
        q = translateSwedish(q);
        if (!q) CURRENT_VIEW = [...ALL_MEALS];
        else {
            CURRENT_VIEW = ALL_MEALS.filter(
                (m) =>
                    (m.strMeal || "").toLowerCase().includes(q) ||
                    (m.strCategory || "").toLowerCase().includes(q) ||
                    (m.strArea || "").toLowerCase().includes(q)
            );
        }
        setStatus(`Visar ${CURRENT_VIEW.length} recept.`);
        renderCards(CURRENT_VIEW);
    };

    /* Här har jag gjort alla knapparna under sökrutan.
    Varje rad här bestämmer vad som ska visas när man klickar på en av dom.
    De kollar olika saker i varje recept och returnerar true eller false.
    all visar då allt och returnerar då alltid true.
    kyckling visar recept där namnet är "chicken" eller "kyckling".
    sallad visar recept med "salad" eller "sallad" i namnet.
    vegetarisk visar recept som har kategorin "vegetarian"
    allt de som inte innehåller ord som kött, fisk, bacon osv.
    dessert visar allt som är kategorin dessert eller har ord som cake,cookie,sweet i namnet.
    glutenfritt, där hämtar jag alla ingredienser via "extractIngredients",
    samt kollar att inga ord som flour,bread, pasta osv (som är gluten) finns.
    laktosfritt blir samma grej, men jag kollar efter ord som milk, cheese, butter.
    Om inga sådana finns så räknas receptet som laktosfritt. */
    const NAME_FILTERS = {
        all: () => true,
        kyckling: (m) => /(chicken|kyckling)/i.test(m.strMeal),
        sallad: (m) => /(salad|sallad)/i.test(m.strMeal),
        vegetarisk: (m) => {
            if ((m.strCategory || "").toLowerCase() === "vegetarian") return true;
            const name = (m.strMeal || "").toLowerCase();
            const nonVeg =
                /(beef|pork|lamb|chicken|fish|salmon|tuna|shrimp|prawn|bacon|ham|turkey)/i;
            return !nonVeg.test(name);
        },
        dessert: (m) =>
            (m.strCategory || "").toLowerCase() === "dessert" ||
            /(dessert|cake|tart|pie|brownie|cookie|pudding|ice|mousse|sweet)/i.test(
                m.strMeal || ""
            ),
        glutenfritt: (m) => {
            const ings = extractIngredients(m);
            const glutenWords =
                /(wheat|flour|bread|pasta|noodle|tortilla|oat|barley|rye|breadcrumbs|panko|couscous|semolina|naan|wrap|pastry|cracker|soy sauce|graham)/i;
            return !ings.some((i) => glutenWords.test(i));
        },
        laktosfritt: (m) => {
            const ings = extractIngredients(m);
            const dairyWords =
                /(milk|cream|cheese|butter|yoghurt|yogurt|mascarpone|ricotta|mozzarella|paneer|kefir|custard|condensed milk|evaporated milk|sour cream|crème fraîche|creme fraiche|ghee)/i;
            return !ings.some((i) => dairyWords.test(i));
        },
    };


    /* Denna funktionen körs när jag klickar på ett snabbfilter så som "kyckling" osv. (som är chip).
    Så här gör jag:
    Jag tar bort "active"-klassen från alla chips så bara ett kan vara valt.
    Jag hittar knappen jag klickade på (data-filter="key") och sätter den till active.
    Jag plockar rätt filter-funktion från NAME_FILTERS via nyckeln (annars = all).
    Jag filtrerar ALL_MEALS med den funktionen och sparar resultatet i CURRENT_VIEW.
    Jag uppdaterar status-texten så man ser hur många recept som visas och vilket filter.
    Jag ritar om listan på sidan med renderCards(CURRENT_VIEW). */
    const applyChipFilter = (key) => {
        [...els.chips.querySelectorAll(".chip")].forEach((b) =>
            b.classList.remove("active")
        );
        const activeBtn = els.chips.querySelector(`[data-filter="${key}"]`);
        if (activeBtn) activeBtn.classList.add("active");

        const fn = NAME_FILTERS[key] || NAME_FILTERS.all;
        CURRENT_VIEW = ALL_MEALS.filter(fn);
        setStatus(
            `Visar ${CURRENT_VIEW.length} recept (${
                key === "all" ? "alla recept" : key
            }).`
        );
        renderCards(CURRENT_VIEW);
    };


    /* Här kopplar jag ihop knapparna med vad som ska hända när man trycker:
    Klick på sökknappen så kör "sök med det som står i inputen".
    Man trycker Enter i sökrutan då kör samma sök.
    Klick på ett snabbfilter (matvalen, dvs chip) → nollställer sökrutan och filtrerar listan.
    e.target.closest("button[data-filter]") betyder att man letar upp närmaste knapp som har data-filter,
    så klick funkar även om man träffar ikonen/texten i knappen.
    btn.dataset.filter betyder att den plockar ut själva ordet (t.ex. "kyckling" eller "all"). */
    els.searchBtn.addEventListener("click", () => applySearch(els.search.value));
    els.search.addEventListener("keydown", (e) => {
        if (e.key === "Enter") applySearch(els.search.value);
    });

    els.chips.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-filter]");
        if (!btn) return;
        els.search.value = "";
        applyChipFilter(btn.dataset.filter);
    });

    // Detta är att man klickar på “Till toppen”-knappen och då scrollar sidan upp till sidans topp. Smooth står för mjukt.
    els.toTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // När sidan laddats klart körs funktionen fetchAllMeals() för att hämta alla recept från API:t.
    fetchAllMeals();
});


