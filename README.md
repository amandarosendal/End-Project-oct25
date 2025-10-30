/* Recept & Mat!
Använt mig av TheMealDB API.
Strukturen är skapad i HTML, styling i CSS och all funktionalitet i JavaScript.

Detta är en sida där man enkelt kan söka bland recept, både på svenska och engelska.
Man kan också klicka på mina snabbfilter som “Glutenfritt”, “Vegetariskt” osv.
När man klickar på en maträtt visas en detaljsida på receptet med ingredienser, instruktioner och bild.

JavaScript hämtade data från API:t, visar recepten som en stor grid-sida, finns sökfunktion, filter och “Till toppen”-knapp.
Använde fetch() för att hämta recepten, och async/await så sidan väntar på datan.
Jag har också byggt översättning så man kan söka på svenska ord (kyckling → chicken osv).
Jag ville att sidan skulle kännas ren, ljus och feminin, därför valde jag rosa, runda knappar och mjuka övergångar.

Funktioner som finns med:
Sök fritt på svenska/engelska.
Filtrera på kategori via “chips” (snabbfilter med olika namn).
Visa detaljer för de valda recept.
Scrolla smidigt tillbaka till toppen.
Smidigt att det finns en "tillbaka" knapp efter att man har gått in på varje recept.

Så jag har helt enkelt kombinerat API, DOM och styling för att bygga en hel webbsida.
Jag har skrivit kommentarer i koden för varje del, för att tydliggöra vad varje del gör.
*/
