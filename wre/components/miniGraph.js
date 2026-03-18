/*
  miniGraph.js — lightweight ES module
  Exports:
    - computeCoherence(nodeStates, edges)
    - renderMiniGraph(container, { caseId, nodes, edges, nodeStates, highlights })
  No dependencies; uses SVG.
*/

export function computeCoherence(nodeStates, edges){
  const totalWeight = edges.reduce((s,e)=>s + Math.abs(Number(e.weight)||0), 0) || 1;
  let satisfied = 0;
  edges.forEach(e=>{
    const w = Number(e.weight)||0;
    const a = nodeStates[e.from] || 0;
    const b = nodeStates[e.to] || 0;
    if(w * a * b === 1) satisfied += Math.abs(w);
  });
  return Math.round(100 * satisfied / totalWeight);
}

function colorForState(state){
  if(state === 1) return '#0a6f48';   // accepted (green)
  if(state === -1) return '#c53030';  // rejected (red)
  return '#999999';                   // undecided (gray)
}

export function renderMiniGraph(container, opts){
  // opts: { caseId, nodes: [{id,label,type}], edges: [{from,to,weight}], nodeStates: {id: -1|0|1}, highlights: {edges: Set(ids)} }
  container.innerHTML = ''; // clear
  const { caseId, nodes = [], edges = [], nodeStates = {}, highlights = {edges: new Set()} } = opts || {};
  const svgNS = 'http://www.w3.org/2000/svg';
  const svgW = 320, svgH = 120;
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', svgW);
  svg.setAttribute('height', svgH);
  svg.setAttribute('role','img');
  svg.setAttribute('aria-label','Mini graph: case and connected principles');

  // layout: case on left, up-to-4 principle nodes on right in a column
  const caseX = 60, caseY = svgH/2;
  const principleX = svgW - 80;
  const connected = edges.filter(e => e.from === caseId).map(e=>e.to);
  const princNodes = nodes.filter(n => connected.includes(n.id)).slice(0,6);

  // draw case
  const cState = nodeStates[caseId] || 0;
  const cColor = colorForState(cState);
  const c = document.createElementNS(svgNS,'circle');
  c.setAttribute('cx', caseX);
  c.setAttribute('cy', caseY);
  c.setAttribute('r', 22);
  c.setAttribute('fill', cColor);
  c.setAttribute('stroke', '#333');
  c.setAttribute('stroke-width', '1');
  svg.appendChild(c);
  const ct = document.createElementNS(svgNS,'text');
  ct.setAttribute('x', caseX);
  ct.setAttribute('y', caseY+5);
  ct.setAttribute('text-anchor','middle');
  ct.setAttribute('font-size','11');
  ct.setAttribute('fill','#fff');
  ct.textContent = 'case';
  svg.appendChild(ct);

  // draw principle nodes and edges
  const gap = svgH / (princNodes.length + 1);
  princNodes.forEach((pn, i)=>{
    const py = gap * (i+1);
    const pid = pn.id;
    const pState = nodeStates[pid] || 0;
    const pColor = colorForState(pState);

    // edge line
    const line = document.createElementNS(svgNS,'line');
    line.setAttribute('x1', caseX+22);
    line.setAttribute('y1', caseY);
    line.setAttribute('x2', principleX-22);
    line.setAttribute('y2', py);
    line.setAttribute('stroke', (highlights.edges && highlights.edges.has(`${caseId}->${pid}`)) ? '#ff8c00' : '#888');
    line.setAttribute('stroke-width', highlights.edges && highlights.edges.has(`${caseId}->${pid}`) ? '3' : '1.5');
    svg.appendChild(line);

    // principle circle
    const p = document.createElementNS(svgNS,'circle');
    p.setAttribute('cx', principleX);
    p.setAttribute('cy', py);
    p.setAttribute('r', 20);
    p.setAttribute('fill', pColor);
    p.setAttribute('stroke', '#333');
    p.setAttribute('stroke-width', '1');
    svg.appendChild(p);
    const pt = document.createElementNS(svgNS,'text');
    pt.setAttribute('x', principleX);
    pt.setAttribute('y', py+4);
    pt.setAttribute('text-anchor','middle');
    pt.setAttribute('font-size','10');
    pt.setAttribute('fill','#fff');
    pt.textContent = (pn.label || pn.id || '').slice(0,10);
    svg.appendChild(pt);
  });

  // accessibility: add title/desc
  const title = document.createElementNS(svgNS,'title');
  title.textContent = `Mini graph for ${caseId}`;
  svg.insertBefore(title, svg.firstChild);

  container.appendChild(svg);
}
