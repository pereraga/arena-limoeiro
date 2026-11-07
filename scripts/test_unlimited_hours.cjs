const assert = require("assert");

function parseTimeToMinutes(t) {
  if (!t || typeof t !== "string") return 0;
  const parts = t.trim().split(":");
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || "0", 10);
}

function formatMinutesToTime(m) {
  const h = Math.floor(m / 60) % 24;
  const min = m % 60;
  return String(h).padStart(2, "0") + ":" + String(min).padStart(2, "0");
}

class BalcaoRangeEngine {
  constructor(start = "11:00", end = "12:00", hasInteracted = false) {
    this.start = start;
    this.end = end;
    this.hasInteracted = hasInteracted;
    this.occupied = [];
    this.history = [];
  }

  hasConflict(fromM, toM) {
    const s = Math.min(fromM, toM);
    const e = Math.max(fromM, toM);
    return this.occupied.some(r => Math.max(s, r.start) < Math.min(e, r.end));
  }

  click(slotTime) {
    const clickedMin = parseTimeToMinutes(slotTime);
    let curStartMin = parseTimeToMinutes(this.start);
    let curEndMin = parseTimeToMinutes(this.end);

    this.history.push({ start: this.start, end: this.end, hasInteracted: this.hasInteracted });

    // 1. Primeiro clique do usuário após abrir o modal
    if (!this.hasInteracted) {
      this.start = slotTime;
      const defEnd = !this.hasConflict(clickedMin, clickedMin + 30) ? (clickedMin + 30) : (clickedMin + 60);
      this.end = formatMinutesToTime(defEnd);
      this.hasInteracted = true;
      return;
    }

    // 2. Clique posterior ao início atual (clickedMin > curStartMin)
    if (clickedMin > curStartMin) {
      if (this.hasConflict(curStartMin, clickedMin)) {
        // Conflito no caminho: inicia nova seleção no slot clicado
        this.start = slotTime;
        this.end = formatMinutesToTime(clickedMin + 30);
      } else if (clickedMin > curEndMin) {
        // Estende o Fim diretamente para o slot clicado - SEM LIMITE de horas! (3h, 5h, 8h, etc.)
        this.end = slotTime;
      } else if (clickedMin === curEndMin) {
        // Clicou exatamente no Fim atual: se tiver mais de 30min, reduz 30min
        const duration = curEndMin - curStartMin;
        if (duration > 30) {
          this.end = formatMinutesToTime(curEndMin - 30);
        } else {
          this.end = slotTime;
        }
      } else {
        // Clicou em slot intermediário (curStartMin < clickedMin < curEndMin): ajusta Fim para cá
        this.end = slotTime;
      }
      return;
    }

    // 3. Clique exatamente no início atual
    if (clickedMin === curStartMin) {
      const duration = curEndMin - curStartMin;
      if (duration > 30) {
        this.end = formatMinutesToTime(curStartMin + 30);
      }
      return;
    }

    // 4. Clique anterior ao início atual (clickedMin < curStartMin)
    if (clickedMin < curStartMin) {
      if (curStartMin - clickedMin <= 120 && !this.hasConflict(clickedMin, curEndMin)) {
        this.start = slotTime;
      } else {
        this.start = slotTime;
        this.end = formatMinutesToTime(clickedMin + 30);
      }
      return;
    }
  }

  getDurationHours() {
    return (parseTimeToMinutes(this.end) - parseTimeToMinutes(this.start)) / 60;
  }

  getSelectedSlots() {
    const s = parseTimeToMinutes(this.start);
    const e = parseTimeToMinutes(this.end);
    const slots = [];
    for (let m = s; m <= e; m += 30) {
      slots.push(formatMinutesToTime(m));
    }
    return slots;
  }
}

// TEST 1: Select 3 hours (12:00 to 15:00)
console.log("=== TEST 1: Select 3 hours (12:00 -> 15:00) ===");
const engine1 = new BalcaoRangeEngine();
engine1.click("12:00");
engine1.click("15:00");
console.log("Range:", engine1.start, "às", engine1.end);
console.log("Duration:", engine1.getDurationHours(), "horas");
console.log("Selected slots:", engine1.getSelectedSlots().join(" -> "));
assert.strictEqual(engine1.start, "12:00");
assert.strictEqual(engine1.end, "15:00");
assert.strictEqual(engine1.getDurationHours(), 3);
assert.deepStrictEqual(engine1.getSelectedSlots(), ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00"]);

// TEST 2: Select 5 hours (12:00 to 17:00)
console.log("\n=== TEST 2: Select 5 hours (12:00 -> 17:00) ===");
const engine2 = new BalcaoRangeEngine();
engine2.click("12:00");
engine2.click("17:00");
console.log("Range:", engine2.start, "às", engine2.end);
console.log("Duration:", engine2.getDurationHours(), "horas");
console.log("Selected slots:", engine2.getSelectedSlots().join(" -> "));
assert.strictEqual(engine2.start, "12:00");
assert.strictEqual(engine2.end, "17:00");
assert.strictEqual(engine2.getDurationHours(), 5);
assert.strictEqual(engine2.getSelectedSlots().length, 11);

// TEST 3: Step-by-step 30 min accumulation up to 3h
console.log("\n=== TEST 3: Step-by-step from 12:00 to 15:00 ===");
const engine3 = new BalcaoRangeEngine();
engine3.click("12:00"); // 12:00 - 12:30 (30 min)
engine3.click("12:30"); // 30 min
engine3.click("13:00"); // 1h
engine3.click("13:30"); // 1h30
engine3.click("14:00"); // 2h
engine3.click("14:30"); // 2h30
engine3.click("15:00"); // 3h
console.log("Range:", engine3.start, "às", engine3.end);
console.log("Duration:", engine3.getDurationHours(), "horas");
assert.strictEqual(engine3.getDurationHours(), 3);

// TEST 4: Trimming from 5h back to 3h
console.log("\n=== TEST 4: Trimming from 5h (17:00) back to 3h (15:00) ===");
engine2.click("15:00"); // click 15:00 to cut back
console.log("Range:", engine2.start, "às", engine2.end);
console.log("Duration:", engine2.getDurationHours(), "horas");
assert.strictEqual(engine2.end, "15:00");
assert.strictEqual(engine2.getDurationHours(), 3);

console.log("\nALL TESTS PASSED WITH 100% SUCCESS!");
