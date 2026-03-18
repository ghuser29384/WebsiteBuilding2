/* Robust WRE UI: lesson selector, schema normalization, coherence demo */
(async function(){
  const root = document.getElementById('wre-root') || document.body;
  const card = root.querySelector('.card') || (function(){const d=document.createElement('div'); d.className='card'; root.appendChild(d); return d; })();
  card.innerHTML = '<h1>Reflective Equilibrium (WRE)</h1><div id="wre-main"></div>';
  const main = document.getElementById('wre-main');

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

  function render(selector){
    main.innerHTML = `
      <div style="display:flex;gap:16px;align-items:flex-start;">
        <div id="lesson-list" style="min-width:220px;max-width:260px"></div>
        <div id="lesson-area" style="flex:1"></div>
      </div>
    `;
  }

  function computeCoherence(nodeStates, edges){
    if(!edges || !edges.length) return 100;
    let satisfied=0;
    edges.forEach(e=>{
      const w = Number(e.weight)||0;
      const a = nodeStates[e.from]||0;
      const b = nodeStates[e.to]||0;
      if(w*a*b===1) satisfied++;
    });
    return Math.round(100*satisfied/edges.length);
  }

  render();

  // load lesson index
  let lessonFiles = [];
  try{
    const idx = await fetch('/data/lessons/index.json').then(r=>r.json());
    lessonFiles = idx;
  }catch(e){
    console.error('Cannot load lessons index',e);
    const candidate = ['/data/lessons/lesson_trolley_1.json'];
    lessonFiles = candidate;
  }

  const lessonListEl = document.getElementById('lesson-list');
  const lessonArea = document.getElementById('lesson-area');

  async function loadAndShowLesson(path){
    lessonArea.innerHTML = '<p>Loading lesson…</p>';
    try{
      const raw = await fetch(path).then(r=>r.json());
      const lesson = normalizeLesson(raw);
      const q = (lesson.interactions||[]).find(i=>i.type==='question');
      const caseNode = (lesson.interactions||[]).find(i=>i.type==='case');
      lessonArea.innerHTML = '<div id="lesson-card"></div>';
      const lc = document.getElementById('lesson-card');
      lc.innerHTML = `<h2>${lesson.title||lesson.id}</h2><div id="prompt"></div><div id="opts" style="margin-top:12px"></div><div id="coh" style="margin-top:10px;color:#333"></div>`;
      if(!q){ document.getElementById('prompt').innerText='No question found.'; return; }
      document.getElementById('prompt').innerHTML = '<strong>'+q.prompt+'</strong>';
      const optsEl = document.getElementById('opts');
      const opts = q.options||q.choices||[];
      opts.forEach(o=>{
        const b=document.createElement('button'); b.className='btn'; b.textContent=o; b.style.margin='6px'; b.onclick=()=>onChoice(o, lesson, caseNode); optsEl.appendChild(b);
      });
      // if existing choice, show it
      try{ const prev=JSON.parse(localStorage.getItem('wre_demo_choice')||'null'); if(prev && prev.lesson===lesson.id){ document.getElementById('coh').innerText = 'Previous choice: '+prev.choice; } }catch(e){}
    }catch(err){
      lessonArea.innerHTML = '<p>Error loading lesson: '+err+'</p>';
    }
  }

  async function onChoice(choice, lesson, caseNode){
    // save
    const state = {lesson: lesson.id||lesson.title, choice, at: Date.now()};
    localStorage.setItem('wre_demo_choice', JSON.stringify(state));
    document.getElementById('prompt').innerHTML = '<p>Saved: <strong>'+choice+'</strong></p>';
    // compute coherence
    let edges=[];
    try{ edges = await fetch('/data/graph-edges.json').then(r=>r.json()); }catch(e){ edges=[]; }
    const caseId = caseNode ? (caseNode.caseId||caseNode.id) : (lesson.id || 'case_1');
    const nodeStates = {};
    nodeStates[caseId] = (String(choice).toLowerCase().startsWith('y')?1:-1);
    edges.forEach(e=>{ if(e.from===caseId) nodeStates[e.to]=1; });
    const C = computeCoherence(nodeStates, edges);
    document.getElementById('coh').innerText = 'Demo coherence: '+C+'%';
    // simple inline svg show
    const svgwrap = document.createElement('div'); svgwrap.style.marginTop='8px';
    const svgNS='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(svgNS,'svg'); svg.setAttribute('width','260'); svg.setAttribute('height','80');
    const cx=40,cy=40; const ccol = nodeStates[caseId]===1? '#0a5f38' : '#c53030';
    const circ=document.createElementNS(svgNS,'circle'); circ.setAttribute('cx',cx); circ.setAttribute('cy',cy); circ.setAttribute('r',18); circ.setAttribute('fill',ccol); svg.appendChild(circ);
    const t=document.createElementNS(svgNS,'text'); t.setAttribute('x',cx); t.setAttribute('y',cy+4); t.setAttribute('font-size','10'); t.setAttribute('text-anchor','middle'); t.setAttribute('fill','#fff'); t.textContent='case'; svg.appendChild(t);
    const first = edges.find(e=>e.from===caseId);
    if(first){
      const px=200,py=40; const pcol = '#0a5f38';
      const pc=document.createElementNS(svgNS,'circle'); pc.setAttribute('cx',px); pc.setAttribute('cy',py); pc.setAttribute('r',18); pc.setAttribute('fill',pcol); svg.appendChild(pc);
      const pt=document.createElementNS(svgNS,'text'); pt.setAttribute('x',px); pt.setAttribute('y',py+4); pt.setAttribute('font-size','10'); pt.setAttribute('text-anchor','middle'); pt.setAttribute('fill','#fff'); pt.textContent = first.to.split('_').join(' ').slice(0,10); svg.appendChild(pt);
      const line=document.createElementNS(svgNS,'line'); line.setAttribute('x1',cx+18); line.setAttribute('y1',cy); line.setAttribute('x2',px-18); line.setAttribute('y2',py); line.setAttribute('stroke','#888'); line.setAttribute('stroke-width','2'); svg.appendChild(line);
    }
    svgwrap.appendChild(svg);
    const cohEl = document.getElementById('coh'); cohEl.appendChild(svgwrap);
  }

  // populate lesson list
  lessonListEl.innerHTML = '<h3>Lessons</h3>';
  const ul = document.createElement('div');
  lessonFiles.forEach((p,i)=>{
    const name = p.split('/').pop().replace('.json','');
    const el = document.createElement('div');
    el.style.padding='6px';
    el.style.borderBottom='1px solid #eee';
    el.innerHTML = `<a href="#" data-path="${p}">${name}</a>`;
    el.querySelector('a').addEventListener('click', (ev)=>{
      ev.preventDefault(); loadAndShowLesson(ev.currentTarget.dataset.path);
    });
    ul.appendChild(el);
  });
  lessonListEl.appendChild(ul);

  // auto-load first lesson
  if(lessonFiles.length) loadAndShowLesson(lessonFiles[0]);

})();
