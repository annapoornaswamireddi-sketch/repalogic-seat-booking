const assert = require("node:assert/strict");
const SeatBooking = require("../js/seats.js");

const event = {
  categories: { Front: 900, Standard: 1200, Premium: 1500 },
  rows: { A: "Front", B: "Front", C: "Standard", D: "Standard", E: "Premium", F: "Premium" },
  sold: ["C4", "C5", "D1", "D2", "E10"]
};

function valid(selection) {
  assert.deepEqual(SeatBooking.getProblems(event, selection), []);
}
function invalid(selection, expectedPart) {
  const problems = SeatBooking.getProblems(event, selection);
  assert.ok(problems.length > 0, `Expected ${selection.join(", ")} to be invalid`);
  if (expectedPart) assert.ok(problems.some(problem => problem.includes(expectedPart)), problems.join("; "));
}

// Required test cases from the assignment.
valid(["C3"]);
invalid(["C9"], "C10");
invalid(["C7"], "C6");
valid(["C6", "C7", "C8"]);
invalid(["C1", "C2"], "C3");
valid(["C1", "C2", "C3"]);
invalid(["A1", "A2", "A3", "A4", "A5", "A6", "A7"], "maximum");

const price = SeatBooking.calculatePrice(event, ["B1", "B2", "F5", "F6"]);
assert.equal(price.subtotal, 4800);
assert.equal(price.discount, 480);
assert.equal(price.total, 4320);

assert.deepEqual(SeatBooking.calculatePrice(event, ["C1"]), {
  subtotal: 1200, discount: 0, total: 1200
});
assert.deepEqual(SeatBooking.toggleSeat(event, ["C3"], "C3").selected, []);
assert.deepEqual(SeatBooking.toggleSeat(event, [], "C4").problems, ["That seat has already been sold."]);

console.log("All seat booking tests passed.");
