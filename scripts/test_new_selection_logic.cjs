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

class BalcaoSelectionState {
  constructor(start = "11:00", end = "12:00", hasInteracted = false) {
    this.start = start;
    this.end = end;
    this.hasInteracted = hasInteracted;
    this.occupied = []; // e.g. [{ start: 19*60, end: 20*60 }]
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

    // Save history
    this.history.push({ start: this.start, end: this.end, hasInteracted: this.hasInteracted });

    // 1. First interaction after modal opened
    if (!this.hasInteracted) {
      this.start = slotTime;
      const defEnd = !this.hasConflict(clickedMin, clickedMin + 30) ? (clickedMin + 30) : (clickedMin + 60);
      this.end = formatMinutesToTime(defEnd);
      this.hasInteracted = true;
      return;
    }

    // 2. User clicked AFTER current start
    if (clickedMin > curStartMin) {
      // Check conflict between current start and clickedMin
      if (this.hasConflict(curStartMin, clickedMin)) {
        // There is an occupied block in between -> start fresh at clickedMin
        this.start = slotTime;
        this.end = formatMinutesToTime(clickedMin + 30);
        return;
      }

      // Subcase A: clicked slot is beyond current end -> EXTEND
      if (clickedMin > curEndMin) {
        // If it's unreasonably far (> 3 hours ahead of end) with no prior continuity, start fresh
        if (clickedMin - curEndMin > 180) {
          this.start = slotTime;
          this.end = formatMinutesToTime(clickedMin + 30);
        } else {
          this.end = slotTime;
        }
        return;
      }

      // Subcase B: clicked slot is EXACTLY the current end
      if (clickedMin === curEndMin) {
        const duration = curEndMin - curStartMin;
        if (duration > 30) {
          // Trim last 30 minutes
          this.end = formatMinutesToTime(curEndMin - 30);
        } else {
          // Already 30 min -> keep at 30 min (confirmed)
          this.end = slotTime;
        }
        return;
      }

      // Subcase C: clicked slot is between start and end (curStartMin < clickedMin < curEndMin)
      // Adjust end to this slot
      this.end = slotTime;
      return;
    }

    // 3. User clicked EXACTLY current start
    if (clickedMin === curStartMin) {
      const duration = curEndMin - curStartMin;
      if (duration > 30) {
        // Reset to minimum 30 min from start
        this.end = formatMinutesToTime(curStartMin + 30);
      } else {
        // Already 30 min -> keep
        this.end = formatMinutesToTime(curStartMin + 30);
      }
      return;
    }

    // 4. User clicked BEFORE current start (clickedMin < curStartMin)
    if (clickedMin < curStartMin) {
      // Check if nearby backward expansion without conflict
      if (curStartMin - clickedMin <= 120 && !this.hasConflict(clickedMin, curEndMin)) {
        this.start = slotTime;
      } else {
        // Distant slot or conflict -> start fresh at clickedMin
        this.start = slotTime;
        this.end = formatMinutesToTime(clickedMin + 30);
      }
      return;
    }
  }

  undo() {
    if (this.history.length > 0) {
      const prev = this.history.pop();
      this.start = prev.start;
      this.end = prev.end;
      this.hasInteracted = prev.hasInteracted;
    }
  }

  getDurationMin() {
    return parseTimeToMinutes(this.end) - parseTimeToMinutes(this.start);
  }
}

// TEST 1: The user's exact flow
console.log("=== RUNNING TEST 1: User's exact flow (12:00, 12:30, 13:00) ===");
const state1 = new BalcaoSelectionState("11:00", "12:00", false);
// Modal opened with default 11:00-12:00. User clicks 12:00:
state1.click("12:00");
console.log("After click 12:00:", state1.start, "às", state1.end, `(${state1.getDurationMin()} min)`);
assert.strictEqual(state1.start, "12:00");
assert.strictEqual(state1.end, "12:30");
assert.strictEqual(state1.getDurationMin(), 30);

// User clicks 12:30:
state1.click("12:30");
console.log("After click 12:30:", state1.start, "às", state1.end, `(${state1.getDurationMin()} min)`);
assert.strictEqual(state1.start, "12:00");
assert.strictEqual(state1.end, "12:30");
assert.strictEqual(state1.getDurationMin(), 30);

// User clicks 13:00:
state1.click("13:00");
console.log("After click 13:00:", state1.start, "às", state1.end, `(${state1.getDurationMin()} min)`);
assert.strictEqual(state1.start, "12:00");
assert.strictEqual(state1.end, "13:00");
assert.strictEqual(state1.getDurationMin(), 60); // Exactly 1 hour!

// TEST 2: Extending and reducing by half-hour increments
console.log("\n=== RUNNING TEST 2: Step-by-step adjustments ===");
// Extend to 13:30 (1h30):
state1.click("13:30");
console.log("After click 13:30:", state1.start, "às", state1.end, `(${state1.getDurationMin()} min)`);
assert.strictEqual(state1.end, "13:30");
assert.strictEqual(state1.getDurationMin(), 90);

// Extend to 14:00 (2h):
state1.click("14:00");
console.log("After click 14:00:", state1.start, "às", state1.end, `(${state1.getDurationMin()} min)`);
assert.strictEqual(state1.end, "14:00");
assert.strictEqual(state1.getDurationMin(), 120);

// Click 13:00 to reduce back to 1h:
state1.click("13:00");
console.log("After click 13:00 (cut back):", state1.start, "às", state1.end, `(${state1.getDurationMin()} min)`);
assert.strictEqual(state1.end, "13:00");
assert.strictEqual(state1.getDurationMin(), 60);

// Click 12:30 to reduce back to 30 min:
state1.click("12:30");
console.log("After click 12:30 (cut back):", state1.start, "às", state1.end, `(${state1.getDurationMin()} min)`);
assert.strictEqual(state1.end, "12:30");
assert.strictEqual(state1.getDurationMin(), 30);

// TEST 3: Direct 2-click (12:00 then 13:00 for 1h)
console.log("\n=== RUNNING TEST 3: Direct 2-click (12:00 then 13:00) ===");
const state2 = new BalcaoSelectionState("11:00", "12:00", false);
state2.click("12:00");
assert.strictEqual(state2.start, "12:00");
assert.strictEqual(state2.end, "12:30");
state2.click("13:00");
console.log("After click 13:00 directly:", state2.start, "às", state2.end, `(${state2.getDurationMin()} min)`);
assert.strictEqual(state2.start, "12:00");
assert.strictEqual(state2.end, "13:00");
assert.strictEqual(state2.getDurationMin(), 60);

// TEST 4: Expanding backward (e.g. 11:30)
console.log("\n=== RUNNING TEST 4: Backward expansion ===");
state2.click("11:30");
console.log("After click 11:30:", state2.start, "às", state2.end, `(${state2.getDurationMin()} min)`);
assert.strictEqual(state2.start, "11:30");
assert.strictEqual(state2.end, "13:00");
assert.strictEqual(state2.getDurationMin(), 90);

// TEST 5: Clicking distant slot starts fresh
console.log("\n=== RUNNING TEST 5: Distant slot starts fresh ===");
state2.click("18:00");
console.log("After click 18:00:", state2.start, "às", state2.end, `(${state2.getDurationMin()} min)`);
assert.strictEqual(state2.start, "18:00");
assert.strictEqual(state2.end, "18:30");
assert.strictEqual(state2.getDurationMin(), 30);

console.log("\nALL TESTS PASSED WITH 100% SUCCESS!");
