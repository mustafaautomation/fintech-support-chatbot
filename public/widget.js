(function () {
  var scripts = document.querySelectorAll('script[src*="widget.js"]');
  var script = scripts[scripts.length - 1];
  var endpoint = (script && script.dataset && script.dataset.endpoint) || "";
  var root = endpoint.replace(/\/$/, "");
  var position = (script && script.dataset && script.dataset.position) || "right";
  var instant = (script && script.dataset && script.dataset.instant) === "true" || /embed-demo/.test(location.pathname);
  var side = position === "left" ? "left" : "right";
  var nudges = [
    {
      label: "Dispute a charge",
      prompt: "I don't recognize the Night Market Electronics charge. Please dispute it.",
    },
    {
      label: "Card was declined",
      prompt: "My card was declined. Please lock my card.",
    },
  ];
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ready = false;
  var queued = "";
  var open = false;

  var style = document.createElement("style");
  style.textContent = [
    ".lumen-fab{position:fixed;z-index:2147483000;width:60px;height:60px;border:0;border-radius:999px;background:#16352b;color:#f6f1e4;box-shadow:0 8px 24px rgba(22,53,43,.35),inset 0 1px 0 rgba(255,255,255,.25);cursor:pointer;display:inline-flex;align-items:center;justify-content:center}",
    ".lumen-fab:hover{transform:scale(1.06)}",
    ".lumen-fab:active{transform:scale(.96)}",
    ".lumen-fab:focus-visible{outline:3px solid #16352b;outline-offset:3px}",
    ".lumen-frame{position:fixed;z-index:2147483000;width:400px;height:min(680px,calc(100dvh - 124px));border:0;background:transparent;border-radius:24px;box-shadow:0 18px 50px rgba(15,18,22,.2)}",
    ".lumen-pills{position:fixed;z-index:2147483000;display:flex;flex-direction:column;gap:8px;align-items:flex-end}",
    ".lumen-pill{height:36px;padding:0 14px;border-radius:999px;border:1px solid rgba(226,214,196,.9);background:rgba(255,252,248,.92);color:#16352b;font:500 13px/36px ui-sans-serif,system-ui,sans-serif;cursor:pointer}",
    ".lumen-dismiss{width:24px;height:24px;border:0;border-radius:999px;background:transparent;color:#3e5348;cursor:pointer}",
    "@media(max-width:639px){.lumen-fab{width:56px;height:56px}.lumen-frame{width:100dvw;height:100dvh;inset:0!important;border-radius:0;box-shadow:none}}",
    "@media(prefers-reduced-motion:reduce){.lumen-fab,.lumen-frame,.lumen-pill{transition:none!important;transform:none!important}}",
  ].join("");
  document.head.appendChild(style);

  function edge(px) {
    return side + ":" + px + "px";
  }

  var button = document.createElement("button");
  button.type = "button";
  button.className = "lumen-fab";
  button.setAttribute("data-testid", "chat-launcher");
  button.setAttribute("aria-label", "Open chat with Lumen support");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "lumen-support-frame");
  button.style.cssText = "bottom:24px;" + edge("24px");
  button.innerHTML =
    '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" stroke="currentColor" stroke-width="2"></rect><path d="M3.5 9.5h17" stroke="currentColor" stroke-width="2"></path><path d="M8 14.5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>';

  var frame = document.createElement("iframe");
  frame.id = "lumen-support-frame";
  frame.className = "lumen-frame";
  frame.title = "Lumen Card support";
  frame.src = root + "/embed";
  frame.style.cssText = "display:none;bottom:100px;" + edge("24px");

  var teaser = document.createElement("button");
  teaser.type = "button";
  teaser.setAttribute("data-testid", "launcher-teaser");
  teaser.textContent = "Don't recognize a charge? I can open a dispute.";
  teaser.style.cssText =
    "position:fixed;z-index:2147483000;display:none;max-width:240px;padding:10px 28px 10px 12px;border-radius:16px;border:1px solid #e2d6c4;background:#fffcf8;color:#16352b;font:500 13px/1.3 ui-sans-serif,system-ui,sans-serif;text-align:left;cursor:pointer;bottom:96px;" +
    edge("92px");
  var teaserX = document.createElement("span");
  teaserX.textContent = "×";
  teaserX.setAttribute("aria-label", "Dismiss teaser");
  teaserX.style.cssText = "position:absolute;top:4px;right:8px";
  teaser.appendChild(teaserX);
  var teaserOff = false;
  try {
    teaserOff = localStorage.getItem("lumen-teaser-off") === "1";
  } catch {
    teaserOff = false;
  }
  if (!teaserOff) {
    window.setTimeout(function () {
      teaser.style.display = "block";
    }, 4000);
  }
  teaser.addEventListener("click", function (event) {
    if (event.target === teaserX) {
      teaser.style.display = "none";
      try {
        localStorage.setItem("lumen-teaser-off", "1");
      } catch {
        /* ignore */
      }
      return;
    }
    sendPrompt("I don't recognize the Night Market Electronics charge. Please dispute it.");
  });

  var pills = document.createElement("div");
  pills.className = "lumen-pills";
  pills.style.cssText = "bottom:96px;" + edge("24px");
  var dismissed = false;
  try {
    dismissed = sessionStorage.getItem("lumen-nudges-off") === "1";
  } catch {
    dismissed = false;
  }
  if (!dismissed) {
    var dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.className = "lumen-dismiss";
    dismiss.setAttribute("aria-label", "Dismiss suggestions");
    dismiss.textContent = "×";
    dismiss.addEventListener("click", function () {
      pills.remove();
      try {
        sessionStorage.setItem("lumen-nudges-off", "1");
      } catch {
        /* session storage can be blocked */
      }
    });
    pills.appendChild(dismiss);
    nudges.forEach(function (nudge, index) {
      var pill = document.createElement("button");
      pill.type = "button";
      pill.className = "lumen-pill";
      pill.setAttribute("data-testid", "launcher-nudge");
      pill.textContent = nudge.label;
      if (!reduced) {
        pill.style.opacity = "0";
        pill.style.transform = "translateY(8px)";
        pill.style.transition = "opacity 220ms cubic-bezier(.22,1,.36,1), transform 220ms cubic-bezier(.22,1,.36,1)";
        window.setTimeout(function () {
          pill.style.opacity = "1";
          pill.style.transform = "none";
        }, (instant ? 0 : 1200) + index * 70);
      }
      pill.addEventListener("click", function () {
        sendPrompt(nudge.prompt);
      });
      pills.appendChild(pill);
    });
  }

  function post(payload) {
    if (frame.contentWindow) frame.contentWindow.postMessage(payload, "*");
  }

  function setOpen(next) {
    open = next;
    var mobile = window.matchMedia("(max-width: 639px)").matches;
    frame.style.display = next ? "block" : "none";
    if (pills) pills.style.display = next ? "none" : "flex";
    if (!next && !teaserOff) teaser.style.display = "block";
    if (next) teaser.style.display = "none";
    if (!reduced && next) {
      frame.animate(
        mobile
          ? [{ opacity: 0, transform: "translateY(12%)" }, { opacity: 1, transform: "none" }]
          : [
              { opacity: 0, transform: "translateY(18px) scale(.94)" },
              { opacity: 1, transform: "none" },
            ],
        { duration: mobile ? 300 : 280, easing: "cubic-bezier(.22,1,.36,1)" },
      );
    }
    button.setAttribute("aria-expanded", next ? "true" : "false");
    button.setAttribute("aria-label", next ? "Close chat" : "Open chat with Lumen support");
    button.innerHTML = next
      ? '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>'
      : '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" stroke="currentColor" stroke-width="2"></rect><path d="M3.5 9.5h17" stroke="currentColor" stroke-width="2"></path><path d="M8 14.5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>';
    if (mobile) button.style.display = next ? "none" : "inline-flex";
    if (next) frame.focus();
    else button.focus();
  }

  function sendPrompt(text) {
    setOpen(true);
    if (ready) post({ source: "lumen-host", type: "prompt", text: text });
    else queued = text;
  }

  button.addEventListener("click", function () {
    setOpen(!open);
  });
  window.addEventListener("message", function (event) {
    if (!event.data || event.source !== frame.contentWindow) return;
    if (event.data.source === "lumen-embed" && event.data.type === "ready") {
      ready = true;
      var theme = script && script.dataset ? script.dataset.theme : "";
      if (theme) post({ source: "lumen-host", type: "theme", theme: theme });
      if (queued) {
        post({ source: "lumen-host", type: "prompt", text: queued });
        queued = "";
      }
    }
    if (event.data.source === "lumen-embed" && event.data.type === "close") setOpen(false);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && open) setOpen(false);
  });
  var mobileQuery = window.matchMedia("(max-width: 639px)");
  function place() {
    var pad = mobileQuery.matches ? "16px" : "24px";
    button.style.bottom = pad;
    button.style[side] = pad;
    frame.style.bottom = mobileQuery.matches ? "0" : "100px";
    frame.style[side] = mobileQuery.matches ? "0" : pad;
    pills.style.bottom = mobileQuery.matches ? "84px" : "96px";
    pills.style[side] = pad;
  }
  place();
  mobileQuery.addEventListener("change", place);
  document.body.appendChild(teaser);
  document.body.appendChild(frame);
  if (!dismissed) document.body.appendChild(pills);
  document.body.appendChild(button);
})();
