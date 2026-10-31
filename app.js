function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

const hoursInput = document.querySelector("#hours-input");
const hoursValue = document.querySelector("#hours-value");
const priceInput = document.querySelector("#price-input");
const monthlyCost = document.querySelector("#monthly-cost");
const reportButton = document.querySelector("#report-button");
const toast = document.querySelector("#toast");
const outageModal = document.querySelector("#outage-modal");
const modalClose = document.querySelector("#modal-close");
const outageForm = document.querySelector("#outage-form");
let toastTimer;

const formatNaira = (amount) =>
  `₦${Math.round(amount).toLocaleString("en-NG")}`;

function updateEstimate() {
  const hours = Number(hoursInput.value);
  const price = Math.min(
    10000,
    Math.max(0, Number(priceInput.value) || 0),
  );
  const dailyHours = Math.min(12, Math.max(0, hours));

  hoursValue.textContent = String(dailyHours);
  monthlyCost.textContent = formatNaira(dailyHours * 0.8 * price * 30);
  hoursInput.style.background =
    `linear-gradient(to right, #7a9e55 0%, #7a9e55 ` +
    `${dailyHours / 12 * 100}%, #e2e5db ${dailyHours / 12 * 100}%)`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 3200);
}

hoursInput.addEventListener("input", updateEstimate);
priceInput.addEventListener("input", updateEstimate);
reportButton.addEventListener("click", () => {
  outageModal.classList.add("visible");
});

modalClose.addEventListener("click", () => {
  outageModal.classList.remove("visible");
});

outageModal.addEventListener("click", (event) => {
  if (event.target === outageModal) {
    outageModal.classList.remove("visible");
  }
});

outageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const location = document.querySelector("#outage-location").value.trim();
  const duration = document.querySelector("#outage-time").value;
  const storedReports = readStorage("currentNgComplaints", []);
  const reports = Array.isArray(storedReports) ? storedReports : [];
  const savedLocation = readStorage("currentNgLocation", null);
  reports.unshift({
    id: Date.now(),
    location,
    duration,
    status: "pending",
    created: "Submitted just now",
    provider: savedLocation?.provider || "Provider not provided",
    coordinates: savedLocation ? `${savedLocation.latitude.toFixed(5)}, ${savedLocation.longitude.toFixed(5)}` : "Location permission not granted",
  });
  localStorage.setItem("currentNgComplaints", JSON.stringify(reports));
  outageModal.classList.remove("visible");
  outageForm.reset();
  showToast("Your complaint was sent to the admin review queue.");
});

function renderApprovedComplaints() {
  const areaList = document.querySelector(".area-list");
  if (!areaList) return;
  const reports = readStorage("currentNgComplaints", []);
  if (!Array.isArray(reports)) return;
  reports.filter((report) => report.status === "approved").forEach((report) => {
    const card = document.createElement("article");
    card.className = "area-card approved-complaint";
    card.innerHTML = `
      <div class="area-icon outage-icon" aria-hidden="true">↯</div>
      <div class="area-info">
        <h3>${report.location.replace(/[<>&]/g, (char) => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[char]))}</h3>
        <p>Power off · community report</p>
        <p class="area-reason">Out for: ${report.duration}</p>
        <p class="area-eta">Admin approved${report.adminNote ? " · " + report.adminNote.replace(/[<>&]/g, (char) => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[char])) : ""}</p>
      </div>
      <span class="area-status off-status">OFF</span>`;
    areaList.appendChild(card);
  });
}

renderApprovedComplaints();

const currentTips = [
  "Unplug sensitive electronics during a changeover. A voltage stabiliser can help protect them when supply returns.",
  "Keep your phone and power bank charged before predicted outage hours when possible.",
  "Switch off high-load appliances before supply returns to reduce sudden load stress.",
  "Never connect a generator directly to a wall socket; use a properly installed changeover switch.",
  "Keep generator vents clear and fuel away from living areas to reduce fire and carbon-monoxide risks.",
  "Charge essential medical devices first during planned or community-reported outages.",
];

const tipText = document.querySelector(".tip-card p");
const tipLabel = document.querySelector(".tip-label span");
const randomTip = currentTips[Math.floor(Math.random() * currentTips.length)];
if (tipText) tipText.textContent = randomTip;
if (tipLabel) tipLabel.textContent = "· " + String(currentTips.indexOf(randomTip) + 1).padStart(2, "0");

const savedLocation = readStorage("currentNgLocation", null);
const providerText = document.querySelector("#provider-button .provider-text");
if (savedLocation && providerText) {
  providerText.textContent = savedLocation.area === "Lagos" ? "Ikeja Electric" : savedLocation.provider;
  providerText.title = savedLocation.provider;
}
