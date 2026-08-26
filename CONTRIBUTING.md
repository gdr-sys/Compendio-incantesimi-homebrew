# Come contribuire aggiungendo nuovi incantesimi

Il Compendio include già tutti gli incantesimi presenti nel file SRD usato come base per l'app: non manca nulla rispetto a quella fonte. Gli incantesimi elencati più sotto sono invece **incantesimi aggiuntivi**, non compresi in quel file SRD di partenza, che si possono aggiungere al database per ampliarlo.

Le edizioni 2014 e 2024 restano due database distinti perché il testo di uno stesso incantesimo può cambiare tra le due versioni ufficiali: ogni scheda va compilata con il testo della sua edizione specifica, così come riportato nel manuale corrispondente.

## Regola fondamentale

Il database già presente nell'app (dentro `index.html`) non va mai modificato direttamente. I contributi si fanno esclusivamente aggiungendo nuove schede complete ai due file elencati sotto: sono nuove aggiunte, non correzioni a incantesimi già esistenti.

## I file dove aggiungere le schede

- [`data/da_aggiungere_2024.json`](data/da_aggiungere_2024.json) — incantesimi aggiuntivi per l'edizione 2024.
- [`data/da_aggiungere_2014.json`](data/da_aggiungere_2014.json) — incantesimi aggiuntivi per l'edizione 2014.

Questi due file partono vuoti (`[]`). Per contribuire, apri il file dell'edizione che vuoi compilare e aggiungi dentro le parentesi quadre una nuova scheda completa, seguendo l'esempio qui sotto. Non serve aggiungerle tutte insieme: va benissimo anche una sola scheda per pull request.

## Quali incantesimi mancano

Questo è un elenco indicativo (non necessariamente completo) di incantesimi che risultano presenti in un'edizione del database ma non nell'altra. Se un incantesimo che vuoi aggiungere non è in questa lista ma sai per certo che manca in un'edizione, puoi comunque contribuirlo.

**Servono per l'edizione 2024** (esistono già nel database come 2014):

Alterare Sé Stesso, Anti-individuazione, Arma Magica, Armatura del Mago, Aura Sacra, Bagliore Lunare, Bagliore Solare, Beffa Crudele, Blocca Animali, Blocca Mostri, Blocca Persone, Camminare nell'Etere, Cecità/Sordità, Dissolvi Magie, Fabbricare, Fantasia Devastante, Faro di Speranza, Fiamma Sacra, Guida, Invisibilità Maggiore, Luce del Giorno, Muro di Lame, Oscurità, Raggio Rovente, Rianimare Morti, Sogno.

**Servono per l'edizione 2014** (esistono già nel database come 2024):

Amicizia Animale, Anatema, Antipatia/Simpatia, Armatura Magica, Armatura di Agathys, Aura Santuario, Bastone Incantato, Benedizione, Bocca Magica, Buio, Calmare Emozioni, Camminare sull'Acqua, Campo Anti-magia, Camuffare Sé Stesso, Capanna di Leomund, Cerchio Magico, Comanda Vegetali, Comando, Comprendere i Linguaggi, Comunione con la Natura, Confusione, Contagio, Controincantesimo, Controllare Acqua, Controllare Tempo Atmosferico, Corsiero Fantasma, Danza Irresistibile di Otto, Dardo del Caos, Debolezza Mentale, Desiderio, Dissolvi Magia, Dominare Bestie, Dominare Mostri, Duello Vincolante, Esilio, Evoca Animali, Evoca Celestiale, Evoca Creature Boschive, Guardiano della Fede, Guarigione, Identificare, Ilarità di Tasha, Immagine Maggiore, Immagine Silenziosa, Immagine Speculare, Individuare i Pensieri, Individuare la Magia, Individuazione del Bene e del Male, Invisibilità, Leggenda, Lentezza, Luce, Maledire, Mani Brucianti, Occhio Arcano, Paura, Pietrificazione, Potenziamento, Produrre Fiamma, Protezione dal Bene e dal Male, Protezione dall'Energia, Punizione Infernale, Purificare Cibo e Bevande, Raggio di Indebolimento, Rimuovere Maledizione, Riparare, Riposo Inviolato, Scritto Illusorio, Scrutare, Scudo di Fuoco, Tocco Gelido.

## Come scrivere una scheda

