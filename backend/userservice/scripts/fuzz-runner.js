const { runCLI } = require("jest");

(async () => {
  const hours = parseFloat(process.env.HOURS || "0.003"); // allow decimals
  const end = Date.now() + hours * 3600_000; // hours to ms
  let i = 0;

  while (Date.now() < end) {
    i++;
    console.log(`[fuzz] iteration ${i}`);
    await runCLI(
      {
        runInBand: true,
        testMatch: ["**/tests/*.fuzz.test.jsx"], // fuzz tests pattern
      },
      [process.cwd()]
    );
  }
})();