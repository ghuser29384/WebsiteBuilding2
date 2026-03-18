#!/usr/bin/env python3
# normalize_lessons.py — convert various lesson JSON shapes into canonical format
# Usage: python3 scripts/normalize_lessons.py

import json,os,re,sys
from pathlib import Path

IN_DIR = Path('data/lessons')
OUT_DIR = IN_DIR

def slug(s):
    s = re.sub(r'[^a-z0-9]+','_', s.lower())
    return re.sub(r'_+','_',s).strip('_')

def normalize(raw):
    # Aim: canonical object: { id, title, interactions: [ {id,type,prompt/options,...} ], goal, sources }
    out = {}
    out['id'] = raw.get('id') or raw.get('slug') or slug(raw.get('title','lesson'))
    out['title'] = raw.get('title') or raw.get('name') or out['id']
    out['goal'] = raw.get('goal','')
    out['sources'] = raw.get('sources', raw.get('source', []))
    interactions = []

    if isinstance(raw.get('interactions'), list) and raw.get('interactions'):
        interactions = raw['interactions']
    elif isinstance(raw.get('steps'), list) and raw.get('steps'):
        for s in raw['steps']:
            t = s.get('type','').lower()
            if t in ('judgment','question'):
                interactions.append({
                    'id': s.get('id') or slug(s.get('prompt','q')),
                    'type': 'question',
                    'prompt': s.get('prompt') or s.get('text') or s.get('question'),
                    'options': s.get('choices') or s.get('options') or []
                })
            elif t == 'case':
                interactions.append({
                    'id': s.get('id') or s.get('case_id') or slug(s.get('title','case')),
                    'type': 'case',
                    'caseId': s.get('case_id') or s.get('id'),
                    'text': s.get('text') or s.get('description')
                })
            elif t in ('principle','principle_step'):
                interactions.append({
                    'id': s.get('id') or s.get('principle_id'),
                    'type':'principle',
                    'principleId': s.get('principle_id') or s.get('id'),
                    'text': s.get('text') or s.get('explanation')
                })
            elif t in ('recompute','coherence'):
                interactions.append({'type':'recompute'})
            else:
                interactions.append({'type': t, **s})
    else:
        # fallback: wrap top-level text
        interactions = []

    out['interactions'] = interactions
    return out

def main():
    if not IN_DIR.exists():
        print("No data/lessons directory found.", file=sys.stderr); sys.exit(1)
    files = list(IN_DIR.glob('*.json'))
    print(f'Found {len(files)} lesson files.')
    for i,f in enumerate(files,1):
        try:
            raw = json.load(open(f,'r',encoding='utf-8'))
        except Exception as e:
            print('SKIP parse error',f, e); continue
        norm = normalize(raw)
        base = slug(norm.get('title') or f.stem)
        outname = f'lesson_{base}_{i}.json'
        outpath = OUT_DIR / outname
        json.dump(norm, open(outpath,'w',encoding='utf-8'), ensure_ascii=False, indent=2)
        print('WROTE', outpath)
    print('Normalization complete.')

if __name__ == "__main__":
    main()
