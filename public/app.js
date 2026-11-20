'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const audio = $('audio');
  const ui = { books:$('books'), search:$('search'), count:$('count'), status:$('library-status'), title:$('track-title'), author:$('track-author'), meta:$('track-meta'), number:$('cover-number'), message:$('player-status'), download:$('download'), chapters:$('chapters'), details:$('chapter-details'), speed:$('speed'), back:$('back'), forward:$('forward'), restart:$('restart') };
  const store = { get(key) { try { return localStorage.getItem(key); } catch { return null; } }, set(key,value) { try { localStorage.setItem(key,String(value)); } catch {} } };
  let tracks=[], current=null, pendingSeek=0, lastSave=0;
  const fmt = seconds => { const n=Math.max(0,Math.floor(Number(seconds)||0)); return n>=3600 ? `${Math.floor(n/3600)}:${String(Math.floor(n/60)%60).padStart(2,'0')}:${String(n%60).padStart(2,'0')}` : `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`; };
  const fold = text => String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  const save = () => { if(current && Number.isFinite(audio.currentTime) && audio.readyState>=1) store.set(`edutec.position.${current.path}`,audio.ended?0:audio.currentTime); };
  function message(text,error=false){ui.message.textContent=text;ui.message.classList.toggle('error',error);}
  function safeTrack(raw){
    if(!raw || typeof raw.path!=='string' || typeof raw.title!=='string') return null;
    if(raw.path.startsWith('/') || raw.path.split('/').some(p=>p==='..'||p==='.') || !/\.(mp3|m4a|ogg|oga|wav|flac|aac|opus|webm)$/i.test(raw.path)) return null;
    const url=new URL(raw.path.split('/').map(encodeURIComponent).join('/'),document.baseURI);
    if(url.origin!==location.origin || !url.pathname.startsWith(new URL('./',document.baseURI).pathname)) return null;
    return {...raw,url:url.href,chapters:Array.isArray(raw.chapters)?raw.chapters.filter(c=>typeof c.title==='string'&&Number.isFinite(c.start)&&c.start>=0):[]};
  }
  function render(){
    const query=fold(ui.search.value.trim());
    const shown=tracks.filter(t=>fold(`${t.code||''} ${t.title} ${t.author||''}`).includes(query));
    ui.books.replaceChildren();
    ui.count.textContent=`${tracks.length} ${tracks.length===1?'livro':'livros'}`;
    ui.status.textContent=shown.length?'':(tracks.length?'Nenhum livro encontrado. Tente outro termo.':'Os áudios aparecerão aqui quando forem adicionados à biblioteca.');
    for(const track of shown){
      const li=document.createElement('li'),button=document.createElement('button');button.type='button';button.className='book';button.setAttribute('aria-pressed',String(current?.path===track.path));
      const code=document.createElement('span');code.className='book-number';code.textContent=track.code||'♫';code.setAttribute('aria-hidden','true');
      const text=document.createElement('span');text.className='book-text';
      const title=document.createElement('span');title.className='book-title';title.textContent=track.title;text.append(title);
      if(track.author){const by=document.createElement('span');by.className='book-byline';by.textContent=track.author;text.append(by);}
      const meta=document.createElement('span');meta.className='book-duration';meta.textContent=[track.duration?fmt(track.duration):'Áudio completo',track.code?`Componente ${track.code}`:''].filter(Boolean).join(' · ');text.append(meta);
      button.append(code,text);button.addEventListener('click',()=>select(track));li.append(button);ui.books.append(li);
    }
  }
  function chapterList(){
    ui.chapters.replaceChildren();ui.details.hidden=!current.chapters.length;$('chapter-count').textContent=`(${current.chapters.length})`;
    current.chapters.forEach(c=>{const li=document.createElement('li'),button=document.createElement('button'),time=document.createElement('time'),title=document.createElement('span');button.type='button';button.className='chapter';time.textContent=fmt(c.start);title.textContent=c.title;button.append(time,title);button.addEventListener('click',()=>{pendingSeek=c.start;if(audio.readyState>=1){audio.currentTime=Math.min(c.start,audio.duration||c.start);pendingSeek=null;save();}message(`Capítulo selecionado: ${c.title}. Aperte o play para ouvir.`);});li.append(button);ui.chapters.append(li);});
  }
  function select(track){
    if(current?.path===track.path)return;
    save();audio.pause();current=track;store.set('edutec.last',track.path);
    const position=Number(store.get(`edutec.position.${track.path}`));pendingSeek=Number.isFinite(position)&&position>0?position:0;
    ui.title.textContent=track.title;ui.author.textContent=track.author||'';ui.number.textContent=track.code||'♫';
    ui.meta.textContent=[track.duration?`${fmt(track.duration)} de áudio`:'Áudio completo',track.voice?`Voz ${track.voice}`:'',track.size?`${(track.size/1000000).toLocaleString('pt-BR',{maximumFractionDigits:1})} MB`:''].filter(Boolean).join(' · ');
    audio.src=track.url;audio.load();audio.playbackRate=Number(ui.speed.value);ui.download.href=track.url;ui.download.download=track.path.split('/').at(-1);ui.download.hidden=false;
    ui.back.disabled=ui.forward.disabled=ui.restart.disabled=false;message(pendingSeek>0?`Continuar de ${fmt(pendingSeek)}. Aperte o play para ouvir.`:'Aperte o play para começar.');
    chapterList();render();
    if('mediaSession' in navigator && typeof MediaMetadata!=='undefined') navigator.mediaSession.metadata=new MediaMetadata({title:track.title,artist:track.author||'Coleção EduTec',album:'Áudios dos e-books EduTec'});
  }
  audio.addEventListener('loadedmetadata',()=>{if(pendingSeek!==null){const end=Number.isFinite(audio.duration)?audio.duration:Infinity;audio.currentTime=pendingSeek>=end-2?0:Math.max(0,pendingSeek);pendingSeek=null;}audio.playbackRate=Number(ui.speed.value);});
  audio.addEventListener('timeupdate',()=>{if(Date.now()-lastSave>2000){save();lastSave=Date.now();}});
  audio.addEventListener('pause',save);audio.addEventListener('ended',()=>{save();message('Leitura concluída. Você pode ouvir novamente ou escolher outro livro.');});
  audio.addEventListener('play',()=>message('Seu ponto de escuta é salvo automaticamente neste navegador.'));
  audio.addEventListener('error',()=>message('Não foi possível carregar o áudio. Confira sua conexão e tente atualizar a página.',true));
  window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden)save();});
  ui.back.addEventListener('click',()=>{if(audio.readyState>=1){audio.currentTime=Math.max(0,audio.currentTime-15);save();}});
  ui.forward.addEventListener('click',()=>{if(audio.readyState>=1){audio.currentTime=Math.min(audio.duration,audio.currentTime+15);save();}});
  ui.restart.addEventListener('click',()=>{pendingSeek=0;if(audio.readyState>=1){audio.currentTime=0;pendingSeek=null;}if(current)store.set(`edutec.position.${current.path}`,0);message('Pronto para ouvir do início. Aperte o play.');});
  ui.speed.value=['0.75','1','1.25','1.5','1.75','2'].includes(store.get('edutec.speed'))?store.get('edutec.speed'):'1';
  ui.speed.addEventListener('change',()=>{audio.playbackRate=Number(ui.speed.value);store.set('edutec.speed',ui.speed.value);});
  ui.search.addEventListener('input',render);
  fetch('catalogo.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Catálogo indisponível');return r.json();}).then(data=>{if(!Array.isArray(data.tracks))throw Error('Catálogo inválido');tracks=data.tracks.map(safeTrack).filter(Boolean);render();if(tracks.length)select(tracks.find(t=>t.path===store.get('edutec.last'))||tracks[0]);}).catch(()=>{ui.status.textContent='Não foi possível carregar a biblioteca. Atualize a página em alguns instantes.';ui.status.classList.add('error');});
})();
