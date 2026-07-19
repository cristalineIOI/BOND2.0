(() => {
  const nav = document.getElementById("nav");
  const stream = document.getElementById("chatStream");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const sendBtn = document.getElementById("chatSend");
  const statusEl = document.getElementById("chatStatus");
  const statusText = document.getElementById("chatStatusText");
  const shell = document.getElementById("chatShell");
  const hints = document.getElementById("chatHints");

  const FREDO =
    '<span class="fredo-mark" aria-label="FREDO">FRED<span class="pill-o" aria-hidden="true"></span></span>';
  const FREDO_TITLE =
    '<span class="fredo-mark" aria-label="Fredo">Fred<span class="pill-o" aria-hidden="true"></span></span>';

  let busy = false;

  // —— Hero phone: appear + live call timer ——
  const phone = document.getElementById("heroPhone");
  const phoneTimer = document.getElementById("phoneTimer");
  const phoneTimerLabel = document.getElementById("phoneTimerLabel");
  const phoneClock = document.getElementById("phoneClock");

  function formatClock(d) {
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function formatCall(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  if (phoneClock) phoneClock.textContent = formatClock(new Date());

  requestAnimationFrame(() => {
    phone?.classList.add("is-in");
  });

  let callSeconds = 0;
  let callStarted = false;

  setTimeout(() => {
    callStarted = true;
    if (phoneTimerLabel) phoneTimerLabel.textContent = "Appel en cours";
  }, 900);

  setInterval(() => {
    if (phoneClock) phoneClock.textContent = formatClock(new Date());
    if (!callStarted || !phoneTimer) return;
    callSeconds += 1;
    phoneTimer.textContent = formatCall(callSeconds);
  }, 1000);

  // —— Nav solid on scroll ——
  const onScroll = () => {
    nav.classList.toggle("is-solid", window.scrollY > 40);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // —— Reveal chat shell ——
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          shell.classList.add("is-in");
          io.disconnect();
        }
      });
    },
    { threshold: 0.15 }
  );
  if (shell) io.observe(shell);

  // —— Autosize textarea ——
  const resizeInput = () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
    sendBtn.disabled = !input.value.trim() || busy;
  };
  input.addEventListener("input", resizeInput);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) form.requestSubmit();
    }
  });

  hints.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      input.value = btn.dataset.prompt;
      resizeInput();
      input.focus();
      form.requestSubmit();
    });
  });

  function setStatus(state, label) {
    statusEl.dataset.state = state;
    statusText.textContent = label;
  }

  function scrollBottom() {
    stream.scrollTop = stream.scrollHeight;
  }

  function timeNow() {
    return new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function addMsg(role, html) {
    const wrap = document.createElement("div");
    wrap.className = `msg ${role}`;
    wrap.innerHTML = `
      <div class="msg-bubble">${html}</div>
      <div class="msg-meta">${role === "user" ? "Vous" : FREDO} · ${timeNow()}</div>
    `;
    stream.appendChild(wrap);
    scrollBottom();
    return wrap;
  }

  function addTyping() {
    const wrap = document.createElement("div");
    wrap.className = "msg assistant";
    wrap.id = "typingMsg";
    wrap.innerHTML = `
      <div class="msg-bubble"><span class="typing"><i></i><i></i><i></i></span></div>
    `;
    stream.appendChild(wrap);
    scrollBottom();
    return wrap;
  }

  function removeTyping() {
    document.getElementById("typingMsg")?.remove();
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function parseIntent(text) {
    const lower = text.toLowerCase();
    let who = "le contact indiqué";
    let why = text.trim();
    let constraints = "Respecter le ton professionnel BOND.";

    if (/cabinet\s+martin/i.test(text)) who = "Cabinet Martin";
    else if (/acme/i.test(text)) who = "Acme Corp";
    else if (/banque/i.test(text)) who = "Banque — service entreprises";
    else if (/select|restaurant/i.test(text)) who = "Restaurant Le Select";
    else {
      const m = text.match(/appelle?\s+([^,.]+?)(?:\s+pour|\s+au|\s+demain|,|\.|$)/i);
      if (m) who = m[1].trim().replace(/^le\s+|^la\s+|^l'/i, (x) => x);
    }

    if (/confirmer|rendez-vous|rdv|board/i.test(lower)) {
      why = "Confirmer le rendez-vous du board";
    } else if (/contrat|signature|relance/i.test(lower)) {
      why = "Obtenir une date de signature pour le contrat Q3";
    } else if (/virement|sepa|statut/i.test(lower)) {
      why = "Vérifier le statut du virement SEPA";
    } else if (/réserver|table/i.test(lower)) {
      why = "Réserver une table";
    }

    const bits = [];
    if (/avant\s+11h|demain/i.test(lower)) bits.push("Appeler demain avant 11h");
    if (/jeudi/i.test(lower)) bits.push("Si indisponible → proposer jeudi");
    if (/courtois|pas de pression/i.test(lower)) bits.push("Ton courtois, sans pression");
    if (/cette semaine/i.test(lower)) bits.push("Objectif : date cette semaine");
    if (/référence|reference/i.test(lower)) bits.push("Noter le n° de référence");
    if (/42\s?000|horizon/i.test(lower)) bits.push("Montant 42 000 € · Horizon SAS");
    if (/quatre|4|21\s*h|gabriel/i.test(lower)) bits.push("4 personnes · 21 h · Gabriel");
    if (bits.length) constraints = bits.join(" · ");

    return { who, why, constraints, raw: text.trim() };
  }

  function planHtml(intent) {
    return `
      Je prépare le plan d’appel. Voici ce que je vais exécuter :
      <div class="plan-card">
        <h4>Plan d’appel</h4>
        <dl>
          <div class="plan-row"><dt>Contact</dt><dd>${escapeHtml(intent.who)}</dd></div>
          <div class="plan-row"><dt>Objectif</dt><dd>${escapeHtml(intent.why)}</dd></div>
          <div class="plan-row"><dt>Contraintes</dt><dd>${escapeHtml(intent.constraints)}</dd></div>
          <div class="plan-row"><dt>Canal</dt><dd>Ligne BOND · ${FREDO} Voice</dd></div>
        </dl>
        <div class="plan-actions">
          <button type="button" class="approve" data-action="approve">Valider &amp; appeler</button>
          <button type="button" class="edit" data-action="edit">Ajuster</button>
        </div>
      </div>
    `;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function withFredoMark(text) {
    return escapeHtml(text)
      .replace(/FREDO/g, FREDO)
      .replace(/Fredo/g, FREDO_TITLE);
  }

  function resultFor(intent) {
    const who = intent.who;
    if (/martin/i.test(who)) {
      return {
        asked: "Confirmer le rendez-vous board",
        got: "Confirmé — mercredi 10:30, salle B",
        decisions: "Créneau maintenu · invitation mise à jour",
        next: "Préparer le deck avant mardi 18h",
      };
    }
    if (/acme/i.test(who)) {
      return {
        asked: "Date de signature contrat Q3",
        got: "Signature prévue vendredi 16h (DocuSign)",
        decisions: "Clause 4.2 acceptée telle quelle",
        next: "Envoyer le packet final demain matin",
      };
    }
    if (/banque/i.test(who)) {
      return {
        asked: "Statut virement SEPA 42 000 €",
        got: "Exécuté · réf. SEPA-88421-HX",
        decisions: "Aucun blocage · crédit J+1",
        next: "Notifier Horizon SAS du crédit attendu",
      };
    }
    if (/select|restaurant/i.test(who)) {
      return {
        asked: "Réserver table pour 4 à 21 h",
        got: "Confirmé · table 12 · nom Gabriel",
        decisions: "Réservation tenue 15 min",
        next: "SMS de confirmation envoyé",
      };
    }
    return {
      asked: intent.why,
      got: "Objectif atteint · interlocuteur joignable",
      decisions: "Accord verbal confirmé",
      next: "FREDO a noté un follow-up sous 48h",
    };
  }

  async function runCall(intent) {
    setStatus("calling", "Appel en cours…");
    addMsg(
      "assistant",
      `C’est parti. J’appelle <strong>${escapeHtml(intent.who)}</strong>.
      <div class="call-live">
        <div class="call-wave" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
        <div>
          <strong>Ligne ouverte</strong>
          <span>${FREDO} · chiffrement bout-en-bout · enregistrement désactivé</span>
        </div>
      </div>`
    );

    await sleep(2800);
    removeTyping();
    const r = resultFor(intent);
    setStatus("done", "Appel terminé");

    addMsg(
      "assistant",
      `Appel terminé. Voici le compte-rendu :
      <div class="result-card">
        <header>
          <span>Résultat</span>
          <span>✓ Complet</span>
        </header>
        <ul>
          <li><em>Demandé</em><span>${withFredoMark(r.asked)}</span></li>
          <li><em>Obtenu</em><span>${withFredoMark(r.got)}</span></li>
          <li><em>Décisions</em><span>${withFredoMark(r.decisions)}</span></li>
          <li><em>Prochaines étapes</em><span>${withFredoMark(r.next)}</span></li>
        </ul>
      </div>
      Je peux enchaîner sur autre chose — ou mettre à jour votre to-do BOND.`
    );

    await sleep(600);
    setStatus("idle", "En ligne");
  }

  async function respond(text) {
    busy = true;
    sendBtn.disabled = true;
    const intent = parseIntent(text);

    addTyping();
    await sleep(900 + Math.random() * 500);
    removeTyping();

    const planMsg = addMsg("assistant", planHtml(intent));

    const approve = planMsg.querySelector('[data-action="approve"]');
    const edit = planMsg.querySelector('[data-action="edit"]');

    await new Promise((resolve) => {
      const cleanup = () => {
        approve.disabled = true;
        edit.disabled = true;
        approve.style.opacity = "0.5";
        edit.style.opacity = "0.5";
      };

      approve.addEventListener(
        "click",
        async () => {
          cleanup();
          addMsg("user", "Validé. Lance l’appel.");
          addTyping();
          await sleep(700);
          removeTyping();
          await runCall(intent);
          resolve();
        },
        { once: true }
      );

      edit.addEventListener(
        "click",
        () => {
          cleanup();
          addMsg(
            "assistant",
            "Dites-moi ce qu’il faut ajuster — contact, créneau, ton, ou objectif — et je recalcule le plan."
          );
          resolve();
        },
        { once: true }
      );
    });

    busy = false;
    resizeInput();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;

    hints.style.display = "none";
    addMsg("user", escapeHtml(text));
    input.value = "";
    resizeInput();
    await respond(text);
  });

  function welcome() {
    stream.innerHTML = "";
    hints.style.display = "flex";
    setStatus("idle", "En ligne");
    addMsg(
      "assistant",
      `Bonjour — je suis <strong>${FREDO}</strong>, l’agent vocal de BOND 2.0.<br><br>
      Dites-moi qui appeler, pourquoi, et vos contraintes. Je construis le plan, je vous demande validation si besoin, puis je passe l’appel.`
    );
  }

  welcome();
  resizeInput();

  document.getElementById("restartDemo")?.addEventListener("click", () => {
    welcome();
  });

  document.getElementById("burger")?.addEventListener("click", () => {
    document.getElementById("navMobile").classList.toggle("is-open");
  });

  document.getElementById("navMobile")?.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      document.getElementById("navMobile").classList.remove("is-open");
    });
  });
})();
