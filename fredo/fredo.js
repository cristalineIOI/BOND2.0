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
    if (phoneTimerLabel) phoneTimerLabel.textContent = "Call in progress";
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
    return new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function addMsg(role, html) {
    const wrap = document.createElement("div");
    wrap.className = `msg ${role}`;
    wrap.innerHTML = `
      <div class="msg-bubble">${html}</div>
      <div class="msg-meta">${role === "user" ? "You" : FREDO} · ${timeNow()}</div>
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
    let who = "the contact you named";
    let why = text.trim();
    let constraints = "Keep a professional BOND tone.";

    if (/martin/i.test(text)) who = "Martin Office";
    else if (/acme/i.test(text)) who = "Acme Corp";
    else if (/bank|banque/i.test(text)) who = "Bank — business desk";
    else if (/select|restaurant/i.test(text)) who = "Le Select Restaurant";
    else {
      const m = text.match(/(?:call|appelle?)\s+([^,.]+?)(?:\s+to|\s+about|\s+for|\s+pour|\s+au|\s+tomorrow|\s+demain|,|\.|$)/i);
      if (m) who = m[1].trim().replace(/^(the|le|la|l'|my|ma|mon)\s+/i, "");
    }

    if (/confirm|meeting|board|rendez-vous|rdv/i.test(lower)) {
      why = "Confirm the board meeting";
    } else if (/contract|signature|follow\s*up|relance|contrat/i.test(lower)) {
      why = "Get a signature date for the Q3 contract";
    } else if (/transfer|sepa|status|virement|statut/i.test(lower)) {
      why = "Check the status of the SEPA transfer";
    } else if (/book|reserv|table/i.test(lower)) {
      why = "Book a table";
    }

    const bits = [];
    if (/before\s+11|avant\s+11|tomorrow|demain/i.test(lower)) bits.push("Call tomorrow before 11 AM");
    if (/thursday|jeudi/i.test(lower)) bits.push("If unavailable → suggest Thursday");
    if (/courteous|no pressure|courtois|pas de pression/i.test(lower)) bits.push("Courteous tone, no pressure");
    if (/this week|cette semaine/i.test(lower)) bits.push("Goal: date this week");
    if (/reference|référence/i.test(lower)) bits.push("Note the reference number");
    if (/42[\s,]?000|horizon/i.test(lower)) bits.push("Amount €42,000 · Horizon SAS");
    if (/four|quatre|4|9\s*pm|21\s*h|gabriel/i.test(lower)) bits.push("4 guests · 9 PM · Gabriel");
    if (bits.length) constraints = bits.join(" · ");

    return { who, why, constraints, raw: text.trim() };
  }

  function planHtml(intent) {
    return `
      Preparing the call plan. Here’s what I’ll execute:
      <div class="plan-card">
        <h4>Call plan</h4>
        <dl>
          <div class="plan-row"><dt>Contact</dt><dd>${escapeHtml(intent.who)}</dd></div>
          <div class="plan-row"><dt>Objective</dt><dd>${escapeHtml(intent.why)}</dd></div>
          <div class="plan-row"><dt>Constraints</dt><dd>${escapeHtml(intent.constraints)}</dd></div>
          <div class="plan-row"><dt>Channel</dt><dd>BOND line · ${FREDO} Voice</dd></div>
        </dl>
        <div class="plan-actions">
          <button type="button" class="approve" data-action="approve">Approve &amp; call</button>
          <button type="button" class="edit" data-action="edit">Adjust</button>
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
        asked: "Confirm the board meeting",
        got: "Confirmed — Wednesday 10:30 AM, Room B",
        decisions: "Slot kept · invite updated",
        next: "Prepare the deck before Tuesday 6 PM",
      };
    }
    if (/acme/i.test(who)) {
      return {
        asked: "Q3 contract signature date",
        got: "Signature scheduled Friday 4 PM (DocuSign)",
        decisions: "Clause 4.2 accepted as-is",
        next: "Send the final packet tomorrow morning",
      };
    }
    if (/bank/i.test(who)) {
      return {
        asked: "Status of €42,000 SEPA transfer",
        got: "Executed · ref. SEPA-88421-HX",
        decisions: "No hold · credit T+1",
        next: "Notify Horizon SAS of expected credit",
      };
    }
    if (/select|restaurant/i.test(who)) {
      return {
        asked: "Book a table for 4 at 9 PM",
        got: "Confirmed · table 12 · name Gabriel",
        decisions: "Reservation held 15 min",
        next: "Confirmation SMS sent",
      };
    }
    return {
      asked: intent.why,
      got: "Objective met · contact reached",
      decisions: "Verbal agreement confirmed",
      next: "FREDO logged a follow-up within 48h",
    };
  }

  async function runCall(intent) {
    setStatus("calling", "Call in progress…");
    addMsg(
      "assistant",
      `On it. Calling <strong>${escapeHtml(intent.who)}</strong>.
      <div class="call-live">
        <div class="call-wave" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
        <div>
          <strong>Line open</strong>
          <span>${FREDO} · end-to-end encryption · recording off</span>
        </div>
      </div>`
    );

    await sleep(2800);
    removeTyping();
    const r = resultFor(intent);
    setStatus("done", "Call complete");

    addMsg(
      "assistant",
      `Call complete. Here’s the summary:
      <div class="result-card">
        <header>
          <span>Outcome</span>
          <span>✓ Complete</span>
        </header>
        <ul>
          <li><em>Asked</em><span>${withFredoMark(r.asked)}</span></li>
          <li><em>Obtained</em><span>${withFredoMark(r.got)}</span></li>
          <li><em>Decisions</em><span>${withFredoMark(r.decisions)}</span></li>
          <li><em>Next steps</em><span>${withFredoMark(r.next)}</span></li>
        </ul>
      </div>
      I can take on something else — or update your BOND to-do.`
    );

    await sleep(600);
    setStatus("idle", "Online");
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
          addMsg("user", "Approved. Place the call.");
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
            "Tell me what to adjust — contact, timing, tone, or objective — and I’ll rebuild the plan."
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
    setStatus("idle", "Online");
    addMsg(
      "assistant",
      `Hi — I’m <strong>${FREDO}</strong>, the voice agent for BOND 2.0.<br><br>
      Tell me who to call, why, and your constraints. I’ll build the plan, ask for approval if needed, then place the call.`
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
