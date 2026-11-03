(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const loading = $("#loading");
  const errorPanel = $("#load-error");
  const app = $("#booking-app");
  const map = $("#seat-map");
  const dialog = $("#checkout-dialog");
  const form = $("#checkout-form");
  const continueButton = $("#continue-button");
  const announcement = $("#announcement");
  const money = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

  let eventData = null;
  let selected = [];
  let activeSeat = "A1";

  async function loadEvent() {
    loading.hidden = false;
    errorPanel.hidden = true;
    app.hidden = true;
    try {
      const response = await fetch("./event.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      validateEvent(data);
      eventData = data;
      // textContent is intentional: the supplied event name contains HTML
      // that must be displayed as text, never interpreted as markup.
      $("#event-title").textContent = data.name;
      selected = [];
      render();
      loading.hidden = true;
      app.hidden = false;
    } catch (error) {
      console.error("Could not load event:", error);
      loading.hidden = true;
      errorPanel.hidden = false;
    }
  }

  function validateEvent(data) {
    if (!data || !data.categories || !data.rows || !Array.isArray(data.sold)) {
      throw new Error("Invalid event data");
    }
    for (const row of ["A", "B", "C", "D", "E", "F"]) {
      if (!data.rows[row] || !Number.isInteger(data.categories[data.rows[row]])) {
        throw new Error(`Missing category for row ${row}`);
      }
    }
  }

  function render() {
    renderMap();
    renderSummary();
    $("#problems").hidden = true;
  }

  function renderMap() {
    map.replaceChildren();
    for (const row of Object.keys(eventData.rows)) {
      const rowElement = document.createElement("div");
      rowElement.className = "seat-row";
      rowElement.setAttribute("role", "row");
      const label = document.createElement("span");
      label.className = "row-label";
      label.textContent = row;
      label.setAttribute("aria-hidden", "true");
      rowElement.append(label);

      for (let number = 1; number <= 10; number += 1) {
        const id = `${row}${number}`;
        const button = document.createElement("button");
        const isSold = eventData.sold.includes(id);
        const isSelected = selected.includes(id);
        const category = eventData.rows[row];
        const price = money.format(SeatBooking.getSeatPrice(eventData, id) / 100);
        const status = isSold ? "sold" : isSelected ? "selected" : "available";
        button.type = "button";
        button.className = `seat ${status}`;
        button.textContent = String(number);
        button.dataset.seat = id;
        button.setAttribute("role", "gridcell");
        button.setAttribute("aria-label", `Row ${row}, seat ${number}, ${category}, ${price}, ${status}`);
        button.setAttribute("aria-pressed", String(isSelected));
        button.disabled = isSold;
        button.tabIndex = id === activeSeat ? 0 : -1;
        button.addEventListener("click", () => {
          const result = SeatBooking.toggleSeat(eventData, selected, id);
          if (result.problems.length) {
            showProblems(result.problems);
            return;
          }
          selected = result.selected;
          activeSeat = id;
          render();
          const target = map.querySelector(`[data-seat="${id}"]`);
          if (target) target.focus();
        });
        button.addEventListener("focus", () => {
          activeSeat = id;
          map.querySelectorAll(".seat").forEach(seat => { seat.tabIndex = seat === button ? 0 : -1; });
        });
        button.addEventListener("keydown", handleSeatKeydown);
        rowElement.append(button);
      }
      map.append(rowElement);
    }
  }

  function handleSeatKeydown(event) {
    const directions = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] };
    if (!directions[event.key]) return;
    event.preventDefault();
    const rows = Object.keys(eventData.rows);
    const [row, number] = [event.currentTarget.dataset.seat[0], Number(event.currentTarget.dataset.seat.slice(1))];
    const [dr, dc] = directions[event.key];
    let r = rows.indexOf(row) + dr;
    let c = number + dc;
    r = Math.max(0, Math.min(rows.length - 1, r));
    c = Math.max(1, Math.min(10, c));
    const destination = map.querySelector(`[data-seat="${rows[r]}${c}"]`);
    if (destination && !destination.disabled) destination.focus();
  }

  function renderSummary() {
    const price = SeatBooking.calculatePrice(eventData, selected);
    $("#seat-count").textContent = `${selected.length} / 6`;
    const list = $("#selected-list");
    list.replaceChildren();
    if (!selected.length) {
      const item = document.createElement("li");
      item.textContent = "No seats selected";
      list.append(item);
    } else {
      selected.forEach(id => {
        const item = document.createElement("li");
        item.textContent = `Row ${id[0]}, seat ${id.slice(1)} — ${money.format(SeatBooking.getSeatPrice(eventData, id) / 100)}`;
        list.append(item);
      });
    }
    $("#subtotal").textContent = money.format(price.subtotal / 100);
    $("#discount").textContent = `−${money.format(price.discount / 100)}`;
    $("#total").textContent = money.format(price.total / 100);
    $("#discount-note").textContent = selected.length >= 4 ? "10% discount applied." : "Book 4 or more seats to receive 10% off.";
  }

  function showProblems(problems) {
    const panel = $("#problems");
    panel.replaceChildren();
    const heading = document.createElement("strong");
    heading.textContent = "Please fix the following:";
    const list = document.createElement("ul");
    problems.forEach(problem => {
      const item = document.createElement("li");
      item.textContent = problem;
      list.append(item);
    });
    panel.append(heading, list);
    panel.hidden = false;
  }

  continueButton.addEventListener("click", () => {
    const problems = SeatBooking.getProblems(eventData, selected);
    if (problems.length) {
      showProblems(problems);
      return;
    }
    $("#problems").hidden = true;
    $("#checkout-problems").hidden = true;
    $("#name-error").hidden = true;
    $("#email-error").hidden = true;
    dialog.showModal();
    $("#customer-name").focus();
  });

  function closeDialog() {
    dialog.close();
    continueButton.focus();
  }
  $("#close-dialog").addEventListener("click", closeDialog);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = $("#customer-name").value.trim();
    const email = $("#customer-email").value.trim();
    const nameError = $("#name-error");
    const emailError = $("#email-error");
    nameError.hidden = true;
    emailError.hidden = true;
    const problems = [];
    let firstInvalid = null;

    if (!name) {
      nameError.textContent = "Enter your name.";
      nameError.hidden = false;
      problems.push("Name is required.");
      firstInvalid ||= $("#customer-name");
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailError.textContent = "Enter a valid email address.";
      emailError.hidden = false;
      problems.push("A valid email address is required.");
      firstInvalid ||= $("#customer-email");
    }
    if (problems.length) {
      const panel = $("#checkout-problems");
      panel.textContent = problems.join(" ");
      panel.hidden = false;
      firstInvalid.focus();
      return;
    }

    eventData.sold = [...new Set([...eventData.sold, ...selected])];
    selected = [];
    dialog.close();
    render();
    announcement.textContent = "Booking confirmed";
    form.reset();
    continueButton.focus();
  });

  $("#retry-button").addEventListener("click", loadEvent);
  loadEvent();
})();
