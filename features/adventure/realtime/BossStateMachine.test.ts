import { describe, it, expect } from "vitest";
import { initBossState, stepBoss, validateDef } from "./BossStateMachine";
import { makeRng } from "./config";
import type { BossMachineState, MachineEvent, RtBossDef, StepInput } from "./types";

// ── Synthetic boss exercising every framework path. Durations are multiples of
// the 100ms test dt so state boundaries land on exact steps. ──────────────────
const SYNTH: RtBossDef = {
  id: "training-dummy",
  name: "SYNTH",
  maxHp: 10,
  contactDamage: 1,
  damageScale: { attack: 1, stomp: 1 },
  phases: [
    { id: "p0", attackIds: ["jab", "far"], tempoScale: 1 },
    { id: "p1", enterBelowHpFrac: 0.5, attackIds: ["jab"], tempoScale: 0.5 },
  ],
  attacks: [
    { id: "jab", telegraphMs: 200, activeMs: 100, recoveryMs: 300, cooldownMs: 1000, parryable: true, damage: 1, weight: 1 },
    { id: "far", telegraphMs: 300, activeMs: 100, recoveryMs: 200, cooldownMs: 1000, parryable: false, damage: 1, weight: 1, minRangePx: 100 },
  ],
  arenaKey: "test",
  track: "boss",
  spawn: { tx: 0, ty: 0 },
};

function mkInput(o: Partial<StepInput> = {}): StepInput {
  return {
    dt: 100,
    playerX: 0,
    playerY: 0,
    bossX: 0,
    bossY: 0,
    events: [],
    rng: () => 0,
    ...o,
  };
}

function step(def: RtBossDef, s: BossMachineState, o: Partial<StepInput> = {}) {
  return stepBoss(def, s, mkInput(o));
}

function stateIn(p: Partial<BossMachineState>): BossMachineState {
  return { ...initBossState(SYNTH), ...p };
}

/** Step from spawn until the machine first reaches idle (no attack selected yet). */
function runToIdle(def: RtBossDef): BossMachineState {
  let s = initBossState(def);
  for (let i = 0; i < 50; i++) {
    s = step(def, s).state;
    if (s.fsm === "idle") return s;
  }
  throw new Error("never reached idle");
}

describe("initBossState", () => {
  it("spawns full-hp in the spawn state, phase 0", () => {
    const s = initBossState(SYNTH);
    expect(s).toEqual({
      hp: 10,
      phaseIndex: 0,
      fsm: "spawn",
      msInState: 0,
      currentAttackId: null,
      cooldowns: {},
      vulnerableMs: 0,
      invulnerable: false,
    });
  });

  it("does not mutate its input state across a step", () => {
    const s = initBossState(SYNTH);
    const snap = JSON.parse(JSON.stringify(s));
    stepBoss(SYNTH, s, mkInput());
    expect(s).toEqual(snap);
  });

  it("is deterministic: identical (def,state,input,rng-seed) → identical output", () => {
    const s = stateIn({ fsm: "idle", phaseIndex: 0 });
    const a = stepBoss(SYNTH, s, mkInput({ playerX: 150, rng: makeRng(5) }));
    const b = stepBoss(SYNTH, s, mkInput({ playerX: 150, rng: makeRng(5) }));
    expect(a).toEqual(b);
  });
});

describe("spawn → idle", () => {
  it("holds spawn then idles after the spawn beat", () => {
    let s = initBossState(SYNTH);
    s = step(SYNTH, s).state;
    expect(s.fsm).toBe("spawn");
    const idle = runToIdle(SYNTH);
    expect(idle.fsm).toBe("idle");
    expect(idle.currentAttackId).toBeNull();
  });
});

