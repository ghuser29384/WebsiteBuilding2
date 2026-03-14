const startBtn = document.getElementById('start-btn');
const progressEl = document.getElementById('progress');

const sampleNodes = {
  trolley_standard: 0,
  maximize_welfare: 0
};
const sampleEdges = [
  { from: 'trolley_standard', to: 'maximize_welfare', weight: 1 }
];

function computeCoherence(nodes, edges) {
  const state = nodes; // map id -> -1|0|1
  let satisfied = 0;
  const total = edges.length;
  if (total === 0) return 100;
  for (const e of edges) {
    const w = e.weight;
    const a = state[e.from] || 0;
    const b = state[e.to] || 0;
    if (w * a * b === 1) satisfied++;
  }
  return Math.round(100 * satisfied / total);
}

function saveState(state) {
  localStorage.setItem('wre_state', JSON.stringify(state));
}

function loadState() {
  try { return JSON.parse(localStorage.getItem('wre_state')) || {}; }
  catch { return {}; }
}

startBtn.addEventListener('click', () => {
  // simple flow: accept the trolley case (+1) then accept principle (+1) and show coherence
  sampleNodes['trolley_standard'] = +1;
  const c1 = computeCoherence(sampleNodes, sampleEdges);
  sampleNodes['maximize_welfare'] = +1;
  const c2 = computeCoherence(sampleNodes, sampleEdges);
  document.getElementById('wre-intro').innerHTML =
    `<p>Coherence after case judgment: ${c1}%</p><p>Coherence after accepting principle: ${c2}%</p>`;
  saveState({ nodes: sampleNodes, coherence: c2 });
});
