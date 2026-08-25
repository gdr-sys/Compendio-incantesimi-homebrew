# Compendio Incantesimi Homebrew

[![Sito live](https://img.shields.io/badge/sito-live-2ea44f)](https://gdr-sys.github.io/Compendio-incantesimi-homebrew/)
[![Ultimo commit](https://img.shields.io/github/last-commit/gdr-sys/Compendio-incantesimi-homebrew)](https://github.com/gdr-sys/Compendio-incantesimi-homebrew/commits/main)
[![Dimensione repo](https://img.shields.io/github/repo-size/gdr-sys/Compendio-incantesimi-homebrew)](https://github.com/gdr-sys/Compendio-incantesimi-homebrew)
[![Issue aperte](https://img.shields.io/github/issues/gdr-sys/Compendio-incantesimi-homebrew)](https://github.com/gdr-sys/Compendio-incantesimi-homebrew/issues)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/it/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/it/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/it/docs/Web/JavaScript)

**Compendio Incantesimi Homebrew** è un'applicazione web "all-in-one" pensata per Dungeon Master e giocatori di D&D che vogliono un unico posto dove organizzare incantesimi ufficiali (SRD 2014 e 2024) e creazioni originali (Homebrew), e trasformarli in vere carte da stampare e usare al tavolo.

L'app è **totalmente portatile**: è contenuta in un singolo file HTML che include logica, stile e database, senza bisogno di installare nulla o configurare un server.

---

## Indice

- [Funzionalità](#funzionalità)
- [Gestione degli incantesimi](#gestione-degli-incantesimi)
- [Stampa delle carte](#stampa-delle-carte)
- [Come iniziare](#come-iniziare)
- [Note su localStorage e portabilità dei dati](#note-su-localstorage-e-portabilità-dei-dati)
- [Tecnologie utilizzate](#tecnologie-utilizzate)
- [Struttura del progetto](#struttura-del-progetto)
- [Contribuire](#contribuire)

## Funzionalità

- **Database SRD integrato**: centinaia di incantesimi ufficiali (edizione 2014 e 2024) già pronti all'uso, ricercabili per nome, con etichetta di edizione sempre visibile.
- **Editor completo per incantesimi Homebrew**: campi dedicati per nome ITA/ENG, scuola, livello, tempo di lancio, gittata, durata, componenti (Verbale, Somatico, Materiale con descrizione dei materiali), rituale, concentrazione, classi, effetto e livelli superiori, oltre a un campo opzionale per tipo e quantità di danno/cura.
- **Ricerca estesa**: la barra di ricerca principale cerca sia nel nome sia nel testo dell'effetto e dei livelli superiori.
- **Filtri combinabili**: per edizione (2014, 2024, Homebrew), livello e classe, applicati in automatico sia alla lista principale sia alla ricerca, alla finestra di stampa e alla finestra "Sfoglia tutti". I filtri attivi restano sempre visibili con la possibilità di rimuoverli singolarmente o tutti insieme.
- **Sfoglia tutti gli incantesimi SRD**: elenco completo consultabile con gli stessi filtri della lista principale, con un pulsante per aggiungere in blocco tutti i risultati filtrati al grimorio in un solo clic.
- **Duplica incantesimo**: crea rapidamente una variante di un incantesimo esistente senza reinserire tutti i campi.
- **Azioni in blocco**: modalità di selezione multipla per eliminare, duplicare o assegnare una classe a più incantesimi contemporaneamente.
- **Incantesimi memorizzati**: contrassegna gli incantesimi usati più spesso per ritrovarli rapidamente in cima alla pagina.
- **Modalità chiara e scura**: interfaccia adattiva per non affaticare la vista durante le sessioni serali.
- **Supporto immagini**: carica un'illustrazione personalizzata per fronte e retro di ogni carta.
- **Gestione classi personalizzate**: aggiungi nuove classi (es. Artefice) direttamente dal form, disponibili subito anche nei filtri.
- **Import/Export completo**: salva l'intero grimorio (incantesimi, classi personalizzate, immagini) in un file `.json` per trasferirlo su un altro dispositivo o browser.
- **Interfaccia responsive**: layout ottimizzato sia per desktop sia per l'uso da smartphone.

## Gestione degli incantesimi

Ogni incantesimo, sia esso importato dal database SRD sia creato da zero, può essere modificato liberamente in qualunque momento. Le informazioni SRD non vengono mai sovrascritte automaticamente: se un incantesimo esiste nel database solo per una determinata edizione, viene mostrato e catalogato esclusivamente con quel tag, senza sostituzioni implicite tra versioni diverse.

## Stampa delle carte

Il compendio genera fogli pronti per la stampa in formato poker (63 x 88 mm), nove carte per foglio A4, con layout a griglia identico su tutti i principali browser (Chrome, Firefox, Edge).

- **Fronte carta**: nome, scuola, tempo di lancio, gittata, durata, componenti, classi ed effetto, con colore di intestazione diverso per scuola di magia.
- **Retro carta personalizzabile**: scegli quali informazioni mostrare sul retro tra livello, tipo di azione, raggio, concentrazione, durata, scuola, rituale, componenti, materiali, classi e danno/cura, oppure usa un retro decorativo uniforme per l'intero mazzo.
- **Ordinamento**: per nome, livello o classe, con anteprima e conteggio dei fogli prima di stampare.
- **Filtri applicati anche in stampa**: la finestra di stampa mostra sempre solo gli incantesimi che corrispondono ai filtri e alla ricerca attivi al momento.

## Come iniziare

Non serve installare nulla.

1. Apri il sito: <https://gdr-sys.github.io/Compendio-incantesimi-homebrew/>
2. (Opzionale) Importa un file JSON esportato in precedenza per ripristinare i tuoi dati.
3. Cerca un incantesimo dal database SRD oppure creane uno nuovo con il pulsante dedicato.

In alternativa, puoi scaricare `index.html` e aprirlo direttamente nel browser: in questo caso, se il browser blocca l'accesso al salvataggio locale sui file aperti direttamente dal disco, l'app te lo segnala con un avviso e continua a funzionare comunque, senza salvare le modifiche tra un caricamento e l'altro.

## Note su localStorage e portabilità dei dati

I dati vengono salvati nel `localStorage` del browser in uso: cambiare browser, dispositivo o svuotare la cache comporta la perdita dei dati se non sono stati esportati in precedenza. Si consiglia di usare regolarmente la funzione di esportazione per avere un backup del proprio grimorio.

## Tecnologie utilizzate

- **HTML5 e CSS3**: layout responsivo, CSS Grid per la griglia di stampa e variabili CSS per il sistema di temi.
- **JavaScript nativo (Vanilla JS)**: gestione dello stato e manipolazione del DOM senza framework o librerie esterne.
- **Web Storage API**: persistenza dei dati tramite `localStorage`, con gestione automatica di fallback in memoria quando non disponibile.
- **FileReader API**: conversione delle immagini in stringhe Base64 per l'archiviazione nel JSON.

## Struttura del progetto

Il progetto è contenuto in un singolo file `index.html`, che include markup, fogli di stile e logica applicativa. Questa scelta mantiene l'app completamente portatile: un solo file da scaricare, aprire o ospitare, senza passaggi di build o dipendenze da installare.

## Contribuire

Segnalazioni di problemi e proposte di miglioramento sono benvenute tramite la sezione [Issue](https://github.com/gdr-sys/Compendio-incantesimi-homebrew/issues) del repository.
