/* Storage section: safely reads local JSON without breaking the static demo on corrupt data */
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
/* Outage dialog section: opens, closes, and submits community fault reports */
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
      <div class="area-icon outage-icon" aria-hidden="true"><i class="bx bx-power-off bx-tada"></i></div>
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

/* Live-location section: displays the resolved place and refreshes provider matching from device coordinates */
async function reverseGeocode(latitude, longitude) {
  const response = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
  );
  if (!response.ok) throw new Error("Reverse geocoding unavailable");
  return response.json();
}

function providerFromPlace(place) {
  const state = (place.principalSubdivision || place.state || "").toLowerCase();
  const locality = (place.locality || place.city || "").toLowerCase();
  const ekoAreas = ["lagos island","victoria island","lekki","ikoyi","ajah","apapa","surulere","festac","amuwo odofin","badagry","ojo"];
  if (state.includes("lagos") && ekoAreas.some((name) => locality.includes(name))) return "Eko Electricity Distribution Company (EKEDC)";
  const providerMap = {
    lagos: "Ikeja Electric (IKEDC)", abuja: "Abuja Electricity Distribution Company (AEDC)", "federal capital territory": "Abuja Electricity Distribution Company (AEDC)",
    nasarawa: "Abuja Electricity Distribution Company (AEDC)", niger: "Abuja Electricity Distribution Company (AEDC)", kogi: "Abuja Electricity Distribution Company (AEDC)",
    rivers: "Port Harcourt Electricity Distribution (PHED)", "cross river": "Port Harcourt Electricity Distribution (PHED)", "akwa ibom": "Port Harcourt Electricity Distribution (PHED)", bayelsa: "Port Harcourt Electricity Distribution (PHED)",
    enugu: "Enugu Electricity Distribution (EEDC)", abia: "Enugu Electricity Distribution (EEDC)", anambra: "Enugu Electricity Distribution (EEDC)", ebonyi: "Enugu Electricity Distribution (EEDC)", imo: "Enugu Electricity Distribution (EEDC)",
    kano: "Kano Electricity Distribution (KEDCO)", jigawa: "Kano Electricity Distribution (KEDCO)",
    edo: "Benin Electricity Distribution Company (BEDC)", delta: "Benin Electricity Distribution Company (BEDC)", ekiti: "Benin Electricity Distribution Company (BEDC)", ondo: "Benin Electricity Distribution Company (BEDC)",
    oyo: "Ibadan Electricity Distribution Company (IBEDC)", ogun: "Ibadan Electricity Distribution Company (IBEDC)", osun: "Ibadan Electricity Distribution Company (IBEDC)", kwara: "Ibadan Electricity Distribution Company (IBEDC)",
    kaduna: "Kaduna Electric (KAEDCO)", kebbi: "Kaduna Electric (KAEDCO)", sokoto: "Kaduna Electric (KAEDCO)", zamfara: "Kaduna Electric (KAEDCO)",
    plateau: "Jos Electricity Distribution (JED)", bauchi: "Jos Electricity Distribution (JED)", gombe: "Jos Electricity Distribution (JED)", benue: "Jos Electricity Distribution (JED)",
    adamawa: "Yola Electricity Distribution Company (YEDC)", borno: "Yola Electricity Distribution Company (YEDC)", taraba: "Yola Electricity Distribution Company (YEDC)", yobe: "Yola Electricity Distribution Company (YEDC)",
  };
  return providerMap[state] || "Provider confirmation needed — verify your service address";
}

function renderLiveLocation(location) {
  const providerText = document.querySelector("#provider-button .provider-text");
  const statusKicker = document.querySelector(".status-kicker");
  const placeName = location.locality || location.area || "Your area";
  const providerName = location.provider || "Nigerian Electricity Distribution Network";
  if (providerText) {
    providerText.textContent = `${placeName}, ${location.state || location.area || "NG"}`;
    providerText.title = providerName;
  }
  if (statusKicker) statusKicker.textContent = `${placeName} · ${providerName}`;
}

async function refreshLiveLocation() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    try {
      const place = await reverseGeocode(coords.latitude, coords.longitude);
      const location = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        locality: place.locality || place.city || place.principalSubdivision || "Your area",
        state: place.principalSubdivision || place.city || "",
        area: place.city || place.locality || place.principalSubdivision || "Nigeria",
        provider: providerFromPlace(place),
        matchedAt: new Date().toISOString(),
      };
      localStorage.setItem("currentNgLocation", JSON.stringify(location));
      renderLiveLocation(location);
      showToast(`Location updated: ${location.locality} · ${location.provider}`);
    } catch {
      const saved = readStorage("currentNgLocation", null);
      if (saved) renderLiveLocation(saved);
      showToast("Place lookup is unavailable. Your saved location is still in use.");
    }
  }, () => showToast("Location permission was not granted."), {
    enableHighAccuracy: true, timeout: 10000, maximumAge: 300000,
  });
}

const savedLocation = readStorage("currentNgLocation", null);
if (savedLocation) renderLiveLocation(savedLocation);
document.querySelector("#provider-button")?.addEventListener("click", refreshLiveLocation);
