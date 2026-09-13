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
  const reloadKey = "mlsFreshWorkerReloaded";
  const justReloaded = sessionStorage.getItem(reloadKey) === "1";
  if (justReloaded) sessionStorage.removeItem(reloadKey);

  window.addEventListener("load", async () => {
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing || justReloaded) return;
      refreshing = true;
      sessionStorage.setItem(reloadKey, "1");
      location.reload();
    });

    try {
      const registration = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
      await registration.update();
    } catch (error) {
      console.warn("MLS: no fue posible comprobar una actualización del service worker.", error);
    }
  });
})();
</script>`;

  if (html.includes("</body>")) html = html.replace("</body>", `${script}\n</body>`);
  else html += script;
}

fs.writeFileSync(indexPath, html, "utf8");
console.log("Actualización automática de caché habilitada.");
