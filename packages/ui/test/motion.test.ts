import { afterEach, describe, expect, it, vi } from "vitest";
import { watchLowPower } from "../src/motion";

class FakeBattery extends EventTarget {
  constructor(
    public charging: boolean,
    public level: number
  ) {
    super();
  }

  set(charging: boolean, level: number) {
    this.charging = charging;
    this.level = level;
    this.dispatchEvent(new Event("levelchange"));
  }
}

const withBattery = (battery?: FakeBattery) =>
  vi.stubGlobal(
    "navigator",
    battery ? { getBattery: () => Promise.resolve(battery) } : {}
  );

const flush = () => new Promise((done) => setTimeout(done));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("watchLowPower", () => {
  it("reports low power when unplugged at 20% or lower", async () => {
    const battery = new FakeBattery(false, 0.2);
    withBattery(battery);
    const changes: boolean[] = [];

    watchLowPower((low) => changes.push(low));
    await flush();
    battery.set(true, 0.2);
    battery.set(false, 0.21);

    expect(changes).toEqual([true, false, false]);
  });

  it("stops listening once cleaned up", async () => {
    const battery = new FakeBattery(false, 0.5);
    withBattery(battery);
    const changes: boolean[] = [];

    const stop = watchLowPower((low) => changes.push(low));
    await flush();
    stop();
    battery.set(false, 0.1);

    expect(changes).toEqual([false]);
  });

  it("never reports low power without the Battery API", async () => {
    withBattery();
    const onChange = vi.fn();

    watchLowPower(onChange);
    await flush();

    expect(onChange).not.toHaveBeenCalled();
  });
});