describe("attack selection", () => {
  it("selects an in-range attack and enters telegraph with an attack-start command", () => {
    const idle = runToIdle(SYNTH);
    const r = step(SYNTH, idle, { playerX: 0, bossX: 0 }); // dist 0 → far is out of range
    expect(r.state.fsm).toBe("telegraph");
    expect(r.state.currentAttackId).toBe("jab");
    expect(r.commands).toContainEqual({ kind: "attack-start", attackId: "jab" });
    expect(r.state.cooldowns.jab).toBe(1000);
  });

  it("gates attacks by range: 'far' needs |player-boss| ≥ 100", () => {
    const idle = runToIdle(SYNTH);
    // dist 0: only jab qualifies regardless of rng.
    expect(step(SYNTH, idle, { playerX: 0, rng: () => 0.99 }).state.currentAttackId).toBe("jab");
    // dist 150: both qualify → weighted pick. rng 0 → first (jab); rng 0.9 → far.
    expect(step(SYNTH, idle, { playerX: 150, rng: () => 0 }).state.currentAttackId).toBe("jab");
    expect(step(SYNTH, idle, { playerX: 150, rng: () => 0.9 }).state.currentAttackId).toBe("far");
  });

  it("stays idle (no rng burn) when every attack is on cooldown", () => {
    const idle = stateIn({ fsm: "idle", cooldowns: { jab: 500 } }); // far always out of range at dist 0
    let rngCalls = 0;
    const r = step(SYNTH, idle, { playerX: 0, rng: () => (rngCalls++, 0) });
    expect(r.state.fsm).toBe("idle");
    expect(rngCalls).toBe(0);
    expect(r.state.cooldowns.jab).toBe(400); // ticked down by dt
  });
});

describe("attack cadence: telegraph → attack → recovery → idle", () => {
  it("walks the full loop at phase-0 tempo with the right command stream", () => {
    let s = runToIdle(SYNTH);
    s = step(SYNTH, s, { playerX: 0 }).state; // select jab → telegraph
    expect(s.fsm).toBe("telegraph");

    s = step(SYNTH, s).state; // t=100 < 200
    expect(s.fsm).toBe("telegraph");
    let r = step(SYNTH, s); // t=200 → attack
    expect(r.state.fsm).toBe("attack");
    expect(r.commands).toContainEqual({ kind: "attack-active", attackId: "jab" });

    r = step(SYNTH, r.state); // active 100 → recovery
    expect(r.state.fsm).toBe("recovery");
    expect(r.commands).toContainEqual({ kind: "attack-end", attackId: "jab" });
    expect(r.commands).toContainEqual({ kind: "vulnerable", ms: 300 });
    expect(r.state.vulnerableMs).toBe(300);

    s = step(SYNTH, r.state).state; // vuln 200
    expect(s.vulnerableMs).toBe(200);
    s = step(SYNTH, s).state; // vuln 100
    r = step(SYNTH, s); // recovery 300 → idle
    expect(r.state.fsm).toBe("idle");
    expect(r.state.currentAttackId).toBeNull();
    expect(r.state.vulnerableMs).toBe(0);
  });

  it("keeps the just-used attack on cooldown until it expires", () => {
    // Drive one full jab, then confirm it can't be reselected while cooling down.
    let s = runToIdle(SYNTH);
    s = step(SYNTH, s, { playerX: 0 }).state; // telegraph
    for (let i = 0; i < 20 && s.fsm !== "idle"; i++) s = step(SYNTH, s).state;
    expect(s.fsm).toBe("idle");
    expect(s.cooldowns.jab).toBeGreaterThan(0); // still cooling
    // idle until the cooldown clears, then it re-telegraphs.
    let reselected = false;
    for (let i = 0; i < 10; i++) {
      s = step(SYNTH, s, { playerX: 0 }).state;
      if (s.fsm === "telegraph") { reselected = true; break; }
    }
    expect(reselected).toBe(true);
  });
});