Ogni incantesimo va scritto così, con tutti i campi già compilati (non lasciare campi vuoti o `null`):

```json
{
  "id": "extra_dissolvi_magia_2024",
  "nome": "Dissolvi Magia",
  "livello": 3,
  "edizione": "2024",
  "scuola": "Abiurazione",
  "tempo_lancio": "1 azione",
  "gittata": "36 metri",
  "durata": "Istantanea",
  "rituale": false,
  "concentrazione": false,
  "comp": { "v": true, "s": true, "m": false },
  "materiali": "",
  "classi": ["Bardo", "Chierico", "Druido", "Mago", "Paladino", "Stregone", "Warlock"],
  "descrizione": "Testo completo dell'effetto, dal manuale.",
  "livelli_superiori": "Testo del paragrafo Ai livelli superiori, se presente."
}
```

Significato dei campi:

| Campo | Cosa scrivere |
|---|---|
| `id` | Identificativo univoco e minuscolo, senza spazi o accenti, nel formato `extra_nome-incantesimo_edizione` (es. `extra_dissolvi_magia_2024`). Il prefisso è `extra_`, non `srd_`: questi incantesimi non provengono dal file SRD. |
| `nome` | Nome ufficiale italiano dell'incantesimo. |
| `livello` | Un numero da 0 (trucchetto) a 9, senza virgolette. |
| `edizione` | `"2014"` oppure `"2024"`, a seconda del file in cui stai scrivendo. |
| `scuola` | Una tra: `Abiurazione`, `Ammaliamento`, `Divinazione`, `Evocazione`, `Illusione`, `Invocazione`, `Necromanzia`, `Trasmutazione`. |
| `tempo_lancio` | Es. `"1 azione"`, `"1 azione bonus"`, `"1 reazione"`, `"1 minuto"`. |
| `gittata` | Es. `"9 metri"`, `"Contatto"`, `"Personale"`, `"Illimitata"`. |
| `durata` | Es. `"Istantanea"`, `"1 minuto"`, `"Concentrazione, fino a 10 minuti"`. |
| `rituale` | `true` se l'incantesimo può essere lanciato come rituale, altrimenti `false`. |
| `concentrazione` | `true` se richiede concentrazione, altrimenti `false`. |
| `comp.v` / `comp.s` / `comp.m` | `true` o `false` a seconda che richieda componente Verbale, Somatica, Materiale. |
| `materiali` | Se `comp.m` è `true`, il materiale richiesto. Altrimenti `""`. |
| `classi` | Elenco delle classi che possono lanciarlo, es. `["Mago", "Stregone"]`. |
| `descrizione` | Testo completo dell'effetto, dal manuale. |
| `livelli_superiori` | Testo del paragrafo "Ai livelli superiori", se presente. Altrimenti `""`. |

Attenzione alla virgola tra una scheda e la successiva se ne aggiungi più di una nello stesso file: ogni scheda dentro le parentesi quadre `[ ]` va separata dalla successiva con una virgola.

## Come inviare le modifiche

1. Apri il file dell'edizione che vuoi compilare (link sopra) e clicca sull'icona a forma di matita per modificarlo.
2. Aggiungi una o più schede complete dentro le parentesi quadre, come nell'esempio sopra.
3. In fondo alla pagina, scegli "Crea una nuova branch per questa modifica e avvia una pull request" e conferma.

Un controllo automatico verificherà che il file sia scritto correttamente (formato JSON valido, valori ammessi nei campi) e segnalerà eventuali errori direttamente nella pull request, così puoi correggerli e reinviare.

## Errori comuni da evitare

- Non togliere le virgolette `"..."` attorno a `id`, `nome`, `scuola`, ecc., anche se contengono un solo numero o una parola.
- Metti una virgola tra una scheda e l'altra, ma non dopo l'ultima scheda del file.
- `true` e `false` si scrivono senza virgolette e in minuscolo.
- Il campo `livello` è un numero: va scritto senza virgolette.
- In caso di dubbio sulla sintassi JSON, un validatore online (es. jsonlint.com) permette di controllare il file prima di inviarlo.

## Cosa succede dopo l'invio

Ogni pull request viene controllata confrontando il testo con il manuale ufficiale prima di essere unita al progetto. Da quel momento l'incantesimo compilato compare automaticamente nel database dell'app per tutti.

Grazie in anticipo per il contributo.
