/* enhanced app.js — loads lesson list, shows lesson, and renders miniGraph */
(async function(){
  const root = document.getElementById('wre-root') || document.body;
  const card = root.querySelector('.card') || (function(){ const d=document.createElement('div'); d.className='card'; root.appendChild(d); return d; })();
  // keep header
  const header = card.querySelector('h1') || (()=>{ const h=document.createElement('h1'); card.prepend(h); return h; })();
  header.textContent = 'Reflective Equilibrium (WRE)';

  // main layout
  card.innerHTML = `
    <div id="wre-main" style="display:flex;gap:18px;align-items:flex-start">
      <div id="lesson-col" style="flex:1;min-width:320px"></div>
      <aside id="viz-col" style="width:360px"></aside>
    </div>
  `;
  const lessonCol = document.getElementById('lesson-col');
  const vizCol = document.getElementById('viz-col');

  // dynamic import of miniGraph
  let mg = null;
  try{ mg = await import('/wre/components/miniGraph.js'); }catch(e){ console.error('miniGraph import failed',e); }

  // utilities
  function normalizeLesson(raw){
    if(raw.interactions && Array.isArray(raw.interactions)) return raw;
    if(raw.steps && Array.isArray(raw.steps)){
      const interactions = raw.steps.map(s=>{
        const t = (s.type||'').toLowerCase();
        if(t==='judgment' || t==='question') return {id:s.id||null, type:'question', prompt:s.prompt||s.text, options:s.choices||s.options||[]};
        if(t==='case') return {id:s.id||s.case_id, type:'case', caseId:s.case_id||s.id, text:s.text||s.description};
        if(t==='principle') return {id:s.id, type:'principle', principleId:s.principle_id||s.id, text:s.text||s.explanation};
        if(t==='recompute' || t==='coherence') return {type:'recompute'};
        return {...s};
      });
      return {...raw, interactions};
    }
    return {...raw, interactions: raw.interactions||[]};
  }

  async function loadIndex(){
    try{
      const idx = await fetch('/data/lessons/index.json').then(r=>r.json());
      return idx;
    }catch(e){
      console.error('failed to load lessons index',e);
      return [];
    }
  }

  function renderLessonList(list){
    const el = document.createElement('div');
    el.innerHTML = '<h3>Lessons</h3><div id="lesson-list"></div>';
    const listEl = el.querySelector('#lesson-list');
    list.forEach(p=>{
      const name = p.split('/').pop().replace('.json','');
      const item = document.createElement('div');
      item.style.padding = '8px 6px';
      item.style.borderBottom = '1px solid #eee';
      const a = document.createElement('a');
      a.href='#'; a.dataset.path = p; a.textContent = name;
      a.onclick = (ev)=>{ ev.preventDefault(); loadAndShowLesson(p); };
      item.appendChild(a);
      listEl.appendChild(item);
    });
    lessonCol.appendChild(el);
  }

  async function loadAndShowLesson(path){
    const area = document.createElement('div');
    area.innerHTML = '<p>Loading lesson…</p>';
    lessonCol.appendChild(area);
    try{
      const raw = await fetch(path).then(r => r.ok ? r.json() : Promise.reject(new Error('fetch failed '+r.status)));
      const lesson = normalizeLesson(raw);
      // render case + question
      const q = (lesson.interactions||[]).find(i=>i.type==='question');
      const caseNode = (lesson.interactions||[]).find(i=>i.type==='case') || null;
      area.innerHTML = '';
      const title = document.createElement('h2'); title.textContent = lesson.title || lesson.id || 'Lesson'; area.appendChild(title);
      const prompt = document.createElement('div'); prompt.id='prompt'; prompt.style.marginBottom='12px'; area.appendChild(prompt);
      if(!q){ prompt.textContent = 'No question found in lesson.'; return; }
      prompt.innerHTML = `<div style="font-weight:600;margin-bottom:8px">${q.prompt}</div>`;
      const opts = document.createElement('div'); opts.style.display='flex'; opts.style.gap='8px';
      q.options.forEach(opt=>{
        const b=document.createElement('button'); b.className='btn'; b.type='button'; b.textContent = opt; b.onclick = ()=>onChoice(opt, lesson, caseNode);
        opts.appendChild(b);
      });
      area.appendChild(opts);

      // initial viz
      updateViz(lesson, caseNode, null);
      // if previously answered, show previous
      try{
        const prev = JSON.parse(localStorage.getItem('wre_demo_choice')||'null');
        if(prev && prev.lesson === (lesson.id||lesson.title) && prev.choice){
          const saved = document.createElement('div'); saved.textContent = 'Previous choice: ' + prev.choice; saved.style.marginTop='10px'; area.appendChild(saved);
          updateViz(lesson, caseNode, prev.choice);
        }
      }catch(e){}
    }catch(err){
      area.innerHTML = '<p>Error loading lesson: '+String(err)+'</p>';
      console.error(err);
    }
  }

  async function onChoice(choice, lesson, caseNode){
    localStorage.setItem('wre_demo_choice', JSON.stringify({lesson: lesson.id||lesson.title, choice, time: Date.now()}));
    // update viz with selected answer
    updateViz(lesson, caseNode, choice);
  }

  async function updateViz(lesson, caseNode, selection){
    vizCol.innerHTML = '<div style="padding:10px"><strong>Visualization</strong></div>';
    const vizWrap = document.createElement('div'); vizWrap.style.padding='10px'; vizCol.appendChild(vizWrap);

    // fetch graph edges and node metadata
    let edges = [];
    try{ edges = await fetch('/data/graph-edges.json').then(r=>r.ok? r.json(): []); }catch(e){ edges = []; }
    // build nodes from lesson: include case node and connected principle nodes (1-hop)
    const caseId = caseNode ? (caseNode.caseId||caseNode.id) : (lesson.id || 'case_1');
    const connected = edges.filter(e=>e.from === caseId).map(e=>e.to);
    const nodes = [{ id: caseId, label: 'case', type: 'case' }].concat(connected.map(id => ({ id, label: id, type: 'principle' })));

    // node states: case +1 for 'Yes' or -1 for 'No'; principle nodes default 0 (demo: set to +1)
    const nodeStates = {};
    nodeStates[caseId] = (selection && String(selection).toLowerCase().startsWith('y')) ? 1 : (selection ? -1 : 0);
    edges.forEach(e => { if(e.from === caseId) nodeStates[e.to] = nodeStates[e.to] || 1; });

    // highlights: mark edges from case that contributed (demo: all outgoing)
    const highlights = { edges: new Set(edges.filter(e=>e.from===caseId).map(e=>`${e.from}->${e.to}`)) };

    // show coherence percent using computeCoherence (from module if possible)
    let C = 0;
    if(mg && mg.computeCoherence){
      C = mg.computeCoherence(nodeStates, edges);
    } else {
      // fallback basic compute
      const total = edges.reduce((s,e)=>s + Math.abs(Number(e.weight)||0), 0) || 1;
      let sat = 0;
      edges.forEach(e=>{ const w=Number(e.weight)||0; const a=nodeStates[e.from]||0; const b=nodeStates[e.to]||0; if(w*a*b===1) sat += Math.abs(w); });
      C = Math.round(100*sat/total);
    }
    const cohEl = document.createElement('div'); cohEl.style.marginTop='8px'; cohEl.innerHTML = `<div style="font-size:18px;font-weight:600">Coherence: ${C}%</div>`;
    vizWrap.appendChild(cohEl);

    // render mini graph via module (if available) or fallback text
    const graphDiv = document.createElement('div'); graphDiv.id='mini-graph'; graphDiv.style.marginTop='8px';
    vizWrap.appendChild(graphDiv);
    if(mg && mg.renderMiniGraph){
      mg.renderMiniGraph(graphDiv, { caseId, nodes, edges, nodeStates, highlights });
    } else {
      graphDiv.textContent = 'Graph module not available.';
    }

    // small explanation: list outgoing edges (basis text)
    const out = document.createElement('div'); out.style.marginTop='10px';
    out.innerHTML = '<div style="font-weight:600">Related edges (demo):</div>';
    const list = document.createElement('ul'); list.style.marginTop='6px';
    edges.filter(e=>e.from===caseId).slice(0,6).forEach(e=>{
      const li=document.createElement('li'); li.style.marginBottom='6px';
      li.innerHTML = `<strong>${e.to}</strong> — ${e.relation || e.basis || ''}`; list.appendChild(li);
    });
    out.appendChild(list);
    vizWrap.appendChild(out);
  }

  // bootstrap: load index and render list
  const index = await loadIndex();
  renderLessonList(index);
  if(index && index.length) loadAndShowLesson(index[0]);

})();
