// Account facoltativo (Firebase). Senza accesso il Compendio resta com'è: tutto nel browser.
// Con l'accesso grimorio, mazzi, classi e formati si salvano anche online e si ritrovano su
// ogni dispositivo; in più si possono creare link brevi di condivisione, anche con le immagini.
// Firebase si scarica solo quando serve (accesso già fatto, pannello aperto o link breve),
// così l'app si apre veloce e funziona offline come prima.
//
// Dati online:
//   utenti/{uid}/incantesimi/{id}   { j: JSON dell'incantesimo, h: impronta, agg }  oppure  { del: true, agg }
//   utenti/{uid}/dati/impostazioni  { j: JSON di mazzi, preferiti, classi e formati, h, agg }
//   condivisi/{id}                  { autore, nome, creato, dati: JSON del contenuto condiviso }
(function () {
    'use strict';

    var FIREBASE_CONFIG = {
        apiKey: 'AIzaSyD04-DAqpG2Lxs--C41fn9mo1y1BpGpipA',
        authDomain: 'compendio-arcano-431f9.firebaseapp.com',
        projectId: 'compendio-arcano-431f9',
        storageBucket: 'compendio-arcano-431f9.firebasestorage.app',
        messagingSenderId: '246199575136',
        appId: '1:246199575136:web:f9daa814bf919f040b5905'
    };
    var SDK = 'https://www.gstatic.com/firebasejs/10.12.0/';
    var CHIAVI = ['grim_master_v1', 'grim_master_pins', 'grim_decks', 'grim_custom_classes', 'grim_spell_formats'];
    var K_ACCESSO = 'grim_account';      // '1' se su questo browser c'è un accesso: Firebase si carica all'avvio
    var K_BASE = 'grim_sync_base';       // stato dell'ultima sincronizzazione, per capire chi ha cambiato cosa
    var MAX_DOC = 1000000;               // un documento Firestore arriva a 1 MiB
    var MAX_CONDIVISO = 900000;

    var fb = null, caricamento = null;
    var utente = null;
    var stato = 'fuori';                 // fuori | sincronizzo | ok | offline | errore
    var ultimaOk = 0, troppoGrandi = 0, erroreMsg = '';
    var inCorso = false, ancora = false, timer = null, applicando = false, ultimaVisibile = 0;

    // ---------- utilità ----------
    function impronta(str) {
        var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
        for (var i = 0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ c, 2654435761);
            h2 = Math.imul(h2 ^ c, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
    }
    function docId(id) { return encodeURIComponent(String(id)).replace(/\./g, '%2E'); }
    function byteLen(s) { return new TextEncoder().encode(s).length; }
    function esc(s) { return escapeHtml(String(s == null ? '' : s)); }
    function $(id) { return document.getElementById(id); }
    function leggi(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function scrivi(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
    function leggiBase(uid) {
        try {
            var b = JSON.parse(leggi(K_BASE) || 'null');
            if (b && b.uid === uid && b.inc && typeof b.inc === 'object') return b;
        } catch (e) {}
        return null;
    }
    function oraCorta(t) { var d = new Date(t); return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }); }

    var MESSAGGI = {
        'auth/invalid-credential': 'Email o password non corrette.',
        'auth/wrong-password': 'Email o password non corrette.',
        'auth/user-not-found': 'Non c\'è un account con questa email.',
        'auth/invalid-email': 'L\'indirizzo email non è valido.',
        'auth/email-already-in-use': 'Esiste già un account con questa email: usa "Accedi".',
        'auth/weak-password': 'La password deve avere almeno 6 caratteri.',
        'auth/missing-password': 'Scrivi la password.',
        'auth/too-many-requests': 'Troppi tentativi: riprova tra qualche minuto.',
        'auth/network-request-failed': 'Nessuna connessione: riprova quando sei online.',
        'auth/unauthorized-domain': 'Questo indirizzo non è ancora autorizzato all\'accesso.',
        'auth/account-exists-with-different-credential': 'Questa email è già registrata con un altro metodo di accesso.',
        'auth/requires-recent-login': 'Per sicurezza esci, rientra e riprova.',
        'permission-denied': 'Operazione non permessa.',
        'unavailable': 'Nessuna connessione: riprova quando sei online.'
    };
    function messaggio(err) {
        var c = err && err.code;
        return MESSAGGI[c] || 'Qualcosa non ha funzionato' + (c ? ' (' + c + ')' : '') + '.';
    }

    // ---------- Firebase, caricato solo quando serve ----------
    function carica() {
        if (fb) return Promise.resolve(fb);
        if (caricamento) return caricamento;
        caricamento = Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js')])
            .then(function (m) {
                var app = m[0].initializeApp(FIREBASE_CONFIG);
                fb = { a: m[1], f: m[2], auth: m[1].getAuth(app), db: m[2].getFirestore(app) };
                fb.auth.languageCode = 'it';
                m[1].onAuthStateChanged(fb.auth, cambioUtente);
                m[1].getRedirectResult(fb.auth).catch(function (e) { toast(messaggio(e), '⚠️', 6000); });
                return fb;
            })
            .catch(function (e) { caricamento = null; throw e; });
        return caricamento;
    }

    function cambioUtente(u) {
        utente = u || null;
        if (utente) {
            scrivi(K_ACCESSO, '1');
            sincronizza();
        } else {
            scrivi(K_ACCESSO, null);
            stato = 'fuori';
        }
        aggiornaPulsante();
        if ($('accountModal').classList.contains('open')) disegna();
    }

    // ---------- sincronizzazione ----------
    // Ogni dispositivo ricorda l'impronta di ogni incantesimo all'ultima sincronizzazione (la "base").
    // Confrontando locale, online e base si capisce chi ha cambiato cosa: così modifiche fatte su due
    // dispositivi diversi si sommano invece di sovrascriversi, e nessun dato si perde al primo accesso.
    function programma(ms) {
        if (!utente) return;
        clearTimeout(timer);
        timer = setTimeout(sincronizza, ms == null ? 2500 : ms);
    }

    function impostazioniLocali() {
        return { decks: decks, pins: pinnedIds, classes: CLASSES, formats: spellFormats };
    }
    function unisciImpostazioni(loc, rem) {
        var perId = {};
        rem.decks.forEach(function (d) { perId[d.id] = d; });
        loc.decks.forEach(function (d) {
            var r = perId[d.id];
            if (r) d = Object.assign({}, d, { spellIds: Array.from(new Set(r.spellIds.concat(d.spellIds))) });
            perId[d.id] = d;
        });
        var ordine = [];
        rem.decks.concat(loc.decks).forEach(function (d) { if (ordine.indexOf(d.id) === -1) ordine.push(d.id); });
        return {
            decks: ordine.map(function (id) { return perId[id]; }),
            pins: Array.from(new Set(rem.pins.concat(loc.pins))),
            classes: Array.from(new Set(rem.classes.concat(loc.classes))),
            formats: Object.assign({}, rem.formats, loc.formats)
        };
    }
    function pulisciImpostazioni(o) {
        o = o && typeof o === 'object' ? o : {};
        return {
            decks: Array.isArray(o.decks) ? o.decks.filter(function (d) { return d && typeof d === 'object'; }).map(normalizeDeck) : [],
            pins: Array.isArray(o.pins) ? o.pins.map(String) : [],
            classes: Array.isArray(o.classes) ? o.classes.map(function (c) { return String(c).slice(0, 40); }).filter(Boolean) : [],
            formats: o.formats && typeof o.formats === 'object' && !Array.isArray(o.formats) ? o.formats : {}
        };
    }
    function applicaImpostazioni(o) {
        var nuoveClassi = o.classes.filter(function (c) { return CLASSES.indexOf(c) === -1; });
        decks = o.decks;
        pinnedIds = o.pins;
        CLASSES.length = 0;
        o.classes.forEach(function (c) { CLASSES.push(c); });
        spellFormats = o.formats;
        nuoveClassi.forEach(addClassButtons);
        if (activeDeckId && !decks.some(function (d) { return d.id === activeDeckId; })) setActiveDeck(null);
        safeSetItem('grim_decks', JSON.stringify(decks));
        safeSetItem('grim_master_pins', JSON.stringify(pinnedIds));
        safeSetItem('grim_custom_classes', JSON.stringify(CLASSES));
        safeSetItem('grim_spell_formats', JSON.stringify(spellFormats));
    }

    function sincronizza() {
        if (!utente || !fb) return Promise.resolve();
        if (inCorso) { ancora = true; return Promise.resolve(); }
        if (navigator.onLine === false) { stato = 'offline'; aggiornaPulsante(); return Promise.resolve(); }
        inCorso = true; ancora = false; clearTimeout(timer);
        stato = 'sincronizzo'; aggiornaPulsante();
        return eseguiSincronizzazione()
            .then(function () { stato = 'ok'; ultimaOk = Date.now(); erroreMsg = ''; })
            .catch(function (e) {
                console.warn('Sincronizzazione', e);
                stato = e && (e.code === 'unavailable' || e.code === 'auth/network-request-failed') ? 'offline' : 'errore';
                erroreMsg = messaggio(e);
            })
            .then(function () {
                inCorso = false;
                aggiornaPulsante();
                if ($('accountModal').classList.contains('open')) disegnaStato();
                if (ancora) programma(500);
            });
    }

    function eseguiSincronizzazione() {
        var f = fb.f, db = fb.db, uid = utente.uid;
        var base = leggiBase(uid);
        var colInc = f.collection(db, 'utenti', uid, 'incantesimi');
        var docImp = f.doc(db, 'utenti', uid, 'dati', 'impostazioni');
        var visto = base ? base.visto || 0 : 0;
        // Con una base basta leggere ciò che è cambiato dall'ultima volta (con un minuto di margine).
        var q = base ? f.query(colInc, f.where('agg', '>', f.Timestamp.fromMillis(Math.max(0, visto - 60000)))) : colInc;
        return Promise.all([f.getDocs(q), f.getDoc(docImp)]).then(function (r) {
            var remoti = {};                       // id -> { h, j } oppure { del: true }
            var massimo = visto;
            if (base) Object.keys(base.inc).forEach(function (id) { remoti[id] = { h: base.inc[id] }; });
            r[0].forEach(function (d) {
                var x = d.data();
                if (x.agg && x.agg.toMillis) massimo = Math.max(massimo, x.agg.toMillis());
                if (x.del) remoti[d.id] = { del: true };
                else if (typeof x.j === 'string') remoti[d.id] = { h: x.h, j: x.j };
            });

            var inc = base ? base.inc : {};
            var nuovaBase = {}, daScrivere = [], daCancellare = [];
            var localiPerId = {}, ordine = [];
            spells.forEach(function (s) {
                if (!s || s.id == null) return;
                var id = docId(s.id);
                if (localiPerId[id]) return;
                var j = JSON.stringify(s);
                localiPerId[id] = { s: s, j: j, h: impronta(j) };
                ordine.push(id);
            });
            var cambiati = false, risultato = {};
            var tutti = ordine.concat(Object.keys(remoti).filter(function (id) { return !localiPerId[id]; }));
            troppoGrandi = 0;
            tutti.forEach(function (id) {
                var L = localiPerId[id], R = remoti[id], b = inc[id];
                if (R && R.del) R = null;
                if (L && R) {
                    if (L.h === R.h) { risultato[id] = L.s; nuovaBase[id] = L.h; }
                    else if (L.h === b && R.j) { risultato[id] = JSON.parse(R.j); nuovaBase[id] = R.h; cambiati = true; }
                    else { risultato[id] = L.s; daScrivere.push([id, L]); }
                } else if (L) {
                    if (b !== undefined && b === L.h) { cambiati = true; }             // cancellato altrove
                    else { risultato[id] = L.s; daScrivere.push([id, L]); }
                } else if (R) {
                    if (b !== undefined && b === R.h) { daCancellare.push(id); }       // cancellato qui
                    else if (R.j) { risultato[id] = JSON.parse(R.j); nuovaBase[id] = R.h; cambiati = true; }
                }
            });

            // impostazioni
            var impR = r[1].exists() ? r[1].data() : null;
            var impL = pulisciImpostazioni(impostazioniLocali());
            var jL = JSON.stringify(impL), hL = impronta(jL);
            var hR = impR ? impR.h : null, hB = base ? base.imp : null;
            var impDaScrivere = null, impDaApplicare = null, hFinale = hL;
            if (impR && hR !== hL) {
                var remota = pulisciImpostazioni(JSON.parse(impR.j));
                if (hL === hB) { impDaApplicare = remota; hFinale = hR; }
                else if (hR === hB) { impDaScrivere = jL; }
                else {
                    var unite = unisciImpostazioni(impL, remota);
                    impDaApplicare = unite;
                    impDaScrivere = JSON.stringify(unite);
                    hFinale = impronta(impDaScrivere);
                }
            } else if (!impR) {
                impDaScrivere = jL;
            }

            // applica in locale prima di scrivere online: se la rete cade a metà, al giro dopo si riparte
            if (cambiati || impDaApplicare) {
                applicando = true;
                try {
                    if (cambiati) {
                        var nuove = ordine.filter(function (id) { return risultato[id]; }).map(function (id) { return risultato[id]; });
                        tutti.forEach(function (id) { if (!localiPerId[id] && risultato[id]) nuove.push(risultato[id]); });
                        spells = nuove;
                        safeSetItem('grim_master_v1', JSON.stringify(spells));
                    }
                    if (impDaApplicare) applicaImpostazioni(impDaApplicare);
                } finally { applicando = false; }
                render();
            }

            // scritture a blocchi (al massimo 400 operazioni e circa 8 MB per volta)
            var ops = [];
            daScrivere.forEach(function (x) {
                if (byteLen(x[1].j) > MAX_DOC - 200) { troppoGrandi++; return; }
                ops.push({ ref: f.doc(colInc, x[0]), dati: { j: x[1].j, h: x[1].h, agg: f.serverTimestamp() }, peso: x[1].j.length, id: x[0], h: x[1].h });
            });
            daCancellare.forEach(function (id) {
                ops.push({ ref: f.doc(colInc, id), dati: { del: true, agg: f.serverTimestamp() }, peso: 100 });
            });
            if (impDaScrivere !== null) ops.push({ ref: docImp, dati: { j: impDaScrivere, h: impronta(impDaScrivere), agg: f.serverTimestamp() }, peso: impDaScrivere.length });

            var blocchi = [], blocco = [], peso = 0;
            ops.forEach(function (o) {
                if (blocco.length && (blocco.length >= 400 || peso + o.peso > 8000000)) { blocchi.push(blocco); blocco = []; peso = 0; }
                blocco.push(o); peso += o.peso;
            });
            if (blocco.length) blocchi.push(blocco);

            return blocchi.reduce(function (p, bl) {
                return p.then(function () {
                    var wb = f.writeBatch(db);
                    bl.forEach(function (o) { wb.set(o.ref, o.dati); });
                    return wb.commit().then(function () { bl.forEach(function (o) { if (o.id) nuovaBase[o.id] = o.h; }); });
                });
            }, Promise.resolve()).then(function () {
                scrivi(K_BASE, JSON.stringify({ uid: uid, inc: nuovaBase, imp: hFinale, visto: massimo }));
            });
        });
    }

    // ogni salvataggio dei dati sincronizzati fa partire una sincronizzazione poco dopo
    var salvaOriginale = safeSetItem;
    safeSetItem = function (k, v) {
        var ok = salvaOriginale(k, v);
        if (ok && !applicando && CHIAVI.indexOf(k) !== -1) programma();
        return ok;
    };
    // "Reset totale" con l'accesso svuota anche il grimorio online (lo dice il messaggio di conferma)
    var resetOriginale = resetCompendio;
    resetCompendio = function () {
        resetOriginale();
        programma(0);
    };
    var confermaResetOriginale = confirmReset;
    confirmReset = function () {
        if (!utente) return confermaResetOriginale();
        customConfirm('Cancellare TUTTI gli incantesimi salvati, anche dal tuo account e quindi da tutti i tuoi dispositivi? L\'azione non è reversibile.').then(function (ok) {
            if (ok) resetCompendio();
        });
    };
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible' && utente && Date.now() - ultimaVisibile > 60000) { ultimaVisibile = Date.now(); sincronizza(); }
    });
    window.addEventListener('online', function () {
        if (leggi(K_ACCESSO) === '1' && !fb) avvia();
        else if (utente) sincronizza();
    });

    // ---------- pulsante e pannello ----------
    function aggiornaPulsante() {
        var b = $('accountBtn');
        if (!b) return;
        b.dataset.stato = utente ? stato : 'fuori';
        var t = !utente ? 'Accedi per ritrovare il grimorio su ogni dispositivo'
            : stato === 'sincronizzo' ? 'Sincronizzazione in corso'
            : stato === 'offline' ? 'Sei offline: le modifiche si sincronizzano quando torna la rete'
            : stato === 'errore' ? 'Sincronizzazione non riuscita'
            : 'Grimorio sincronizzato';
        b.title = t;
        b.setAttribute('aria-label', 'Account: ' + t);
    }

    function testoStato() {
        if (stato === 'sincronizzo') return 'Sincronizzazione in corso…';
        if (stato === 'offline') return 'Sei offline: le modifiche restano qui e si sincronizzano quando torna la rete.';
        if (stato === 'errore') return 'Sincronizzazione non riuscita. ' + erroreMsg;
        if (ultimaOk) return 'Grimorio sincronizzato alle ' + oraCorta(ultimaOk) + '.';
        return '';
    }
    function disegnaStato() {
        var el = $('accStato');
        if (!el) return;
        el.textContent = testoStato();
        el.dataset.stato = stato;
        var tg = $('accGrandi');
        if (tg) {
            tg.textContent = troppoGrandi ? (troppoGrandi === 1 ? '1 incantesimo ha immagini troppo pesanti per l\'account e resta solo su questo dispositivo.' : troppoGrandi + ' incantesimi hanno immagini troppo pesanti per l\'account e restano solo su questo dispositivo.') : '';
            tg.classList.toggle('hidden', !troppoGrandi);
        }
    }

    var G_LOGO = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>';

    function disegna() {
        var box = $('accountCorpo');
        if (!utente) {
            box.innerHTML =
                '<p class="modal-sub">Facoltativo. Con l\'accesso incantesimi, mazzi e classi si salvano anche nel tuo account e li ritrovi su telefono, tablet e computer. Puoi anche creare link brevi per condividere un mazzo, immagini comprese. Senza accesso tutto resta in questo browser, come sempre.</p>' +
                '<button class="btn btn-ghost btn-block acc-google" onclick="Account.google()">' + G_LOGO + 'Continua con Google</button>' +
                '<div class="acc-oppure"><span>oppure con email</span></div>' +
                '<form class="acc-form" onsubmit="event.preventDefault(); Account.accedi();">' +
                '<label class="field-label" for="accEmail">Email</label>' +
                '<input id="accEmail" type="email" autocomplete="email" inputmode="email" required>' +
                '<label class="field-label" for="accPass">Password</label>' +
                '<input id="accPass" type="password" autocomplete="current-password" minlength="6" required>' +
                '<p class="acc-errore hidden" id="accErrore" role="alert"></p>' +
                '<div class="acc-azioni"><button class="btn btn-primary" type="submit">Accedi</button>' +
                '<button class="btn btn-ghost" type="button" onclick="Account.registrati()">Crea account</button></div>' +
                '<button class="acc-link" type="button" onclick="Account.recupera()">Password dimenticata?</button>' +
                '</form>' +
                '<p class="field-hint">I dati dell\'account sono conservati su Google Firebase e servono solo a ritrovare il tuo grimorio. Puoi eliminare account e dati quando vuoi da qui.</p>';
            return;
        }
        var google = (utente.providerData || []).some(function (p) { return p.providerId === 'google.com'; });
        box.innerHTML =
            '<div class="acc-chi"><span class="acc-iniziale" aria-hidden="true">' + esc((utente.displayName || utente.email || '?').trim().charAt(0).toUpperCase()) + '</span>' +
            '<div><b>' + esc(utente.displayName || utente.email) + '</b>' + (utente.displayName ? '<span>' + esc(utente.email) + '</span>' : '') + '</div></div>' +
            (!utente.emailVerified && !google ? '<div class="acc-avviso">Conferma l\'indirizzo con il link che ti abbiamo mandato per email: serve per creare link di condivisione. <button class="acc-link" onclick="Account.rimandaConferma()">Rimanda l\'email</button> · <button class="acc-link" onclick="Account.ricarica()">L\'ho confermato</button></div>' : '') +
            '<p class="acc-stato" id="accStato" aria-live="polite"></p>' +
            '<p class="field-hint hidden" id="accGrandi"></p>' +
            '<button class="btn btn-ghost btn-sm" onclick="Account.sincronizza()">Sincronizza ora</button>' +
            '<h3 class="acc-titolo">I tuoi link condivisi</h3>' +
            '<div id="accLink" class="acc-link-lista"><p class="field-hint">Caricamento…</p></div>' +
            '<div class="acc-fondo"><button class="btn btn-ghost" onclick="Account.esci()">Esci</button>' +
            '<button class="btn btn-danger" onclick="Account.elimina()">Elimina account</button></div>';
        disegnaStato();
        caricaLink();
    }

    function mostraErrore(t) {
        var e = $('accErrore');
        if (!e) { toast(t, '⚠️', 6000); return; }
        e.textContent = t;
        e.classList.toggle('hidden', !t);
    }
    function campi() {
        var email = ($('accEmail') || {}).value || '', pass = ($('accPass') || {}).value || '';
        return { email: email.trim(), pass: pass };
    }
    function occupato(on) {
        document.querySelectorAll('#accountCorpo button').forEach(function (b) { b.disabled = on; });
    }
    function conFirebase(fn) {
        occupato(true);
        return carica().then(fn).catch(function (e) {
            if (e && (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request')) return;
            mostraErrore(e && e.code ? messaggio(e) : 'Serve la connessione a internet per accedere.');
        }).then(function () { occupato(false); });
    }

    function caricaLink() {
        var box = $('accLink');
        if (!box || !utente) return;
        var f = fb.f;
        f.getDocs(f.query(f.collection(fb.db, 'condivisi'), f.where('autore', '==', utente.uid))).then(function (snap) {
            var righe = [];
            snap.forEach(function (d) { var x = d.data(); righe.push({ id: d.id, nome: x.nome || 'Senza nome', t: x.creato && x.creato.toMillis ? x.creato.toMillis() : 0 }); });
            righe.sort(function (a, b) { return b.t - a.t; });
            if (!righe.length) { box.innerHTML = '<p class="field-hint">Nessun link. Dal pulsante "Condividi" di un mazzo o di un incantesimo puoi crearne uno breve.</p>'; return; }
            box.innerHTML = righe.map(function (r) {
                return '<div class="acc-riga"><span>' + esc(r.nome) + (r.t ? '<small>' + new Date(r.t).toLocaleDateString('it-IT') + '</small>' : '') + '</span>' +
                    '<button class="btn btn-ghost btn-sm" onclick="Account.copiaLink(\'' + r.id + '\')">Copia</button>' +
                    '<button class="btn btn-danger btn-sm" onclick="Account.togliLink(\'' + r.id + '\')" aria-label="Elimina il link ' + esc(r.nome) + '">Elimina</button></div>';
            }).join('');
        }).catch(function () { box.innerHTML = '<p class="field-hint">Non riesco a caricare i link adesso.</p>'; });
    }

    function linkDa(id) { return location.href.split('#')[0] + '#c=' + id; }
    function copia(testo) {
        if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(testo).then(function () { toast('Link copiato', '🔗'); }, function () { toast(testo, '🔗', 9000); });
        toast(testo, '🔗', 9000);
    }

    // ---------- condivisione con link breve ----------
    var condivisioneOriginale = openShare;
    openShare = function (title, list, deckName) {
        return Promise.resolve(condivisioneOriginale(title, list, deckName)).then(function () {
            var box = $('shareBreve');
            if (!box || !list || !list.length) return;
            box.dataset.titolo = title;
            box._dati = { list: list, deckName: deckName, title: title };
            if (!utente) {
                box.innerHTML = '<p class="field-hint">Con l\'<button class="acc-link" onclick="closeOverlay(\'shareModal\'); Account.apri()">accesso</button> puoi creare un link breve che porta anche le immagini.</p>';
            } else {
                box.innerHTML = '<button class="btn btn-ghost btn-sm" onclick="Account.creaLinkBreve()">Crea link breve, con le immagini</button>';
            }
        });
    };

    function creaLinkBreve() {
        var box = $('shareBreve'), d = box && box._dati;
        if (!d || !utente) return;
        var google = (utente.providerData || []).some(function (p) { return p.providerId === 'google.com'; });
        if (!utente.emailVerified && !google) { toast('Prima conferma l\'email dal link che ti abbiamo mandato (pannello Account).', '⚠️', 7000); return; }
        var dati = JSON.stringify(buildSharePayload(d.list, d.deckName, true));
        if (byteLen(dati) > MAX_CONDIVISO) { toast('Troppo pesante per un link breve: usa "Scarica come file".', '⚠️', 7000); return; }
        box.innerHTML = '<p class="field-hint">Creo il link…</p>';
        var f = fb.f;
        f.addDoc(f.collection(fb.db, 'condivisi'), { autore: utente.uid, nome: String(d.title || '').slice(0, 80), creato: f.serverTimestamp(), dati: dati })
            .then(function (ref) {
                var link = linkDa(ref.id);
                $('shareLinkInput').value = link;
                $('shareWarn').textContent = 'Link breve: porta anche le immagini e puoi eliminarlo quando vuoi dal pannello Account.';
                box.innerHTML = '';
                copia(link);
            })
            .catch(function (e) { box.innerHTML = ''; toast(messaggio(e), '⚠️', 6000); });
    }

    function apriLinkBreve() {
        var m = location.hash.match(/^#c=([A-Za-z0-9]{10,40})$/);
        if (!m) return;
        history.replaceState(null, '', location.href.split('#')[0]);
        carica().then(function () {
            return fb.f.getDoc(fb.f.doc(fb.db, 'condivisi', m[1]));
        }).then(function (snap) {
            if (!snap.exists()) { toast('Questo link non esiste più: forse chi l\'ha creato l\'ha eliminato.', '⚠️', 7000); return; }
            var x = snap.data();
            return receiveShared(JSON.parse(x.dati), true);
        }).catch(function () {
            toast('Per aprire questo link serve la connessione a internet.', '⚠️', 7000);
        });
    }
    window.addEventListener('hashchange', apriLinkBreve);

    // ---------- azioni ----------
    window.Account = {
        apri: function () {
            disegna();
            $('accountModal').classList.add('open');
            if (!fb) carica().then(function () { if (!utente) return; disegna(); }).catch(function () {});
        },
        google: function () {
            conFirebase(function () {
                var p = new fb.a.GoogleAuthProvider();
                return fb.a.signInWithPopup(fb.auth, p).catch(function (e) {
                    if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) return fb.a.signInWithRedirect(fb.auth, p);
                    throw e;
                }).then(function () { toast('Accesso fatto: sincronizzo il grimorio', '✓'); });
            });
        },
        accedi: function () {
            var c = campi();
            if (!c.email || !c.pass) { mostraErrore('Scrivi email e password.'); return; }
            conFirebase(function () {
                return fb.a.signInWithEmailAndPassword(fb.auth, c.email, c.pass).then(function () { toast('Accesso fatto: sincronizzo il grimorio', '✓'); });
            });
        },
        registrati: function () {
            var c = campi();
            if (!c.email || c.pass.length < 6) { mostraErrore('Scrivi l\'email e una password di almeno 6 caratteri.'); return; }
            conFirebase(function () {
                return fb.a.createUserWithEmailAndPassword(fb.auth, c.email, c.pass).then(function (cred) {
                    toast('Account creato. Ti abbiamo mandato un\'email per confermare l\'indirizzo.', '✓', 7000);
                    return fb.a.sendEmailVerification(cred.user).catch(function () {});
                });
            });
        },
        recupera: function () {
            var c = campi();
            if (!c.email) { mostraErrore('Scrivi la tua email, poi premi di nuovo "Password dimenticata?".'); return; }
            conFirebase(function () {
                return fb.a.sendPasswordResetEmail(fb.auth, c.email).then(function () {
                    mostraErrore('');
                    toast('Se c\'è un account con questa email, ti è arrivato il link per scegliere una nuova password.', '✉️', 8000);
                });
            });
        },
        rimandaConferma: function () {
            if (utente) fb.a.sendEmailVerification(utente).then(function () { toast('Email mandata di nuovo', '✉️'); }, function (e) { toast(messaggio(e), '⚠️', 6000); });
        },
        ricarica: function () {
            if (utente) utente.reload().then(function () { utente = fb.auth.currentUser; disegna(); if (utente.emailVerified) toast('Indirizzo confermato', '✓'); else toast('Non risulta ancora confermato: apri il link nell\'email.', '⚠️', 6000); });
        },
        sincronizza: function () { sincronizza(); disegnaStato(); },
        esci: function () {
            customConfirm('Vuoi anche togliere il grimorio da questo dispositivo? Resta comunque salvato nel tuo account. Premi "Annulla" per uscire lasciandolo qui.').then(function (svuota) {
                var prima = utente ? sincronizza() : Promise.resolve();
                prima.then(function () { return fb.a.signOut(fb.auth); }).then(function () {
                    scrivi(K_BASE, null);
                    if (svuota) {
                        applicando = true;
                        try {
                            resetOriginale();
                            CHIAVI.forEach(function (k) { scrivi(k, null); });
                        } finally { applicando = false; }
                    }
                    closeOverlay('accountModal');
                    toast(svuota ? 'Account scollegato e dispositivo svuotato' : 'Account scollegato', '✓');
                });
            });
        },
        elimina: function () {
            customConfirm('Eliminare l\'account e tutto ciò che contiene online (grimorio e link condivisi)? Su questo dispositivo il grimorio resta. L\'azione non è reversibile.').then(function (ok) {
                if (!ok || !utente) return;
                var f = fb.f, db = fb.db, uid = utente.uid;
                Promise.all([
                    f.getDocs(f.collection(db, 'utenti', uid, 'incantesimi')),
                    f.getDocs(f.query(f.collection(db, 'condivisi'), f.where('autore', '==', uid)))
                ]).then(function (r) {
                    var refs = [f.doc(db, 'utenti', uid, 'dati', 'impostazioni')];
                    r[0].forEach(function (d) { refs.push(d.ref); });
                    r[1].forEach(function (d) { refs.push(d.ref); });
                    var p = Promise.resolve();
                    for (var i = 0; i < refs.length; i += 400) (function (pezzo) {
                        p = p.then(function () { var wb = f.writeBatch(db); pezzo.forEach(function (x) { wb.delete(x); }); return wb.commit(); });
                    })(refs.slice(i, i + 400));
                    return p;
                }).then(function () {
                    return utente.delete();
                }).then(function () {
                    scrivi(K_BASE, null);
                    closeOverlay('accountModal');
                    toast('Account eliminato', '✓', 5000);
                }).catch(function (e) { toast(messaggio(e), '⚠️', 8000); });
            });
        },
        creaLinkBreve: creaLinkBreve,
        copiaLink: function (id) { copia(linkDa(id)); },
        togliLink: function (id) {
            customConfirm('Eliminare questo link? Chi lo apre non vedrà più il contenuto. Chi l\'ha già importato lo tiene.').then(function (ok) {
                if (ok) fb.f.deleteDoc(fb.f.doc(fb.db, 'condivisi', id)).then(caricaLink, function (e) { toast(messaggio(e), '⚠️', 6000); });
            });
        }
    };

    function avvia() {
        carica().catch(function () { stato = 'offline'; aggiornaPulsante(); });
    }
    aggiornaPulsante();
    if (leggi(K_ACCESSO) === '1') { utente = null; stato = 'offline'; avvia(); }
    if (/^#c=/.test(location.hash)) apriLinkBreve();
})();
