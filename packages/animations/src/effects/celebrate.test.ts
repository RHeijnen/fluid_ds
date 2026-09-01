import { expect, fixture, html, waitUntil } from "@open-wc/testing";

import {
  EFFECTS,
  EFFECT_ORIGIN_PRESETS,
  activeEmitterCount,
  type EffectFunction,
  type EffectHandle
} from "./index.js";
import "../define/celebrate.js";
import type { FluidCelebrate } from "./fluid-celebrate.js";

/** The callable registry is what `<fluid-celebrate>` dispatches through, so a
 *  recorder swapped in here observes exactly the options the element derived
 *  from its attributes. Restored after every test. */
const registry = EFFECTS as unknown as Record<string, EffectFunction>;

interface Recorder {
  calls: Record<string, unknown>[];
  restore: () => void;
}

function recordEffect(name: string): Recorder {
  const original = registry[name];
  if (!original) throw new Error(`no such effect: ${name}`);
  const calls: Record<string, unknown>[] = [];
  registry[name] = (options: Record<string, unknown> = {}): EffectHandle => {
    calls.push(options);
    return {
      stop: () => undefined,
      fizzle: () => undefined,
      finished: Promise.resolve()
    };
  };
  return {
    calls,
    restore: () => {
      registry[name] = original;
    }
  };
}

async function optionsFor(
  el: FluidCelebrate,
  effect = "confetti"
): Promise<Record<string, unknown>> {
  const recorder = recordEffect(effect);
  try {
    await el.fire();
    expect(recorder.calls, `${effect} was never invoked`).to.have.lengthOf(1);
    return recorder.calls[0]!;
  } finally {
    recorder.restore();
  }
}

describe("<fluid-celebrate>: accessibility", () => {
  it("passes the accessibility audit", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate effect="confetti"></fluid-celebrate>`
    );
    await expect(el).to.be.accessible();
  });
});

describe("<fluid-celebrate>: effect resolution", () => {
  it("maps a dash-case alias onto its camelCase effect", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate effect="emoji-burst"></fluid-celebrate>`
    );
    const recorder = recordEffect("emojiBurst");
    try {
      await el.fire();
      expect(recorder.calls).to.have.lengthOf(1);
    } finally {
      recorder.restore();
    }
  });

  it("falls back to confetti for an unknown effect name", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate effect="not-a-real-effect"></fluid-celebrate>`
    );
    const recorder = recordEffect("confetti");
    try {
      await el.fire();
      expect(recorder.calls, "an unknown name must still celebrate").to.have.lengthOf(1);
    } finally {
      recorder.restore();
    }
  });

  it("defaults to confetti when no effect attribute is set", async () => {
    const el = await fixture<FluidCelebrate>(html`<fluid-celebrate></fluid-celebrate>`);
    expect(el.effect).to.equal("confetti");
    expect(el.emojis, "no emojis attribute means no glyph override").to.equal(undefined);
    const recorder = recordEffect("confetti");
    try {
      await el.fire();
      expect(recorder.calls).to.have.lengthOf(1);
    } finally {
      recorder.restore();
    }
  });

  it("does not announce a run fired while detached", async () => {
    // A detached controller has nothing to bubble through, so the end event
    // would never reach a delegated listener.
    const el = document.createElement("fluid-celebrate") as FluidCelebrate;
    el.setAttribute("effect", "confetti");
    let ended = false;
    el.addEventListener("fluid-celebrate-end", () => {
      ended = true;
    });
    const recorder = recordEffect("confetti");
    try {
      await el.fire();
      expect(recorder.calls, "the effect still runs").to.have.lengthOf(1);
      expect(el.isConnected).to.equal(false);
      expect(ended, "a detached element must stay quiet").to.equal(false);
    } finally {
      recorder.restore();
    }
  });

  it("does not announce a run that a later fire superseded", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate effect="snow"></fluid-celebrate>`
    );
    let ends = 0;
    el.addEventListener("fluid-celebrate-end", () => {
      ends += 1;
    });
    const recorder = recordEffect("snow");
    try {
      const first = el.fire();
      const second = el.fire();
      await Promise.all([first, second]);
      expect(recorder.calls, "both fires reached the effect").to.have.lengthOf(2);
      expect(ends, "only the surviving run announces completion").to.equal(1);
    } finally {
      recorder.restore();
      el.stop();
      await waitUntil(() => activeEmitterCount() === 0, "did not drain");
    }
  });
});

