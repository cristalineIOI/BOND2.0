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

  // —— Hero phone: cinematic multi-scene demo ——
  const phone = document.getElementById("heroPhone");
  const phoneScreen = document.getElementById("phoneScreen");
  const phoneTimer = document.getElementById("phoneTimer");
  const phoneTimerLabel = document.getElementById("phoneTimerLabel");
  const phoneClock = document.getElementById("phoneClock");
  const lockBigClock = document.getElementById("lockBigClock");
  const islandPill = document.getElementById("islandPill");
  const bondApp = document.getElementById("bondApp");
  const phChatStream = document.getElementById("phChatStream");
  const phChatInput = document.getElementById("phChatInput");
  const phCompose = document.getElementById("phCompose");
  const phLiveFeed = document.getElementById("phLiveFeed");
  const phSumDuration = document.getElementById("phSumDuration");
  const scenes = () => [...document.querySelectorAll(".ph-scene")];

  const CALL_DURATION = 20;
  const PROMPT =
    "Book a table for four at 9 PM under Gabriel at Le Select.";

  let demoTimers = [];
  let callInterval = null;
  let clockInterval = null;
  let callSeconds = 0;

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

  function wait(ms) {
    return new Promise((resolve) => {
      const id = setTimeout(resolve, ms);
      demoTimers.push(id);
    });
  }

  function clearDemo() {
    demoTimers.forEach(clearTimeout);
    demoTimers = [];
    if (callInterval) {
      clearInterval(callInterval);
      callInterval = null;
    }
  }

  function setTheme(theme) {
    if (phoneScreen) phoneScreen.dataset.theme = theme;
  }

  function setLockMode(on) {
    if (phoneScreen) phoneScreen.dataset.lock = on ? "true" : "false";
  }

  function showScene(name) {
    scenes().forEach((el) => {
      el.classList.remove("is-active", "is-exit", "is-unlocking", "is-revealing");
    });
    const next = document.querySelector(`.ph-scene[data-scene="${name}"]`);
    if (next) {
      void next.offsetWidth;
      next.classList.add("is-active");
    }
  }

  async function unlockToHome() {
    const lock = document.querySelector('.ph-scene[data-scene="lock"]');
    const home = document.querySelector('.ph-scene[data-scene="home"]');
    if (!lock || !home) {
      showScene("home");
      setLockMode(false);
      return;
    }

    home.classList.add("is-active", "is-revealing");
    void lock.offsetWidth;
    lock.classList.add("is-unlocking");
    await wait(880);
    setLockMode(false);
    lock.classList.remove("is-active", "is-unlocking");
    home.classList.remove("is-revealing");
  }

  function updateClocks() {
    const now = formatClock(new Date());
    if (phoneClock) phoneClock.textContent = now;
    const big = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
    });
    if (lockBigClock) lockBigClock.textContent = big;
  }

  function typeInto(el, text, speed = 28) {
    return new Promise((resolve) => {
      if (!el) {
        resolve();
        return;
      }
      el.textContent = "";
      el.classList.add("is-typing");
      let i = 0;
      const tick = () => {
        if (i < text.length) {
          el.textContent += text[i++];
          const id = setTimeout(tick, speed + Math.random() * 18);
          demoTimers.push(id);
        } else {
          el.classList.remove("is-typing");
          resolve();
        }
      };
      tick();
    });
  }

  function addBubble(role, html) {
    if (!phChatStream) return null;
    const b = document.createElement("div");
    b.className = `ph-bubble ${role}`;
    b.innerHTML = html;
    phChatStream.appendChild(b);
    phChatStream.scrollTop = phChatStream.scrollHeight;
    return b;
  }

  function addLiveLine(who, text) {
    if (!phLiveFeed) return;
    const line = document.createElement("div");
    line.className = "ph-live-line";
    line.innerHTML = `<b>${who}</b>${text}`;
    phLiveFeed.appendChild(line);
    while (phLiveFeed.children.length > 3) {
      phLiveFeed.firstChild.remove();
    }
  }

  async function runPhoneDemo() {
    clearDemo();
    if (!phone) return;

    try {
      callSeconds = 0;
      if (phoneTimer) phoneTimer.textContent = "00:00";
      if (phChatStream) phChatStream.innerHTML = "";
      if (phLiveFeed) phLiveFeed.innerHTML = "";
      if (phChatInput) phChatInput.textContent = "";
      phCompose?.querySelector(".ph-chat-send")?.classList.remove("is-ready");
      bondApp?.classList.remove("is-pulse", "is-tap");
      islandPill?.classList.remove("is-live");
      setTheme("dark");
      setLockMode(true);
      showScene("lock");

      // 1 · Entrance on lock screen
      phone.classList.remove("is-float", "is-in");
      void phone.offsetWidth;
      await new Promise((r) => requestAnimationFrame(() => {
        phone.classList.add("is-in");
        r();
      }));
      await wait(1750);
      phone.classList.add("is-float");

      // Hold lock, then swipe-up unlock
      await wait(1400);
      await unlockToHome();
      await wait(450);

      // 2 · App selection
      bondApp?.classList.add("is-pulse");
      await wait(1100);
      bondApp?.classList.remove("is-pulse");
      bondApp?.classList.add("is-tap");
      await wait(500);

      // 3 · Chat
      setTheme("light");
      showScene("chat");
      await wait(450);

      await typeInto(phChatInput, PROMPT, 22);
      phCompose?.querySelector(".ph-chat-send")?.classList.add("is-ready");
      await wait(350);

      if (phChatInput) phChatInput.textContent = "";
      phCompose?.querySelector(".ph-chat-send")?.classList.remove("is-ready");
      addBubble("user", PROMPT);
      await wait(700);

      addBubble(
        "bot",
        `Got it. Here's the call plan:
        <div class="ph-plan"><b>Plan</b>Le Select · 4 guests · 9:00 PM · Gabriel</div>
        <span class="ph-approve">Approve &amp; call</span>`
      );
      await wait(1600);

      const approve = phChatStream?.querySelector(".ph-approve");
      if (approve) {
        approve.style.transform = "scale(0.94)";
        await wait(180);
        approve.style.transform = "";
      }
      await wait(280);

      // 4 · Dialing
      setTheme("dark");
      showScene("dial");
      await wait(2200);

      // 5 · Live call — 25s
      setTheme("light");
      showScene("call");
      islandPill?.classList.add("is-live");
      if (phoneTimerLabel) phoneTimerLabel.textContent = "Live · listen only";

      const liveBeats = [
        { at: 2, who: "Host", text: "Le Select, bonsoir — how can I help?" },
        { at: 5, who: "FREDO", text: "Table for four tonight at 9, under Gabriel." },
        { at: 9, who: "Host", text: "Let me check… yes, we have table 12." },
        { at: 13, who: "FREDO", text: "Perfect. Please hold it under Gabriel." },
        { at: 16, who: "Host", text: "Confirmed — held 15 minutes, no deposit." },
      ];
      let beatIdx = 0;

      callSeconds = 0;
      if (phoneTimer) phoneTimer.textContent = formatCall(0);

      await new Promise((resolve) => {
        callInterval = setInterval(() => {
          callSeconds += 1;
          if (phoneTimer) phoneTimer.textContent = formatCall(callSeconds);

          while (beatIdx < liveBeats.length && liveBeats[beatIdx].at <= callSeconds) {
            const b = liveBeats[beatIdx++];
            addLiveLine(b.who, b.text);
          }

          if (callSeconds >= CALL_DURATION) {
            clearInterval(callInterval);
            callInterval = null;
            resolve();
          }
        }, 1000);
      });

      // 6 · Summary
      islandPill?.classList.remove("is-live");
      if (phSumDuration) phSumDuration.textContent = formatCall(CALL_DURATION);
      setTheme("light");
      showScene("summary");

      await wait(7500);
    } catch (err) {
      console.error("FREDO phone demo error:", err);
      await wait(2000);
    }

    runPhoneDemo();
  }

  updateClocks();
  clockInterval = setInterval(updateClocks, 1000);
  runPhoneDemo();

  // —— Nav solid on scroll ——
  const onScroll = () => {
    nav?.classList.toggle("is-solid", window.scrollY > 40);
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

  // —— Smooth scroll to chat ——
  const chatSection = document.getElementById("chat");
  const navMobile = document.getElementById("navMobile");
  let chatScrollRaf = 0;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function scrollToChat({ focus = true } = {}) {
    if (!chatSection) return;

    navMobile?.classList.remove("is-open");
    shell?.classList.add("is-in");

    const navH =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 72;
    const targetY = Math.max(
      0,
      chatSection.getBoundingClientRect().top + window.scrollY - navH - 12
    );
    const startY = window.scrollY;
    const distance = targetY - startY;
    if (Math.abs(distance) < 2) {
      if (focus) input?.focus({ preventScroll: true });
      return;
    }

    const duration = Math.min(1200, Math.max(700, Math.abs(distance) * 0.55));
    const start = performance.now();
    cancelAnimationFrame(chatScrollRaf);

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      window.scrollTo(0, startY + distance * easeOutCubic(t));
      if (t < 1) {
        chatScrollRaf = requestAnimationFrame(tick);
      } else if (focus) {
        input?.focus({ preventScroll: true });
      }
    };
    chatScrollRaf = requestAnimationFrame(tick);

    if (history.replaceState) {
      history.replaceState(null, "", "#chat");
    }
  }

  document.querySelectorAll('a[href="#chat"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToChat({ focus: link.id !== "restartDemo" });
    });
  });

  if (location.hash === "#chat") {
    requestAnimationFrame(() => scrollToChat({ focus: true }));
  }

  document.getElementById("restartDemo")?.addEventListener("click", () => {
    welcome();
  });

  document.getElementById("burger")?.addEventListener("click", () => {
    navMobile?.classList.toggle("is-open");
  });

  navMobile?.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      navMobile.classList.remove("is-open");
    });
  });
})();
