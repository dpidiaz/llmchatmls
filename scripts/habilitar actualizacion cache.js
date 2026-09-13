import fs from "node:fs";

const indexPath = "public/index.html";
if (!fs.existsSync(indexPath)) {
  throw new Error("No se encontró public/index.html para habilitar actualización automática.");
}

let html = fs.readFileSync(indexPath, "utf8");
const marker = 'id="mls-fresh-deploy"';

if (!html.includes(marker)) {
  const script = `
<script id="mls-fresh-deploy">
(() => {
  if (!("serviceWorker" in navigator)) return;

  const reloadKey = "mlsFreshWorkerReloadedAt";
  let refreshing = false;
  let registration = null;

  const reloadedRecently = () => {
    const at = Number(sessionStorage.getItem(reloadKey) || 0);
    return Number.isFinite(at) && Date.now() - at < 5000;
  };

  async function checkForUpdate() {
    if (!navigator.onLine) return;
    try {
      registration = registration || await navigator.serviceWorker.getRegistration("/") || await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
      await registration.update();
    } catch (error) {
      console.warn("MLS: no fue posible comprobar una actualización del service worker.", error);
    }
  }

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing || reloadedRecently()) return;
    refreshing = true;
    sessionStorage.setItem(reloadKey, String(Date.now()));
    location.reload();
  });

  window.addEventListener("load", async () => {
    try {
      registration = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
    } catch (error) {
      console.warn("MLS: no fue posible registrar el service worker.", error);
      return;
    }
    await checkForUpdate();
  });

  window.addEventListener("hashchange", () => {
    if (location.hash.startsWith("#entry=")) checkForUpdate();
  });
})();
</script>`;

  if (html.includes("</body>")) html = html.replace("</body>", `${script}\n</body>`);
  else html += script;
}

fs.writeFileSync(indexPath, html, "utf8");
console.log("Actualización automática de caché habilitada al cargar y al cambiar de entrada.");
