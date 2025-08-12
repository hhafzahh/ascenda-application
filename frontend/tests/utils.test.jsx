// Tests for utility functions that handle:
// - Hotel description parsing (splitDescription)
// - Star rating calculations (computeStarParts)
import { splitDescription, computeStarParts } from '../src/components/HotelOverview/utils';

describe('splitDescription', () => {
  // Test defensive programming - handle bad input gracefully
  test('returns empty parts for non-string or empty input', () => {
    // Handle undefined input gracefully
    expect(splitDescription()).toEqual({ main: '', nearby: '', airports: '' });
    // Null input returns empty sections
    expect(splitDescription(null)).toEqual({ main: '', nearby: '', airports: '' });
    // Non-string input (numbers) returns empty sections
    expect(splitDescription(123)).toEqual({ main: '', nearby: '', airports: '' });
    // Empty string returns empty sections
    expect(splitDescription('')).toEqual({ main: '', nearby: '', airports: '' });
  });

  // Tests behavior when no section markers are found
  test('no markers present → main is entire text; nearby & airports empty', () => {
    const t = '<p>Hello world.</p><p>More text.</p>';
    const out = splitDescription(t);
    // Plain HTML without markers stays in main section
    expect(out.main).toBe(t);
    // No nearby section detected
    expect(out.nearby).toBe('');
    // No airports section detected
    expect(out.airports).toBe('');
  });

  // Test proper section splitting with all markers present
  test('both markers present → correct main / nearby / airports splitting', () => {
    const t = `
      <p>Intro A.</p>
      Distances are displayed
      <p>Nearby shops…</p>
      The nearest airports are:
      <p>Airport A (10km)</p>
      <p>Tail after airports.</p>
    `;
    const { main, nearby, airports } = splitDescription(t);

    // Nearby section contains local attractions and distances
    expect(nearby).toMatch(/Distances are displayed/);
    expect(nearby).toMatch(/Nearby shops/);
    expect(nearby).not.toMatch(/The nearest airports are:/);

    // Airport section contains travel info up to its closing tag
    expect(airports).toMatch(/The nearest airports are:/);
    expect(airports).toMatch(/Airport A \(10km\)/);
    expect(airports.trim().endsWith('</p>')).toBe(true);
    expect(airports).not.toMatch(/Tail after airports/);

    // Main section contains introduction and concluding text
    expect(main).toMatch(/Intro A\./);
    expect(main).toMatch(/Tail after airports/);
    expect(main).not.toMatch(/Distances are displayed/);
    expect(main).not.toMatch(/The nearest airports are:/);
  });

  test('only one marker present → falls back to full main, empty nearby/airports', () => {
    const onlyDistances = `
      <p>Intro</p>
      Distances are displayed
      <p>Nearby …</p>
      <p>End</p>
    `;
    const onlyAirports = `
      <p>Intro</p>
      The nearest airports are:
      <p>Airport A</p>
      <p>End</p>
    `;

    let out = splitDescription(onlyDistances);
    expect(out.main).toContain('Distances are displayed');
    expect(out.nearby).toBe('');
    expect(out.airports).toBe('');

    out = splitDescription(onlyAirports);
    expect(out.main).toContain('The nearest airports are:');
    expect(out.nearby).toBe('');
    expect(out.airports).toBe('');
  });
});

describe('computeStarParts', () => {
  // Verify robustness against invalid inputs
  test('handles non-finite and negative ratings as 0', () => {
    // Missing input defaults to 0 stars
    expect(computeStarParts()).toEqual({ full: 0, half: 0, empty: 5 });
    // Null values treated as 0 stars
    expect(computeStarParts(null)).toEqual({ full: 0, half: 0, empty: 5 });
    // NaN values treated as 0 stars
    expect(computeStarParts(NaN)).toEqual({ full: 0, half: 0, empty: 5 });
    // Negative ratings clamped to 0 stars
    expect(computeStarParts(-1)).toEqual({ full: 0, half: 0, empty: 5 }); // assumes clamping at 0
  });

  // Test standard integer ratings within valid range
  test('integer ratings in [0,5]', () => {
    // Zero rating shows all empty stars
    expect(computeStarParts(0)).toEqual({ full: 0, half: 0, empty: 5 });
    // 3-star rating shows 3 full and 2 empty stars
    expect(computeStarParts(3)).toEqual({ full: 3, half: 0, empty: 2 });
    // 5-star rating shows all full stars
    expect(computeStarParts(5)).toEqual({ full: 5, half: 0, empty: 0 });
  });

  // Verify decimal ratings and rounding behavior
  test('half-star threshold at .5', () => {
    // 0.5 shows one half star
    expect(computeStarParts(0.5)).toEqual({ full: 0, half: 1, empty: 4 });
    // 3.4 rounds down to 3 full stars
    expect(computeStarParts(3.4)).toEqual({ full: 3, half: 0, empty: 2 });
    // 3.5 shows 3 full stars and 1 half star
    expect(computeStarParts(3.5)).toEqual({ full: 3, half: 1, empty: 1 });
    // 4.9 rounds to 4 full stars and 1 half star
    expect(computeStarParts(4.9)).toEqual({ full: 4, half: 1, empty: 0 });
  });

  // Test upper bound handling
  test('values > 5 are clamped to 5 stars', () => {
    // Slightly over 5 clamps to 5 stars
    expect(computeStarParts(5.1)).toEqual({ full: 5, half: 0, empty: 0 });
    // Large values clamp to 5 stars
    expect(computeStarParts(42)).toEqual({ full: 5, half: 0, empty: 0 });
  });
});
