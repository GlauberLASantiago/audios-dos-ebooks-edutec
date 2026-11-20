"""Build the static player and discover audio files without third-party packages."""
from pathlib import Path
import json, re, shutil

ROOT=Path(__file__).resolve().parents[1]
SITE=ROOT/'_site'
EXTENSIONS={'.mp3','.m4a','.ogg','.oga','.wav','.flac','.aac','.opus','.webm'}

def sync(data):
    return sum((b&127)<<(7*(len(data)-i-1)) for i,b in enumerate(data))

def decode_text(data):
    if not data:return ''
    enc={0:'latin1',1:'utf-16',2:'utf-16-be',3:'utf-8'}.get(data[0],'utf-8')
    return data[1:].decode(enc,errors='replace').strip('\x00 \ufeff')

def frames(data,version):
    i=0
    while i+10<=len(data):
        key=data[i:i+4].decode('ascii',errors='replace')
        if not re.fullmatch('[A-Z0-9]{4}',key):break
        n=sync(data[i+4:i+8]) if version==4 else int.from_bytes(data[i+4:i+8],'big')
        if n<=0 or i+10+n>len(data):break
        yield key,data[i+10:i+10+n]
        i+=10+n

def metadata(path):
    info={};chapters=[]
    if path.suffix.lower()!='.mp3':return info
    with path.open('rb') as f:
        header=f.read(10)
        if header[:3]!=b'ID3' or header[3] not in (3,4):return info
        n=sync(header[6:10])
        if n>16*1024*1024:return info
        data=f.read(n)
    for key,payload in frames(data,header[3]):
        if key in ('TIT2','TPE1','TALB','TLEN'):info[key]=decode_text(payload)
        elif key=='CHAP':
            sep=payload.find(b'\0')
            if sep<0 or sep+17>len(payload):continue
            start=int.from_bytes(payload[sep+1:sep+5],'big')/1000
            title=next((decode_text(p) for k,p in frames(payload[sep+17:],header[3]) if k=='TIT2'),'')
            if title:chapters.append({'title':title,'start':start})
    info['chapters']=sorted(chapters,key=lambda c:c['start'])
    return info

def track(path):
    path=path.resolve()
    if not path.is_relative_to(ROOT.resolve()):raise ValueError('Audio file outside repository')
    rel=path.relative_to(ROOT).as_posix()
    fallback=re.sub(r'_(?:V\d+|Thalita)(?=_|$)','',path.stem,flags=re.I)
    match=re.match(r'^(\d{1,3})[_\s-]+(.*)',fallback)
    code=match[1].zfill(2) if match else ''
    fallback=(match[2] if match else fallback).replace('_',' ')
    meta=metadata(path)
    try:duration=float(meta.get('TLEN',''))/1000
    except (ValueError,TypeError):duration=None
    return {'path':rel,'title':meta.get('TIT2') or fallback,'code':code,
            'author':meta.get('TPE1',''),'duration':duration,'size':path.stat().st_size,
            'voice':'Thalita' if 'thalita' in path.name.lower() else '',
            'chapters':meta.get('chapters',[])}

def main():
    # Only the root and audios/ are scanned, so build files and private local
    # workspace material can never accidentally enter the public deployment.
    candidates=list(ROOT.iterdir())
    if (ROOT/'audios').is_dir():candidates+=list((ROOT/'audios').rglob('*'))
    audio=sorted({p for p in candidates if p.is_file() and p.suffix.lower() in EXTENSIONS},key=lambda p:p.as_posix())
    tracks=[track(p) for p in audio]
    tracks.sort(key=lambda t:(int(t['code'] or 99999),t['title'].casefold(),t['path']))
    assert SITE.resolve().parent==ROOT.resolve() and SITE.name=='_site'
    if SITE.exists():
        # Some synchronized Windows folders cannot themselves be removed.
        # Clearing generated files is sufficient; empty folders are harmless.
        for item in SITE.rglob('*'):
            if item.is_file():item.unlink()
    shutil.copytree(ROOT/'public',SITE,dirs_exist_ok=True)
    for item,path in zip([track(p) for p in audio],audio):
        dest=SITE/item['path'];dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,dest)
    (SITE/'catalogo.json').write_text(json.dumps({'tracks':tracks},ensure_ascii=False,indent=2),encoding='utf-8')
    (SITE/'.nojekyll').touch()
    print(f'Catálogo atualizado: {len(tracks)} áudio(s).')
    for t in tracks:print(f'{t["code"]} {t["title"]}: {len(t["chapters"])} capítulos')

if __name__=='__main__':main()
