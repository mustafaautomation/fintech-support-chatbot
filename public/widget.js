(function () {
  var scripts = document.querySelectorAll('script[src*="widget.js"]');
  var script = scripts[scripts.length - 1];
  var endpoint = (script && script.dataset && script.dataset.endpoint) || "";
  var root = endpoint.replace(/\/$/, "");
  var button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", "Open Lumen support chat");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "lumen-support-frame");
  button.textContent = "Chat";
  button.style.cssText = [
    "position:fixed",
    "z-index:2147483000",
    "right:16px",
    "bottom:16px",
    "height:52px",
    "min-width:52px",
    "padding:0 16px",
    "border:0",
    "border-radius:999px",
    "background:#1f4d3a",
    "color:#f6f1e4",
    "font:600 15px/1 Outfit,sans-serif",
    "box-shadow:0 12px 30px rgba(20,40,32,.28)",
    "cursor:pointer",
  ].join(";");
  var frame = document.createElement("iframe");
  frame.id = "lumen-support-frame";
  frame.title = "Lumen Card support";
  frame.src = root + "/embed";
  frame.style.cssText = [
    "position:fixed",
    "z-index:2147483000",
    "right:16px",
    "bottom:78px",
    "width:min(380px,calc(100vw - 24px))",
    "height:min(640px,calc(100vh - 110px))",
    "border:0",
    "border-radius:18px",
    "box-shadow:0 18px 50px rgba(20,40,32,.28)",
    "background:#f7f3eb",
    "display:none",
  ].join(";");
  function setOpen(open) {
    frame.style.display = open ? "block" : "none";
    button.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) frame.focus();
  }
  button.addEventListener("click", function () {
    setOpen(button.getAttribute("aria-expanded") !== "true");
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setOpen(false);
  });
  document.body.appendChild(frame);
  document.body.appendChild(button);
})();
