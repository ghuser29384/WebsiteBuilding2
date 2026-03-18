/* Robust WRE lesson loader + simple coherence demo
   - Normalizes lesson JSON with either 'interactions' or 'steps'
   - Renders first judgment (question) found (supports 'options' or 'choices')
   - Saves choice to localStorage
   - Loads graph-edges.json (if available) and computes a simple coherence percent
*/
(async function(){
  const root = document.querySelector('.card') || document.getElementById('wre-root');
  if(!root){ console.error('No .card or #wre-root found'); return; }

  const intro = document.getElementById('wre-intro') || (()=>{
    const p=document.createElement('p'); p.id='wre-intro'; root.appendChild(p); return p;
  })();
  const progressEl = document.getElementById('progress') || (()=>{
    const d=document.createElement('div'); d.id='progress'; root.appendChild(d); return d;
  })();

  intro.textContent = 'Loading lesson...';

  function normalizeLesson(raw){
    // Accept either { interactions: [...] } or { steps: [...] } formats.
    if(raw.interactions && Array.isArray(raw.interactions)) return raw;
    if(raw.steps && Array.isArray(raw.steps)){
      const interactions = raw.steps.map(s=>{
        // Map common step types:
        if(s.type === 'judgment' || s.type === 'question'){
          return { id: s.id || s.case_id || ('q_'+Math.random().toString(36).slice(2,7)),
                   type: 'question',
                   prompt: s.prompt || s.text || s.prompt,
                   options: s.choices || s.options || (s.choices ? s.choices : undefined) || (s.options ? s.options : undefined) };
        }
        if(s.type === 'case'){
          return { id: s.case_id || s.id, type: 'case', caseId: s.case_id || s.id, text: s.text || s.description };
        }
        if(s.type === 'principle'){
          return { id: s.principle_id || s.id, type:'principle', principleId: s.principle_id || s.id, text: s.text };
        }
        if(s.type === 'theory'){
          return { id: s.theory_id || s.id, type:'theory', theoryId: s.theory_id || s.id, text: s.text };
        }
        if(s.type === 'coherence' || s.type === 'recompute'){
          return { type: 'recompute' };
        }
        if(s.type === 'revision'){
          return { type: 'revision', prompt: s.prompt || s.text };
        }
        return { ...s };
      });
      return {...raw, interactions};
    }
    // fallback: wrap top-level as single interaction
    return {...raw, interactions: []};
  }

  function computeCoherence(nodeStates, edges){
    // nodeStates: { id -> -1|0|+1 }
    // edges: [{from,to,weight}]
    if(!edges || edges.length===0) return 100;
    let satisfied = 0;
    for(const e of edges){
      const w = Number(e.weight) || 0;
      const a = nodeStates[e.from] || 0;
      const b = nodeStates[e.to] || 0;
      if(w * a * b === 1) satisfied++;
    }
    return Math.round(100 * satisfied / edges.length);
  }

  try{
    const r = await fetch('/data/lessons/lesson_trolley_1.json');
    if(!r.ok) throw new Error('lesson fetch failed: '+r.status);
    const rawLesson = await r.json();
    const lesson = normalizeLesson(rawLesson);

    // find a question/judgment interaction
    const q = (lesson.interactions||[]).find(i => i.type === 'question' || i.type === 'judgment');
    const caseNode = (lesson.interactions||[]).find(i => i.type === 'case') || null;

    const titleEl = root.querySelector('h1') || (()=>{ const h=document.createElement('h1'); root.prepend(h); return h; })();
    titleEl.textContent = lesson.title || lesson.id || 'WRE Lesson';

    if(!q){
      intro.textContent = 'No question found in this lesson.';
      return;
    }
    // normalize options
    const opts = q.options || q.choices || [];
    if(!Array.isArray(opts) || opts.length===0){
      intro.textContent = 'Question has no options to render.';
      return;
    }

    // render prompt + options
    intro.innerHTML = `<div class="prompt" style="margin-bottom:12px;"><strong>${q.prompt}</strong></div><div id="opts" style="display:flex;flex-wrap:wrap;gap:8px"></div><div id="coh" style="margin-top:12px;color:#333"></div>`;
    const optsEl = document.getElementById('opts');
    opts.forEach(opt=>{
      const b = document.createElement('button');
      b.className = 'btn';
      b.type = 'button';
      b.textContent = opt;
      b.dataset.opt = opt;
      b.style.minWidth = '80px';
      optsEl.appendChild(b);
    });

    // attempt to load edges for a coherence demo (non-fatal)
    let edges = [];
    try{
      const re = await fetch('/data/graph-edges.json');
      if(re.ok) edges = await re.json();
    }catch(_){ edges = []; }

    // default node states: we'll set the case node to +1 for "Yes", -1 for "No"
    // ASSUMPTION: any principle nodes connected to the case via edges will be treated as +1 (accepted) for the demo.
    // (This is an explicit assumption to produce a demo coherence value.) [Epistemic status: Assumed]
    function computeAndShow(caseId, answer){
      const nodeStates = {};
      nodeStates[caseId] = (answer === 'Yes' || answer === 'Yes' ) ? +1 : ((answer === 'No') ? -1 : 0);
      // set principle nodes connected from this case to +1 for demo purposes
      edges.forEach(e=>{
        if(e.from === caseId){
          nodeStates[e.to] = +1; // ASSUMPTION
        }
      });
      const C = computeCoherence(nodeStates, edges);
      const cohEl = document.getElementById('coh');
      cohEl.textContent = `Demo coherence: ${C}% (computed from ${edges.length} edge(s))`;
      // show a tiny inline SVG summary (case + first principle if present)
      const svgId = 'wre-mini-graph';
      if(document.getElementById(svgId)) document.getElementById(svgId).remove();
      const svgwrap = document.createElement('div'); svgwrap.id = svgId; svgwrap.style.marginTop='8px';
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS,'svg'); svg.setAttribute('width','220'); svg.setAttribute('height','80');
      // draw case node
      const cx = 40, cy=40;
      const caseState = nodeStates[caseId] || 0;
      const caseColor = caseState===1? '#0a5f38' : caseState===-1? '#c53030' : '#999';
      const c = document.createElementNS(svgNS,'circle'); c.setAttribute('cx',cx); c.setAttribute('cy',cy); c.setAttribute('r',18); c.setAttribute('fill',caseColor);
      svg.appendChild(c);
      const t1 = document.createElementNS(svgNS,'text'); t1.setAttribute('x',cx); t1.setAttribute('y',cy+4); t1.setAttribute('font-size','10'); t1.setAttribute('text-anchor','middle'); t1.setAttribute('fill','#fff'); t1.textContent = 'case';
      svg.appendChild(t1);
      // find first outgoing principle
      const firstEdge = edges.find(e=>e.from===caseId);
      if(firstEdge){
        const tx = 170, ty = 40;
        const pState = nodeStates[firstEdge.to] || 0;
        const pColor = pState===1? '#0a5f38' : pState===-1? '#c53030' : '#999';
        const p = document.createElementNS(svgNS,'circle'); p.setAttribute('cx',tx); p.setAttribute('cy',ty); p.setAttribute('r',18); p.setAttribute('fill',pColor);
        svg.appendChild(p);
        const t2 = document.createElementNS(svgNS,'text'); t2.setAttribute('x',tx); t2.setAttribute('y',ty+4); t2.setAttribute('font-size','10'); t2.setAttribute('text-anchor','middle'); t2.setAttribute('fill','#fff'); t2.textContent = firstEdge.to.split('_').join(' ').slice(0,10);
        svg.appendChild(t2);
        // edge line
        const l = document.createElementNS(svgNS,'line'); l.setAttribute('x1',cx+18); l.setAttribute('y1',cy); l.setAttribute('x2',tx-18); l.setAttribute('y2',ty); l.setAttribute('stroke','#888'); l.setAttribute('stroke-width','2');
        svg.appendChild(l);
      }
      svgwrap.appendChild(svg);
      document.getElementById('coh').appendChild(svgwrap);
    }

    optsEl.addEventListener('click', (ev)=>{
      const btn = ev.target.closest('button');
      if(!btn) return;
      const choice = btn.dataset.opt;
      // save minimal state
      const save = { lesson: lesson.id || lesson.title, choice, time: Date.now() };
      localStorage.setItem('wre_demo_choice', JSON.stringify(save));
      intro.innerHTML = `<p>Choice saved: <strong>${choice}</strong></p>`;
      // compute coherence if there is a case node
      const cId = caseNode ? (caseNode.caseId || caseNode.id) : (lesson.id || 'trolley_standard');
      computeAndShow(cId, choice);
    });

    // if user already made a choice before, show it
    try{
      const prev = JSON.parse(localStorage.getItem('wre_demo_choice') || 'null');
      if(prev && prev.lesson === (lesson.id || lesson.title) && prev.choice){
        intro.innerHTML = `<p>Previous choice: <strong>${prev.choice}</strong></p>`;
        const cId = caseNode ? (caseNode.caseId || caseNode.id) : (lesson.id || 'trolley_standard');
        computeAndShow(cId, prev.choice);
      }
    }catch(e){ /* ignore parse errors */ }

  }catch(err){
    intro.textContent = 'Error loading lesson: ' + (err && err.message ? err.message : String(err));
    console.error(err);
  }
})();
