# 🐉 Compendio Incantesimi Homebrew

**Compendio Incantesimi Homebrew** è un'applicazione web "all-in-one" progettata per Dungeon Master e giocatori di D&D che desiderano un luogo digitale dove organizzare incantesimi ufficiali e creazioni originali (Homebrew). 

L'app è costruita per essere **totalmente portatile**: è contenuta in un singolo file HTML che include logica, stile e database locale.

---

## ✨ Funzionalità Avanzate

- **🛠️ Editor Professionale**: Campi specifici per ogni dettaglio (Nome ITA/ENG, Scuola, Gittata, Durata, Ai livelli più alti).
- **🌓 Dark & Light Mode**: Interfaccia adattiva per non affaticare la vista durante le sessioni notturne.
- **🖼️ Supporto Immagini**: Carica illustrazioni per le tue spell. Le immagini vengono salvate all'interno del file JSON tramite codifica Base64.
- **🧙 Gestione Classi Homebrew**: Aggiungi classi personalizzate dinamicamente direttamente dalla tendina.
- **⚙️ Parametri Tecnici**: Toggle dedicati per **Concentrazione**, **Rituale** e **Componenti (V, S, M)** con specifica dei materiali.
- **💾 Import/Export Universale**: Salva l'intero grimorio (incluse classi e immagini) in un file `.json` per trasferirlo su altri dispositivi o browser.

## 🚀 Come iniziare

Non serve installare nulla. 

1. Usa il link https://gdr-sys.github.io/Compendio-incantesimi-homebrew/
2. (Opzionale) Carica un file JSON precedentemente esportato per ripristinare i tuoi dati.

## 🛠️ Tecnologie utilizzate

- **HTML5 & CSS3**: Layout responsivo e variabili CSS per il sistema di temi.
- **Vanilla JavaScript**: Gestione dello stato e manipolazione del DOM senza librerie esterne.
- **Web Storage API**: Persistenza dei dati tramite `localStorage`.
- **FileReader API**: Conversione delle immagini in stringhe Base64 per l'archiviazione nel JSON.

## 📁 Struttura Dati (JSON)

Il sistema di esportazione genera un oggetto che include sia il database delle spell che la lista delle classi personalizzate:

```json
{
  "spells": [
    {
      "id": 1715654400,
      "nameIta": "Dardo Incantato",
      "level": "1",
      "isConcentration": false,
      "image": "data:image/png;base64,...",
      ...
    }
  ],
  "classes": ["Mago", "Chierico", "Inquisitore Homebrew"]
}