describe("<fluid-celebrate>: option plumbing", () => {
  it("forwards every numeric tuning attribute", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate
        count="12"
        shells="3"
        rate="7"
        duration="450"
        spread="30"
        velocity="600"
        gravity="250"
        size="9"
        angle="45"
        interval="120"
        particles-per-shell="40"
        rings="4"
        radius="70"
      ></fluid-celebrate>`
    );
    expect(await optionsFor(el)).to.deep.equal({
      count: 12,
      shells: 3,
      rate: 7,
      duration: 450,
      spread: 30,
      velocity: 600,
      gravity: 250,
      size: 9,
      angle: 45,
      interval: 120,
      particlesPerShell: 40,
      rings: 4,
      radius: 70
    });
  });

  it("drops a tuning attribute that is not a number", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate count="lots" size="8"></fluid-celebrate>`
    );
    // A typo must not become NaN downstream; the effect keeps its own default.
    expect(await optionsFor(el)).to.deep.equal({ size: 8 });
  });

  it("passes the legacy cannons flag through as a boolean", async () => {
    const el = await fixture<FluidCelebrate>(html`<fluid-celebrate cannons></fluid-celebrate>`);
    expect(await optionsFor(el)).to.deep.equal({ cannons: true });
  });

  it("splits a colors attribute without breaking functional color notations", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate
        colors="rgba(255, 0, 0, 0.5), #00ff00 hsl(200 50% 40%)"
      ></fluid-celebrate>`
    );
    expect(await optionsFor(el)).to.deep.equal({
      colors: ["rgba(255, 0, 0, 0.5)", "#00ff00", "hsl(200 50% 40%)"]
    });
  });

  it("lets the colors property override the attribute", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate colors="#111111"></fluid-celebrate>`
    );
    el.colors = ["#abcdef", "#fedcba"];
    expect(await optionsFor(el)).to.deep.equal({ colors: ["#abcdef", "#fedcba"] });
  });

  it("treats a blank colors or emojis attribute as no override at all", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate effect="emojiBurst" colors="  " emojis="  "></fluid-celebrate>`
    );
    expect(el.emojis, "whitespace is not a glyph list").to.equal(undefined);
    expect(await optionsFor(el, "emojiBurst")).to.deep.equal({});
  });

  it("forwards a parsed emojis attribute", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate effect="emojiBurst" emojis="🎉,❤️"></fluid-celebrate>`
    );
    expect(await optionsFor(el, "emojiBurst")).to.deep.equal({ emojis: ["🎉", "❤️"] });
  });
});

describe("<fluid-celebrate>: origins", () => {
  it("expands a named preset into launch sources", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate origin="all-corners"></fluid-celebrate>`
    );
    const opts = await optionsFor(el);
    expect(opts["sources"]).to.equal(EFFECT_ORIGIN_PRESETS["all-corners"]);
    expect(opts["origin"], "the first source doubles as the single-origin fallback").to.equal(
      EFFECT_ORIGIN_PRESETS["all-corners"][0]!.origin
    );
  });

  it("treats origin='self' as the element itself", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate origin="self"></fluid-celebrate>`
    );
    expect((await optionsFor(el))["origin"]).to.equal(el);
  });

  it("prefers an explicit originTarget over the element for origin='self'", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate origin="self"></fluid-celebrate>`
    );
    const target = document.createElement("div");
    document.body.appendChild(target);
    try {
      el.originTarget = target;
      expect((await optionsFor(el))["origin"]).to.equal(target);
    } finally {
      target.remove();
    }
  });

  it("reads a pair inside the unit square as a relative origin", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate origin="0.25, 0.75"></fluid-celebrate>`
    );
    expect((await optionsFor(el))["origin"]).to.deep.equal({ rx: 0.25, ry: 0.75 });
  });

  it("reads a pair outside the unit square as absolute viewport pixels", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate origin="120,240"></fluid-celebrate>`
    );
    expect((await optionsFor(el))["origin"]).to.deep.equal({ x: 120, y: 240 });
  });

  it("ignores a malformed origin instead of firing from NaN", async () => {
    const el = await fixture<FluidCelebrate>(
      html`<fluid-celebrate origin="somewhere-nice"></fluid-celebrate>`
    );
    expect(await optionsFor(el)).to.deep.equal({});
  });
});
