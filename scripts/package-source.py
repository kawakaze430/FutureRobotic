#!/usr/bin/env python3
"""Create and verify a complete cumulative source archive, excluding local data.

Run from the repository root. Inventory hashes bind every included file except
the inventory itself. The archive's own hash is recorded beside the archive.
"""
from pathlib import Path
import hashlib,json,subprocess,zipfile,stat

ROOT=Path(__file__).resolve().parents[1]
NAME='FutureRobotic_AI_Workspace_Completion_20261024.zip'
INVENTORY='handoff/evidence/workspace-completion-20261024/package-inventory.json'
EXCLUDE={'deliverables','node_modules','__pycache__','.git','.sites-runtime','.wrangler','.next','.vinext','outputs','work','dist','cdk.out'}

def digest(data):return hashlib.sha256(data).hexdigest()
def included(name):
    p=Path(name)
    if any(part in EXCLUDE for part in p.parts):return False
    if name.startswith('portable/.data/'):return False
    if p.suffix in {'.pyc','.pyo','.key'}:return False
    if p.name=='.env' or (p.name.startswith('.env.') and not p.name.endswith(('example','sample','template'))):return False
    if p.suffix=='.pem' and name!='portable/certs/rds-global-bundle.pem':return False
    return True

def main():
    raw=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=ROOT)
    files=sorted({n for n in raw.decode().split('\0') if n and included(n)}|{INVENTORY})
    modes={}
    for entry in subprocess.check_output(['git','ls-files','--stage','-z'],cwd=ROOT).decode().split('\0'):
        if entry:
            meta,name=entry.split('\t',1);modes[name]=int(meta.split()[0],8)
    for name in files:
        path=ROOT/name
        if path.is_symlink() or not path.resolve().is_relative_to(ROOT):raise RuntimeError('Unsafe archive path: '+name)
        if name!=INVENTORY and not path.is_file():raise RuntimeError('Missing source: '+name)
    source_commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    inventory={'application_source_commit':source_commit,'baseline_source_commit':'76dda7b040a95e96c529073240056678d9f12ba4','scope':'Complete current cumulative source including handoff/evidence; delivery ZIPs, Git, credentials, dependencies, build outputs and runtime data excluded.','self_hash_omitted':INVENTORY,'files':[{'path':n,'bytes':(ROOT/n).stat().st_size,'sha256':digest((ROOT/n).read_bytes()),'mode':oct(modes.get(n,0o100644))} for n in files if n!=INVENTORY]}
    (ROOT/INVENTORY).parent.mkdir(parents=True,exist_ok=True)
    (ROOT/INVENTORY).write_text(json.dumps(inventory,indent=2)+'\n')
    target=ROOT/'deliverables'/NAME;target.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
        for name in files:
            info=zipfile.ZipInfo('FutureRobotic_AI/'+name,(2026,10,24,0,0,0))
            info.compress_type=zipfile.ZIP_DEFLATED
            mode=0o755 if modes.get(name,0o100644)&stat.S_IXUSR else 0o644
            info.create_system=3;info.external_attr=(stat.S_IFREG|mode)<<16
            archive.writestr(info,(ROOT/name).read_bytes())
    with zipfile.ZipFile(target) as archive:
        corrupt=archive.testzip()
        if corrupt:raise RuntimeError('CRC failed: '+corrupt)
        assert set(archive.namelist())=={'FutureRobotic_AI/'+n for n in files}
        for item in inventory['files']:
            assert digest(archive.read('FutureRobotic_AI/'+item['path']))==item['sha256'],item['path']
    sha=digest(target.read_bytes())
    target.with_suffix('.zip.sha256').write_text(sha+'  '+NAME+'\n')
    result={'archive':str(target.relative_to(ROOT)),'source_commit':source_commit,'file_count':len(files),'bytes':target.stat().st_size,'zip_integrity':'PASS: CRC, exact membership and all inventory hashes','sha256':sha}
    target.with_suffix('.verification.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))

if __name__=='__main__':main()
