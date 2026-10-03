const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const agents = fs.readFileSync("AGENTS.md", "utf8");
const guide = fs.readFileSync("docs/MLS Global Dispatcher/25 R44 Disposable Chat Command.md", "utf8");
const client = fs.readFileSync("scripts/r44 client.js", "utf8");

test("R44 optimized command is bounded to 10 sequential same-chat tickets", () => {
  assert.match(agents, /MLS R44 siguientes 10/);
  assert.match(agents, /up to 10 complete R44 tickets sequentially/i);
  assert.match(agents, /Never prefetch tickets/i);
  assert.match(agents, /never hold more than one active lease/i);

  assert.match(guide, /MLS R44 siguientes 10/);
  assert.match(guide, /bounded in-chat loop of at most 10 complete tickets/i);
  assert.match(guide, /Never prefetch the next ticket/i);
  assert.match(guide, /Never hold two active leases for one chat/i);
  assert.match(guide, /NO_WORK/);
  assert.match(guide, /CAPACITY_BUSY/);
  assert.match(guide, /LEASE_LOST/);
  assert.match(guide, /QUARANTINED/);
  assert.match(guide, /CLIENT_TRANSPORT_UNAVAILABLE_FREE_ONLY/);
  assert.match(guide, /never ChatGPT Work/i);
});

test("R44 multi-pull advances only after authoritative COMPLETE recovery", () => {
  assert.match(client, /async next\(\)\{const state=await this\.recover\(\);if\(state\.state!==['"]COMPLETE['"]\)throw new Error\(['"]CURRENT_TICKET_NOT_COMPLETE['"]\)/);
  assert.match(client, /this\.state=\{workerId:this\.state\.workerId\};this\.save\(\);return this\.claim\(\)/);
  assert.match(guide, /Only then clear the completed binding and create the next explicit claim/i);
});

test("single-ticket R44 command remains backward compatible", () => {
  assert.match(agents, /MLS R44 siguiente.*single-ticket compatibility command/i);
  assert.match(guide, /MLS R44 siguiente.*process exactly one ticket/i);
});