describe("tempoScale", () => {
  it("shrinks telegraph+recovery but never activeMs", () => {
    // phase 1 tempo 0.5: jab telegraph 200→100 (1 step), active stays 100 (1 step).
    const idle = stateIn({ fsm: "idle", phaseIndex: 1, hp: 4 });
    let s = step(SYNTH, idle, { playerX: 0 }).state; // select jab → telegraph
    expect(s.fsm).toBe("telegraph");
    s = step(SYNTH, s).state; // t=100 ≥ 100 (scaled) → attack
    expect(s.fsm).toBe("attack");
    s = step(SYNTH, s).state; // active 100 (unscaled) → recovery
    expect(s.fsm).toBe("recovery");
    expect(s.vulnerableMs).toBe(150); // 300 × 0.5
  });
});

describe("parried / wall-hit → stagger", () => {
  it("a parry during a parryable telegraph staggers and opens the vulnerable window", () => {
    const tele = stateIn({ fsm: "telegraph", currentAttackId: "jab", msInState: 50, cooldowns: { jab: 900 } });
    const r = step(SYNTH, tele, { events: [{ kind: "parried" }] });
    expect(r.state.fsm).toBe("stagger");
    expect(r.state.vulnerableMs).toBe(300); // jab.recoveryMs
    expect(r.commands).toContainEqual({ kind: "stagger" });
    expect(r.commands).toContainEqual({ kind: "vulnerable", ms: 300 });
  });

  it("a wall-hit staggers even an UNPARRYABLE attack mid-telegraph", () => {
    const tele = stateIn({ fsm: "telegraph", currentAttackId: "far", msInState: 50 });
    expect(step(SYNTH, tele, { events: [{ kind: "wall-hit" }] }).state.fsm).toBe("stagger");
  });

  it("ignores a parry on an unparryable attack", () => {
    const tele = stateIn({ fsm: "telegraph", currentAttackId: "far", msInState: 50 });
    expect(step(SYNTH, tele, { events: [{ kind: "parried" }] }).state.fsm).toBe("telegraph");
  });

  it("ignores a parry outside telegraph/attack (e.g. during recovery)", () => {
    const rec = stateIn({ fsm: "recovery", currentAttackId: "jab", vulnerableMs: 200 });
    expect(step(SYNTH, rec, { events: [{ kind: "parried" }] }).state.fsm).toBe("recovery");
  });

  it("resolves stagger back to idle after the vulnerable window", () => {
    let s = stateIn({ fsm: "stagger", currentAttackId: "jab", vulnerableMs: 300 });
    s = step(SYNTH, s).state; // 100
    s = step(SYNTH, s).state; // 200
    s = step(SYNTH, s).state; // 300 → idle
    expect(s.fsm).toBe("idle");
    expect(s.currentAttackId).toBeNull();
  });
});

describe("hit handling: damageScale + invulnerable", () => {
  it("applies attack damage to hp", () => {
    const r = step(SYNTH, stateIn({ fsm: "idle", hp: 10 }), {
      events: [{ kind: "hit", amount: 2, source: "attack" }],
    });
    expect(r.state.hp).toBe(8);
  });

  it("scales attack damage by damageScale (attrition boss)", () => {
    const scaled = { ...SYNTH, damageScale: { attack: 0.25, stomp: 0 } };
    expect(
      step(scaled, stateIn({ fsm: "idle", hp: 10 }), {
        events: [{ kind: "hit", amount: 2, source: "attack" }],
      }).state.hp,
    ).toBe(9.5);
    // stomp scale 0 → immune to stomps
    expect(
      step(scaled, stateIn({ fsm: "idle", hp: 10 }), {
        events: [{ kind: "hit", amount: 3, source: "stomp" }],
      }).state.hp,
    ).toBe(10);
  });

  it("ignores normal hits while invulnerable, but mechanic hits ALWAYS land", () => {
    const armored = stateIn({ fsm: "idle", hp: 10, invulnerable: true });
    expect(step(SYNTH, armored, { events: [{ kind: "hit", amount: 2, source: "attack" }] }).state.hp).toBe(10);
    expect(step(SYNTH, armored, { events: [{ kind: "hit", amount: 1, source: "mechanic" }] }).state.hp).toBe(9);
  });
});

