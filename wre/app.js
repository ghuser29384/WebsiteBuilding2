(async function(){
  const root = document.querySelector('.card') || document.getElementById('wre-root');
  const intro = document.getElementById('wre-intro') || (()=>{
    const p=document.createElement('p'); p.id='wre-intro'; root.appendChild(p); return p;
  })();
  intro.textContent='Loading lesson...';
  try{
    const r = await fetch('/data/lessons/lesson_trolley_1.json'); if(!r.ok) throw new Error(r.status);
    const lesson = await r.json();
    const q = lesson.interactions.find(i => i.type === 'question');
    const title = root.querySelector('h1') || document.createElement('h1');
    title.textContent = lesson.title || 'WRE Lesson';
    root.prepend(title);
    intro.innerHTML = `<div><strong>${q.prompt}</strong></div><div id="opts"></div>`;
    const opts = document.getElementById('opts');
    q.options.forEach(opt => { const b = document.createElement('button'); b.textContent = opt; b.className='btn'; b.style.margin='6px'; b.onclick = ()=>{ intro.innerHTML = '<p>Saved: '+opt+'</p>'; localStorage.setItem('wre_demo_choice', JSON.stringify({lesson:lesson.id,choice:opt})); }; opts.appendChild(b); });
  }catch(err){ intro.textContent = 'Error loading lesson: '+err; console.error(err); }
})();
