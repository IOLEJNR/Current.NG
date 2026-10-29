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
  outageModal.classList.remove("visible");
  outageForm.reset();
  showToast("Thank you. Your outage report and location will all be looked into.");
});
