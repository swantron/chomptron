// Throwaway sample used to demonstrate difftron's delta-coverage gate on a
// pull request. Safe to delete.

// covered is exercised by test.js, so its changed lines report as covered.
function covered(a, b) {
  return a + b;
}

// uncovered has no test, so difftron should flag these changed lines as uncovered.
function uncovered(a, b) {
  if (a > b) {
    return a - b;
  }
  return b - a;
}

module.exports = { covered, uncovered };
