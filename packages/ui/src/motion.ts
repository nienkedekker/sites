// Chrome's Energy Saver caps the frame rate, so animations stutter. Pages can't
// see it, but it turns on at 20% battery by default, and the battery they can
// see. Chrome and Edge only; elsewhere this never reports low power.
const LOW_BATTERY = 0.2;

export const LOW_POWER_CLASS = "low-power";

interface Battery extends EventTarget {
  charging: boolean;
  level: number;
}

type BatteryNavigator = Navigator & { getBattery?: () => Promise<Battery> };

export function watchLowPower(onChange: (lowPower: boolean) => void) {
  const { getBattery } = navigator as BatteryNavigator;
  if (!getBattery) return () => {};

  let battery: Battery | null = null;
  let stopped = false;
  const update = () => {
    if (battery) onChange(!battery.charging && battery.level <= LOW_BATTERY);
  };

  getBattery
    .call(navigator)
    .then((found) => {
      if (stopped) return;
      battery = found;
      update();
      found.addEventListener("chargingchange", update);
      found.addEventListener("levelchange", update);
    })
    .catch(() => {});

  return () => {
    stopped = true;
    battery?.removeEventListener("chargingchange", update);
    battery?.removeEventListener("levelchange", update);
  };
}

export function prefersLessMotion() {
  return (
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.classList.contains(LOW_POWER_CLASS)
  );
}
