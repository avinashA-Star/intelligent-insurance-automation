const $ = id => document.getElementById(id);
const inr = n => "₹" + Math.round(n).toLocaleString("en-IN");
const claims = [];

// ---------- Tabs ----------
document.querySelectorAll("nav button").forEach(b => b.onclick = () => {
  document.querySelectorAll("nav button").forEach(x => x.setAttribute("aria-selected", x === b));
  ["quote","claim","dash"].forEach(id => $(id).hidden = id !== b.dataset.tab);
  if (b.dataset.tab === "dash") renderDash();
});

// ---------- Module 1: Premium engine ----------
const BASE_RATE = {health:0.012, auto:0.02, home:0.004, life:0.006};
function calcPremium({age, type, cov, smoker, prev}) {
  let rate = BASE_RATE[type];
  const factors = [];
  const ageF = age < 25 ? 1.15 : age <= 40 ? 1 : age <= 55 ? 1.3 : 1.7;
  if (ageF !== 1) factors.push(`Age band x${ageF}`);
  const smokeF = smoker ? 1.4 : 1;
  if (smoker) factors.push("Risky habit x1.4");
  const prevF = 1 + prev * 0.1;
  if (prev) factors.push(`Prior claims x${prevF.toFixed(1)}`);
  const annual = cov * rate * ageF * smokeF * prevF;
  return {annual, monthly: annual / 12, factors};
}
$("quote-btn").onclick = () => {
  const p = calcPremium({
    age:+$("q-age").value, type:$("q-type").value, cov:+$("q-cov").value,
    smoker:$("q-smoke").value === "1", prev:+$("q-prev").value
  });
  $("quote-out").innerHTML = `<div class="result ok"><div class="big">${inr(p.annual)} / year</div>
    <div>${inr(p.monthly)} per month</div>
    <div style="margin-top:6px;color:var(--muted)">${p.factors.length ? "Adjusted by: " + p.factors.join(", ") : "No risk loadings applied."}</div></div>`;
};

// ---------- Module 2: Claim triage + fraud scoring ----------
function assessClaim(c) {
  let score = 0; const flags = [];
  const ratio = c.amount / c.coverage;
  if (ratio > 0.8) { score += 30; flags.push("Claim exceeds 80% of coverage"); }
  else if (ratio > 0.5) { score += 15; flags.push("Claim exceeds 50% of coverage"); }
  if (c.policyAge < 3) { score += 25; flags.push("Policy is less than 3 months old"); }
  if (c.prev >= 3) { score += 25; flags.push("3 or more claims in 12 months"); }
  else if (c.prev === 2) { score += 12; flags.push("2 claims in 12 months"); }
  if (c.delay > 30) { score += 15; flags.push("Filed more than 30 days after incident"); }
  if (!c.docs) { score += 20; flags.push("No supporting documents"); }
  if (/cash|urgent|no receipt|lost bill/i.test(c.desc)) { score += 10; flags.push("Suspicious wording in description"); }
  score = Math.min(100, score);

  let decision, cls;
  if (score >= 60) { decision = "Reject for investigation"; cls = "bad"; }
  else if (score >= 30 || c.amount > 200000) { decision = "Manual review"; cls = "warn"; }
  else { decision = "Auto-approved"; cls = "ok"; }
  return {score, flags, decision, cls};
}
$("claim-btn").onclick = () => {
  const c = {
    id: "CLM-" + String(claims.length + 1001),
    name: $("c-name").value.trim() || "Unknown",
    type: $("c-type").value, amount: +$("c-amt").value, coverage: +$("c-cov").value,
    policyAge: +$("c-age").value, prev: +$("c-prev").value, delay: +$("c-delay").value,
    docs: $("c-docs").value === "1", desc: $("c-desc").value
  };
  if (c.amount > c.coverage) {
    $("claim-out").innerHTML = `<div class="result bad">Claim amount cannot exceed the policy coverage. Lower the amount and submit again.</div>`;
    return;
  }
  const r = assessClaim(c);
  Object.assign(c, r); claims.unshift(c);
  $("claim-out").innerHTML = `<div class="result ${r.cls}">
    <div class="big">${r.decision}</div>
    <div>${c.id} &middot; Risk score ${r.score}/100</div>
    <ul>${r.flags.length ? r.flags.map(f => `<li>${f}</li>`).join("") : "<li>No risk flags found.</li>"}</ul></div>`;
};

// ---------- Module 3: Dashboard ----------
function renderDash() {
  const total = claims.length;
  const count = d => claims.filter(c => c.decision === d).length;
  const paid = claims.filter(c => c.decision === "Auto-approved").reduce((s,c) => s + c.amount, 0);
  $("stats").innerHTML = [
    ["Total claims", total], ["Auto-approved", count("Auto-approved")],
    ["Manual review", count("Manual review")], ["Rejected", count("Reject for investigation")],
    ["Approved value", inr(paid)]
  ].map(([l,v]) => `<div class="stat"><b>${v}</b>${l}</div>`).join("");
  $("rows").innerHTML = total ? claims.map(c =>
    `<tr><td>${c.id}</td><td>${c.name.replace(/</g,"&lt;")}</td><td>${c.type}</td><td>${inr(c.amount)}</td>
     <td>${c.score}</td><td><span class="tag ${c.cls}">${c.decision}</span></td></tr>`).join("")
    : `<tr><td colspan="6">No claims yet. File a claim to see it assessed here.</td></tr>`;
}
renderDash();