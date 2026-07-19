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

  // —— Nav: floating pill on scroll (matches Bond site) ——
  const onScroll = () => {
    const y = window.scrollY;
    nav?.classList.toggle("is-solid", y > 24);
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

  // —— Real phone task: talk to the Bond-OpenAI relay via the site proxy ——
  const API_BASE = "/api";
  const POLL_MS = 1800;
  const TERMINAL_CALL_STATES = new Set([
    "completed",
    "no_answer",
    "declined",
    "failed",
    "cancelled",
  ]);
  const E164_RE = /^\+[1-9]\d{7,14}$/;

  function extractPhone(text) {
    const m = text.match(/\+[1-9][0-9\s().-]{7,18}/);
    if (!m) return null;
    const normalized = m[0].replace(/[\s().-]/g, "");
    return E164_RE.test(normalized) ? normalized : null;
  }

  function maskPhone(e164) {
    const digits = (e164 || "").replace(/\D/g, "");
    if (digits.length < 4) return "";
    const cc = e164.startsWith("+") ? digits.slice(0, 2) : "";
    return `${cc ? "+" + cc + " " : ""}•••• ••${digits.slice(-2)}`;
  }

  function detectLanguage(text) {
    if (
      /[àâçéèêëîïôûùü]/i.test(text) ||
      /\b(appelle?r?|réserve|bonjour|merci|rendez-vous|demain|virement|numéro)\b/i.test(text)
    ) {
      return "fr";
    }
    return "en";
  }

  function deriveCaller(text) {
    const m = text.match(
      /\b(?:under|sous|au nom de|from|de la part de)\s+([A-Za-zÀ-ÿ][\wÀ-ÿ'.-]{1,40})/i
    );
    return m ? m[1].trim().replace(/[.,;:]+$/, "") : "BOND";
  }

  function deriveRecipientLabel(text) {
    const m = text.match(
      /\b(?:call|appelle?r?|ring|phone)\s+(?:the\s+|le\s+|la\s+|my\s+|mon\s+|ma\s+)?([^,.0-9+]{2,40}?)(?:\s+(?:at|on|to|about|for|au|pour|le|tomorrow|demain)\b|[,.]|$)/i
    );
    if (m) {
      const label = m[1].trim().replace(/\s+/g, " ");
      if (label && !/^\+?\d/.test(label)) return label.slice(0, 60);
    }
    return null;
  }

  function parseTask(text) {
    const phone = extractPhone(text);
    const goal =
      text.replace(/\+[1-9][0-9\s().-]{7,18}/, "").replace(/\s+/g, " ").trim() ||
      text.trim();
    return {
      raw: text.trim(),
      destination_phone: phone,
      caller_identity: deriveCaller(text),
      recipient_label: deriveRecipientLabel(text),
      call_goal: goal.slice(0, 500),
      language: detectLanguage(text),
    };
  }

  function planHtml(task) {
    const dest = task.destination_phone ? escapeHtml(maskPhone(task.destination_phone)) : "—";
    const recipient = task.recipient_label ? escapeHtml(task.recipient_label) : dest;
    const lang = task.language === "fr" ? "French" : "English";
    return `
      Here’s the call plan. Review it, then approve to place the real call.
      <div class="plan-card">
        <h4>Call plan</h4>
        <dl>
          <div class="plan-row"><dt>Recipient</dt><dd>${recipient}</dd></div>
          <div class="plan-row"><dt>Number</dt><dd>${dest}</dd></div>
          <div class="plan-row"><dt>Objective</dt><dd>${escapeHtml(task.call_goal)}</dd></div>
          <div class="plan-row"><dt>From</dt><dd>${escapeHtml(task.caller_identity)}</dd></div>
          <div class="plan-row"><dt>Language</dt><dd>${lang}</dd></div>
          <div class="plan-row"><dt>Channel</dt><dd>BOND line · ${FREDO} Voice · not recorded</dd></div>
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

  const CALL_LABELS = {
    dialing: "Ringing…",
    in_progress: "Live · listen only",
  };

  let pollTimer = null;

  function stopPolling() {
    if (pollTimer) {
      clearTimeout(pollTimer);
      pollTimer = null;
    }
  }

  async function api(path, options) {
    const res = await fetch(API_BASE + path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    let data = null;
    try {
      data = await res.json();
    } catch (_) {
      data = null;
    }
    return { ok: res.ok, status: res.status, data };
  }

  function errorMessage(status, data) {
    const code = (data && (data.error || data.code)) || "";
    const map = {
      destination_not_allowed:
        "That number isn’t enrolled on the allowlist, so I can’t call it. Add it first, then try again.",
      destination_forbidden:
        "That number is blocked (emergency, premium or short-code). I won’t dial it.",
      invalid_destination:
        "That doesn’t look like a valid international number. Use E.164, e.g. +33612345678.",
      consent_required:
        "I need explicit consent from the recipient before I can place the call.",
      call_busy:
        "A call is already in progress — only one runs at a time. Try again once it ends.",
      idempotency_conflict: "This task was already submitted. Send a fresh request.",
      provider_unavailable:
        "The phone provider rejected the call. Please try again shortly.",
      relay_unreachable: "I can’t reach the call service right now. Please try again.",
      rate_limited: "Too many requests right now — give it a few seconds.",
      unauthorized: "The call service refused the request. Check the relay configuration.",
      invalid_goal: "The objective is too long — keep it under 500 characters.",
      needs_input: "I’m missing something to place the call. Tell me who to call and the number.",
    };
    return (
      map[code] ||
      (data && data.message) ||
      `The call couldn’t be created (error ${status}).`
    );
  }

  function outcomeLabel(status) {
    return (
      {
        completed: "✓ Complete",
        no_answer: "No answer",
        declined: "Declined",
        failed: "Failed",
        cancelled: "Cancelled",
      }[status] || "Done"
    );
  }

  function elapsedSeconds(result) {
    if (!result.connected_at) return 0;
    const start = Date.parse(result.connected_at);
    if (Number.isNaN(start)) return 0;
    const end = result.ended_at ? Date.parse(result.ended_at) : Date.now();
    return Math.max(0, Math.round((end - start) / 1000));
  }

  function liveCardHtml(status, callId, elapsed) {
    const label = CALL_LABELS[status] || "Connecting…";
    const timer = status === "in_progress" ? ` · ${formatCall(elapsed)}` : "";
    return `
      <div class="call-live">
        <div class="call-wave" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
        <div>
          <strong>${label}</strong>
          <span>${FREDO} · end-to-end · not recorded${timer}</span>
        </div>
        <button type="button" class="edit" data-action="cancel" data-call="${escapeHtml(callId)}" style="margin-left:auto">Cancel</button>
      </div>`;
  }

  function resultCardHtml(task, result) {
    const rows = [`<li><em>Asked</em><span>${withFredoMark(task.call_goal)}</span></li>`];
    const details = result.details && typeof result.details === "object" ? result.details : {};
    const obtained = result.answer || result.summary || details.answer;
    if (obtained) rows.push(`<li><em>Obtained</em><span>${withFredoMark(String(obtained))}</span></li>`);
    if (result.summary && result.summary !== obtained) {
      rows.push(`<li><em>Summary</em><span>${withFredoMark(String(result.summary))}</span></li>`);
    }
    const actions = Array.isArray(result.next_actions) ? result.next_actions : [];
    const cal = actions.find((a) => a && a.type === "calendar.create_event");
    if (cal && cal.event) {
      const when = cal.event.start ? new Date(cal.event.start).toLocaleString() : "";
      rows.push(
        `<li><em>Next step</em><span>Add to calendar: ${escapeHtml(cal.event.title || "event")}${when ? " · " + escapeHtml(when) : ""}</span></li>`
      );
    }
    return `
      <div class="result-card">
        <header>
          <span>Outcome</span>
          <span>${escapeHtml(outcomeLabel(result.status))}</span>
        </header>
        <ul>${rows.join("")}</ul>
      </div>`;
  }

  function bindCancel(msg, callId) {
    const btn = msg.querySelector('[data-action="cancel"]');
    if (!btn) return;
    btn.addEventListener(
      "click",
      async () => {
        btn.disabled = true;
        await api(`/calls/${encodeURIComponent(callId)}/cancel`, { method: "POST" });
      },
      { once: true }
    );
  }

  function pollUntilDone(task, callId, liveMsg) {
    return new Promise((resolve) => {
      const bubble = liveMsg.querySelector(".msg-bubble");
      const tick = async () => {
        const res = await api(`/calls/${encodeURIComponent(callId)}`, { method: "GET" });
        if (!res.ok || !res.data) {
          pollTimer = setTimeout(tick, POLL_MS);
          return;
        }
        const result = res.data;
        const status = result.status;
        if (TERMINAL_CALL_STATES.has(status)) {
          stopPolling();
          setStatus("done", "Call complete");
          if (bubble) {
            bubble.innerHTML =
              status === "completed"
                ? `Call complete. Here’s the summary:${resultCardHtml(task, result)}`
                : `Call ended — ${escapeHtml(outcomeLabel(status).toLowerCase())}.${resultCardHtml(task, result)}`;
          }
          scrollBottom();
          setTimeout(() => setStatus("idle", "Online"), 800);
          resolve();
          return;
        }
        if (bubble) {
          bubble.innerHTML = `Calling now.${liveCardHtml(status, callId, elapsedSeconds(result))}`;
          bindCancel(liveMsg, callId);
        }
        scrollBottom();
        pollTimer = setTimeout(tick, POLL_MS);
      };
      tick();
    });
  }

  async function runCall(task) {
    setStatus("calling", "Placing the call…");
    const idempotencyKey = `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const create = await api("/calls", {
      method: "POST",
      body: JSON.stringify({
        task: {
          task_id: idempotencyKey,
          caller_identity: task.caller_identity,
          destination_phone: task.destination_phone,
          call_goal: task.call_goal,
          language: task.language,
          recipient_label: task.recipient_label || undefined,
          consent_confirmed: true,
          confirmed: true,
          idempotency_key: idempotencyKey,
        },
      }),
    });

    if (!create.ok || !create.data || !create.data.call_id) {
      setStatus("idle", "Online");
      addMsg("assistant", escapeHtml(errorMessage(create.status, create.data)));
      return;
    }

    const callId = create.data.call_id;
    const liveMsg = addMsg(
      "assistant",
      `Calling now.${liveCardHtml(create.data.status || "dialing", callId, 0)}`
    );
    bindCancel(liveMsg, callId);
    await pollUntilDone(task, callId, liveMsg);
  }

  async function respond(text) {
    busy = true;
    sendBtn.disabled = true;
    stopPolling();
    const task = parseTask(text);

    addTyping();
    await sleep(700 + Math.random() * 400);
    removeTyping();

    if (!task.destination_phone) {
      addMsg(
        "assistant",
        "Tell me the number to call in international format (E.164), e.g. <strong>+33 6 12 34 56 78</strong> — along with who to call and why."
      );
      busy = false;
      resizeInput();
      return;
    }

    const planMsg = addMsg("assistant", planHtml(task));
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
          await sleep(500);
          removeTyping();
          await runCall(task);
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
            "Sure — resend the request with your changes (recipient, number, objective or language) and I’ll rebuild the plan."
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
  const chatTarget = document.getElementById("chatShell") || document.getElementById("chat");
  const navEl = document.getElementById("nav");
  const navMobile = document.getElementById("navMobile");
  let chatScrollRaf = 0;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function scrollToChat({ focus = true } = {}) {
    if (!chatTarget) return;

    navMobile?.classList.remove("is-open");
    shell?.classList.add("is-in");

    const navH = navEl?.offsetHeight || 72;
    // offsetTop chain ignores CSS transforms (entrance animation)
    let layoutTop = 0;
    for (let el = chatTarget; el; el = el.offsetParent) {
      layoutTop += el.offsetTop;
    }
    const targetY = Math.max(0, layoutTop - navH);
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
