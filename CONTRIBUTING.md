# Come contribuire aggiungendo nuovi incantesimi

Il Compendio include già tutti gli incantesimi presenti nel file SRD usato come base per l'app: non manca nulla rispetto a quella fonte. Gli incantesimi elencati in questa cartella sono invece **incantesimi aggiuntivi**, non compresi in quel file SRD di partenza, che si possono aggiungere al database per ampliarlo.

Le edizioni 2014 e 2024 restano due database distinti perché il testo di uno stesso incantesimo può cambiare tra le due versioni ufficiali: ogni scheda va compilata con il testo della sua edizione specifica, così come riportato nel manuale corrispondente.

## Regola fondamentale

Il database già presente nell'app (dentro `index.html`) non va mai modificato direttamente. I contributi si fanno esclusivamente compilando le schede vuote nei due file qui sotto: sono nuove aggiunte, non correzioni a incantesimi già esistenti.

## I file da compilare

- [`data/da_aggiungere_2024.json`](data/da_aggiungere_2024.json) — incantesimi aggiuntivi per l'edizione 2024.
- [`data/da_aggiungere_2014.json`](data/da_aggiungere_2014.json) — incantesimi aggiuntivi per l'edizione 2014.

Ogni file contiene una lista di schede con nome, id ed edizione già compilati: il resto va riempito guardando il manuale ufficiale in italiano (Player's Handbook 2014 o 2024). Non serve compilarle tutte insieme: va benissimo anche una sola scheda per pull request.

## Come compilare una scheda

Ogni incantesimo è scritto così:

```json
{
  "id": "srd_dissolvi_magia_2024",
  "nome": "Dissolvi Magia",
  "livello": null,
  "edizione": "2024",
  "scuola": "",
  "tempo_lancio": "",
  "gittata": "",
  "durata": "",
  "rituale": false,
  "concentrazione": false,
  "comp": { "v": false, "s": false, "m": false },
  "materiali": "",
  "classi": [],
  "descrizione": "",
  "livelli_superiori": ""
}
```

Cosa modificare e cosa lasciare stare:

| Campo | Cosa fare |
|---|---|
| `id` | Non modificarlo. È già corretto. |
| `nome` | Non modificarlo. È già corretto. |
| `edizione` | Non modificarlo. È già corretto. |
| `livello` | Un numero da 0 (trucchetto) a 9, senza virgolette: `"livello": 3`, non `"livello": "3"`. |
| `scuola` | Una tra: `Abiurazione`, `Ammaliamento`, `Divinazione`, `Evocazione`, `Illusione`, `Invocazione`, `Necromanzia`, `Trasmutazione`. |
| `tempo_lancio` | Es. `"1 azione"`, `"1 azione bonus"`, `"1 reazione"`, `"1 minuto"`. |
| `gittata` | Es. `"9 metri"`, `"Contatto"`, `"Personale"`, `"Illimitata"`. |
| `durata` | Es. `"Istantanea"`, `"1 minuto"`, `"Concentrazione, fino a 10 minuti"`. |
| `rituale` | `true` se l'incantesimo può essere lanciato come rituale, altrimenti `false`. |
| `concentrazione` | `true` se richiede concentrazione, altrimenti `false`. |
| `comp.v` / `comp.s` / `comp.m` | `true` o `false` a seconda che richieda componente Verbale, Somatica, Materiale. |
| `materiali` | Se `comp.m` è `true`, scrivi qui il materiale richiesto. Altrimenti lascia `""`. |
| `classi` | Elenco delle classi che possono lanciarlo, es. `["Mago", "Stregone"]`. |
| `descrizione` | Testo completo dell'effetto, dal manuale. |
| `livelli_superiori` | Testo del paragrafo "Ai livelli superiori", se presente. Altrimenti lascia `""`. |

## Come inviare le modifiche

1. Apri il file da modificare (link sopra) e clicca sull'icona a forma di matita per modificarlo.
2. Compila una o più schede come spiegato sopra.
3. In fondo alla pagina, scegli "Crea una nuova branch per questa modifica e avvia una pull request" e conferma.

Un controllo automatico verificherà che il file sia scritto correttamente (formato JSON valido, valori ammessi nei campi) e segnalerà eventuali errori direttamente nella pull request, così puoi correggerli e reinviare.

## Errori comuni da evitare

- Non togliere le virgolette `"..."` attorno a `id`, `nome`, `scuola`, ecc., anche se contengono un solo numero o una parola.
- Non lasciare una virgola dopo l'ultimo campo dentro `{ }` o `[ ]`.
- `true` e `false` si scrivono senza virgolette e in minuscolo.
- Il campo `livello` è un numero: va scritto senza virgolette.
- In caso di dubbio sulla sintassi JSON, un validatore online (es. jsonlint.com) permette di controllare il file prima di inviarlo.

## Cosa succede dopo l'invio

Ogni pull request viene controllata confrontando il testo con il manuale ufficiale prima di essere unita al progetto. Da quel momento l'incantesimo compilato compare automaticamente nel database dell'app per tutti.

Grazie in anticipo per il contributo.
