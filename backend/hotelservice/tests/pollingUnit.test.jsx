const axios = require("axios");
jest.mock("axios");

const { _test: { pollUntilCompleted } } = require("../hotelAPIService");

describe("pollUntilCompleted (unit)", () => {
  // keep one fake-timer test for delay semantics
  describe("with fake timers (verifies real waits)", () => {
    let logSpy, errSpy;
    beforeEach(() => {
      jest.useFakeTimers();
      logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });
    afterEach(() => {
      jest.useRealTimers();
      logSpy.mockRestore();
      errSpy.mockRestore();
      jest.clearAllMocks();
    });

    it("retries until completed === true; waits between attempts", async () => {
      axios.get
        .mockResolvedValueOnce({ data: { completed: false } })
        .mockResolvedValueOnce({ data: { completed: false } })
        .mockResolvedValueOnce({ data: { completed: true, hotels: [{ id: "H1" }] } });

      const p = pollUntilCompleted("url", {}, 5, 5000);

      // advance two waits
      if (jest.advanceTimersByTimeAsync) {
        await jest.advanceTimersByTimeAsync(5000);
        await jest.advanceTimersByTimeAsync(5000);
      } else {
        jest.advanceTimersByTime(5000); await Promise.resolve();
        jest.advanceTimersByTime(5000); await Promise.resolve();
      }

      await expect(p).resolves.toEqual({ completed: true, hotels: [{ id: "H1" }] });
      expect(axios.get).toHaveBeenCalledTimes(3);
    });
  });

  //real timers for the instant-timers test to avoid hangs or timeouts
  describe("with instant timers (no real waits)", () => {
    let setTimeoutSpy, logSpy, errSpy;

    beforeEach(() => {
      // ensure no leftover fake timers
      jest.useRealTimers();
      logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
      errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      // make setTimeout fire on next tick
      setTimeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation((cb, ms, ...args) => {
        process.nextTick(() => cb(...args));
        return 0;
      });
    });

    afterEach(() => {
      setTimeoutSpy.mockRestore();
      logSpy.mockRestore();
      errSpy.mockRestore();
      jest.clearAllMocks();
    });

    it("throws after max retries are exhausted (instant timers)", async () => {
      // retries=3 -> 3 attempts, all incomplete
      axios.get
        .mockResolvedValueOnce({ data: { completed: false } })
        .mockResolvedValueOnce({ data: { completed: false } })
        .mockResolvedValueOnce({ data: { completed: false } });

      const p = pollUntilCompleted("url", {}, 3, 5000);

      await expect(p).rejects.toThrow("Polling exceeded maximum retries");
      expect(axios.get).toHaveBeenCalledTimes(3);
    });
  });
});