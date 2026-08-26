#!/usr/bin/env node
/**
 * Unisce gli incantesimi completati da data/da_aggiungere_2014.json e
 * data/da_aggiungere_2024.json dentro l'array SRD_SPELLS di index.html.
 *
 * Un incantesimo è considerato "completo" (pronto per l'inclusione) solo se
 * tutti i campi testuali obbligatori sono compilati e il livello non è null.
 * Le voci ancora incomplete restano nel file sorgente, così quel file continua
 * a rappresentare solo ciò che manca ancora da compilare.
 *
 * Come misura di sicurezza contro i doppioni, una voce completa il cui nome
 * risulta già presente nel database per la stessa edizione (con un id diverso)
 * non viene unita automaticamente: finisce invece nella lista "da rivedere"
 * stampata a fine esecuzione, per un controllo manuale prima di deciderne la sorte.
 *
 * Uso:
 *   node scripts/merge-spells.js
 *
 * Lo script:
 *   1. Legge index.html e i due file data/da_aggiungere_*.json
 *   2. Sposta le voci complete e senza conflitti dentro SRD_SPELLS
 *   3. Riscrive index.html con l'array aggiornato
 *   4. Riscrive i due file data/*.json lasciando le voci ancora incomplete
 *      e quelle segnalate come possibili doppioni (per revisione manuale)
 *   5. Stampa un riepilogo di quante voci sono state unite, quante sono
 *      possibili doppioni da controllare a mano, e quante restano da compilare
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'index.html');
const FILES = [
    path.join(ROOT, 'data', 'da_aggiungere_2014.json'),
    path.join(ROOT, 'data', 'da_aggiungere_2024.json')
];

function isComplete(s) {
    return (
        Number.isInteger(s.livello) &&
        typeof s.scuola === 'string' && s.scuola.trim() !== '' &&
        typeof s.tempo_lancio === 'string' && s.tempo_lancio.trim() !== '' &&
        typeof s.gittata === 'string' && s.gittata.trim() !== '' &&
        typeof s.durata === 'string' && s.durata.trim() !== '' &&
        Array.isArray(s.classi) && s.classi.length > 0 &&
        typeof s.descrizione === 'string' && s.descrizione.trim() !== ''
        // livelli_superiori e materiali possono restare vuoti legittimamente
    );
}

function normalizeName(nome) {
    return nome.trim().toLowerCase();
}

function main() {
    const html = fs.readFileSync(INDEX_PATH, 'utf8');
    const match = html.match(/const SRD_SPELLS = (\[.*?\]);\s*\/\//s);
    if (!match) {
        console.error('Non trovo "const SRD_SPELLS = [...];" dentro index.html. Interrotto.');
        process.exit(1);
    }
    const srdSpells = JSON.parse(match[1]);
    const existingIds = new Set(srdSpells.map(s => s.id));
    const existingNameEdition = new Set(srdSpells.map(s => normalizeName(s.nome) + '|' + s.edizione));

    let mergedCount = 0;
    let skippedDuplicateId = 0;
    let flaggedPossibleDuplicate = 0;
    let stillPending = 0;
    const flaggedForReview = [];

    for (const filePath of FILES) {
        if (!fs.existsSync(filePath)) continue;
        const entries = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const remaining = [];

        for (const entry of entries) {
            if (!isComplete(entry)) {
                remaining.push(entry);
                stillPending++;
                continue;
            }
            if (existingIds.has(entry.id)) {
                skippedDuplicateId++;
                continue; // stesso id già presente: non duplicare
            }
            const key = normalizeName(entry.nome) + '|' + entry.edizione;
            if (existingNameEdition.has(key)) {
                // Stesso nome e stessa edizione già nel database, ma con un id
                // diverso: probabile doppione involontario. Non viene unito in
                // automatico, resta nel file per un controllo manuale.
                remaining.push(entry);
                flaggedForReview.push(entry.nome + ' (' + entry.edizione + ')');
                flaggedPossibleDuplicate++;
                continue;
            }
            srdSpells.push(entry);
            existingIds.add(entry.id);
            existingNameEdition.add(key);
            mergedCount++;
        }

        fs.writeFileSync(filePath, JSON.stringify(remaining, null, 2), 'utf8');
    }

    if (mergedCount > 0) {
        const newBlock = 'const SRD_SPELLS = ' + JSON.stringify(srdSpells) + '; //';
        const newHtml = html.replace(/const SRD_SPELLS = \[.*?\];\s*\/\//s, newBlock);
        fs.writeFileSync(INDEX_PATH, newHtml, 'utf8');
    }

    console.log('--- Riepilogo unione incantesimi ---');
    console.log('Incantesimi uniti in index.html      :', mergedCount);
    console.log('Saltati (id già presente)            :', skippedDuplicateId);
    console.log('Da rivedere (possibile doppione)     :', flaggedPossibleDuplicate);
    console.log('Ancora da completare                 :', stillPending);
    console.log('-------------------------------------');
    if (flaggedForReview.length > 0) {
        console.log('Voci da controllare a mano (stesso nome + edizione già nel database):');
        flaggedForReview.forEach(n => console.log('  - ' + n));
        console.log('Restano nei rispettivi file data/*.json finché non vengono controllate.');
    }
    if (mergedCount === 0 && flaggedForReview.length === 0) {
        console.log('Nessuna voce pronta trovata: index.html non è stato modificato.');
    }
}

main();