describe("phase crossings", () => {
  it("emits a phase command and passes through a fixed transition state", () => {
    const r = step(SYNTH, stateIn({ fsm: "idle", hp: 10, phaseIndex: 0 }), {
      events: [{ kind: "hit", amount: 6, source: "attack" }], // hp 4 < 50%
    });
    expect(r.state.hp).toBe(4);
    expect(r.state.fsm).toBe("transition");
    expect(r.state.phaseIndex).toBe(1);
    expect(r.commands).toContainEqual({ kind: "phase", phaseIndex: 1 });

    // 600ms transition (6 × 100) → idle in the new phase.
    let s = r.state;
    for (let i = 0; i < 6; i++) s = step(SYNTH, s).state;
    expect(s.fsm).toBe("idle");
    expect(s.phaseIndex).toBe(1);
  });
});

describe("defeat is absorbing", () => {
  it("hp ≤ 0 defeats and every later step is a no-op", () => {
    const r = step(SYNTH, stateIn({ fsm: "telegraph", currentAttackId: "jab", hp: 2 }), {
      events: [{ kind: "hit", amount: 5, source: "attack" }],
    });
    expect(r.state.hp).toBe(0);
    expect(r.state.fsm).toBe("defeated");
    expect(r.commands).toContainEqual({ kind: "defeated" });

    const again = stepBoss(SYNTH, r.state, mkInput({ events: [{ kind: "hit", amount: 5, source: "attack" }] }));
    expect(again.state).toBe(r.state); // same object, unchanged
    expect(again.commands).toEqual([]);
  });

  it("the force-defeat mechanic event wins even at full hp", () => {
    const forceEvt: MachineEvent = { kind: "mechanic", id: "force-defeat" };
    const r = step(SYNTH, stateIn({ fsm: "idle", hp: 10 }), { events: [forceEvt] });
    expect(r.state.fsm).toBe("defeated");
    expect(r.commands).toContainEqual({ kind: "defeated" });
  });

  it("ignores unrelated mechanic ids", () => {
    const r = step(SYNTH, stateIn({ fsm: "idle", hp: 10 }), {
      events: [{ kind: "mechanic", id: "crown-crack" }],
      playerX: 0,
    });
    expect(r.state.fsm).not.toBe("defeated");
  });
});

describe("validateDef", () => {
  it("accepts the synthetic def", () => {
    expect(() => validateDef(SYNTH)).not.toThrow();
  });

  it("requires telegraphMs ≥ 700 for a 2-heart (heavy) attack", () => {
    const bad = { ...SYNTH, attacks: [{ ...SYNTH.attacks[0], damage: 2 as const, telegraphMs: 500 }, SYNTH.attacks[1]] };
    expect(() => validateDef(bad)).toThrow(/telegraphMs/);
    const ok = { ...SYNTH, attacks: [{ ...SYNTH.attacks[0], damage: 2 as const, telegraphMs: 700 }, SYNTH.attacks[1]] };
    expect(() => validateDef(ok)).not.toThrow();
  });

  it("rejects a phase referencing an unknown attack id", () => {
    const bad = { ...SYNTH, phases: [{ id: "p0", attackIds: ["ghost"] }, SYNTH.phases[1]] };
    expect(() => validateDef(bad)).toThrow(/unknown attack/);
  });

  it("requires strictly decreasing enterBelowHpFrac", () => {
    const bad = {
      ...SYNTH,
      phases: [
        { id: "p0", attackIds: ["jab"], enterBelowHpFrac: 0.5 },
        { id: "p1", attackIds: ["jab"], enterBelowHpFrac: 0.6 },
      ],
    };
    expect(() => validateDef(bad)).toThrow(/decrease/);
  });

  it("requires positive weights and maxHp", () => {
    expect(() => validateDef({ ...SYNTH, attacks: [{ ...SYNTH.attacks[0], weight: 0 }, SYNTH.attacks[1]] })).toThrow(/weight/);
    expect(() => validateDef({ ...SYNTH, maxHp: 0 })).toThrow(/maxHp/);
  });
});
