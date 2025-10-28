document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "https://www.themealdb.com/api/json/v1/1/";

    const els = {
        meals: document.getElementById("mealsContainer"),
        details: document.getElementById("mealDetails"),
        status: document.getElementById("status"),
        search: document.getElementById("searchInput"),
        searchBtn: document.getElementById("searchBtn"),
        chips: document.getElementById("quickFilters"),
        toTopBtn: document.getElementById("scrollTopBtn"),
    };

    let ALL_MEALS = [];
    let CURRENT_VIEW = [];

    const setStatus = (msg = "") => (els.status.textContent = msg);

    /* ---------- SV -> EN för enkel sök ---------- */
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

    const translateSwedish = (q) => {
        const lower = (q || "").toLowerCase();
        for (const [sv, en] of Object.entries(svToEn)) {
            if (lower.includes(sv)) return lower.replace(sv, en);
        }
        return lower;
    };

    /* ---------- Helpers ---------- */
    const extractIngredients = (m) => {
        const out = [];
        for (let i = 1; i <= 20; i++) {
            const ing = (m["strIngredient" + i] || "").trim();
            if (ing) out.push(ing.toLowerCase());
        }
        return out;
    };

    const ingredientListText = (m) => {
        const lines = [];
        for (let i = 1; i <= 20; i++) {
            const ing = (m["strIngredient" + i] || "").trim();
            const meas = (m["strMeasure" + i] || "").trim();
            if (ing) lines.push(`${ing}${meas ? " – " + meas : ""}`);
        }
        return lines.join("\n");
    };

    /* ---------- Render ---------- */
    const renderCards = (meals) => {
        els.details.classList.add("hidden");
        els.meals.classList.remove("hidden");
        els.meals.innerHTML = "";

        if (!meals.length) {
            els.meals.innerHTML = "<p>Inga recept hittades.</p>";
            return;
        }

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

    const showDetails = (m) => {
        els.meals.classList.add("hidden");
        els.details.classList.remove("hidden");
        els.details.innerHTML = `
      <h2>${m.strMeal}</h2>
      <img src="${m.strMealThumb}" alt="${m.strMeal}">
      <p class="meta"><strong>Kategori:</strong> ${m.strCategory || "-"} • <strong>Area:</strong> ${m.strArea || "-"}</p>
      <p><em>OBS! Receptet visas på engelska eftersom datan hämtas från TheMealDB.</em></p>
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

    /* ---------- Fetch ---------- */
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    async function fetchJSON(endpoint) {
        const res = await fetch(API_BASE + endpoint, { mode: "cors" });
        if (!res.ok) throw new Error(res.status + " " + res.statusText);
        return res.json();
    }

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

    /* ---------- Sök & filter ---------- */
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

    /* ---------- Events ---------- */
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

    // Scrolla till toppen
    els.toTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    /* ---------- Start ---------- */
    fetchAllMeals();
});