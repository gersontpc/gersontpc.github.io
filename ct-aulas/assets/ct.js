/* ct-aulas: carrega as aulas (aulas/aula-N.html) dentro do index.html e depois inicia a página. */
(function(){
  var slots=[].slice.call(document.querySelectorAll('[data-aula]'));
  Promise.all(slots.map(function(el){
    return fetch(el.getAttribute('data-aula'),{cache:'no-cache'}).then(function(r){if(!r.ok) throw new Error(r.status+' '+r.url); return r.text()});
  })).then(function(htmls){
    slots.forEach(function(el,i){el.outerHTML=htmls[i]});
    start();
  }).catch(function(err){
    var m=document.querySelector('main');
    var w=document.createElement('div'); w.className='warn'; w.style.margin='24px 0';
    w.innerHTML='<b>Não foi possível carregar as aulas</b><p>Abra a página pelo endereço do site ou por um servidor local (<code>python3 -m http.server</code> dentro de <code>ct-aulas/</code>). Abrir o arquivo direto do disco não funciona. Detalhe: '+String(err&&err.message||err)+'</p>';
    m.insertBefore(w,m.firstChild);
    start();
  });

  function start(){
  var store={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  var root=document.documentElement;

  /* Tema */
  var th=store.get('ct-theme'); if(th) root.setAttribute('data-theme',th);
  document.getElementById('themeBtn').addEventListener('click',function(){
    var cur=root.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
    var nx=cur==='dark'?'light':'dark'; root.setAttribute('data-theme',nx); store.set('ct-theme',nx);
  });

  /* Abas */
  var tabs=[].slice.call(document.querySelectorAll('.tab'));
  var panels=[].slice.call(document.querySelectorAll('.panel'));
  var presentBtn=document.getElementById('presentBtn');
  function show(id,scroll){
    if(!document.getElementById(id)||!document.querySelector('.tab[data-tab="'+id+'"]')) id='inicio';
    panels.forEach(function(p){p.hidden=p.dataset.panel!==id});
    tabs.forEach(function(t){t.setAttribute('aria-selected',t.dataset.tab===id?'true':'false')});
    store.set('ct-tab',id);
    if(location.hash!=='#'+id) history.replaceState(null,'','#'+id);
    if(scroll!==false) window.scrollTo(0,0);
    presentBtn.hidden=id==='inicio';
    var ddBtn=document.getElementById('aulasBtn'),ddCur=document.getElementById('aulasCur');
    if(ddBtn){var isAula=id.indexOf('aula-')===0;ddBtn.classList.toggle('on',isAula);ddCur.textContent=isAula?'· Aula '+('0'+id.split('-')[1]).slice(-2):'';closeDd();}
  }
  function closeDd(){var m=document.getElementById('aulasMenu'),b=document.getElementById('aulasBtn');if(m){m.hidden=true;b.setAttribute('aria-expanded','false')}}
  (function(){
    var b=document.getElementById('aulasBtn'),m=document.getElementById('aulasMenu'),dd=document.getElementById('aulasDd'); if(!b) return;
    b.addEventListener('click',function(e){e.stopPropagation();var open=m.hidden;m.hidden=!open;b.setAttribute('aria-expanded',open?'true':'false');if(open){var sel=m.querySelector('[aria-selected="true"]')||m.querySelector('.tab');sel.focus()}});
    document.addEventListener('click',function(e){if(!dd.contains(e.target))closeDd()});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!m.hidden){closeDd();b.focus()}});
  })();
  tabs.forEach(function(t){t.addEventListener('click',function(){show(t.dataset.tab)})});
  document.querySelectorAll('[data-go]').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();show(b.dataset.go)})});
  var h=(location.hash||'').slice(1);
  show(h&&document.getElementById(h)&&document.getElementById(h).classList.contains('panel')?h:(store.get('ct-tab')||'inicio'),false);

  /* Índice, numeração de slides e exercícios */
  document.querySelectorAll('.panel[data-panel^="aula"]').forEach(function(panel){
    var ol=panel.querySelector('.toc ol'); var n=0;
    var total=panel.querySelectorAll('.slide').length;
    panel.querySelectorAll('.slide').forEach(function(s){n++;var sn=document.createElement('span');sn.className='sn';sn.textContent=n+'/'+total;s.appendChild(sn)});
    if(!ol) return;
    panel.querySelectorAll('.topico').forEach(function(tp){
      var li=document.createElement('li'),a=document.createElement('a');
      a.href='#'+tp.id; a.textContent=tp.querySelector('.topico-head h2').textContent; a.dataset.t=tp.id;
      a.addEventListener('click',function(e){e.preventDefault();tp.scrollIntoView({behavior:'smooth',block:'start'})});
      li.appendChild(a); ol.appendChild(li);
    });
    var labs=[].slice.call(panel.querySelectorAll('.lab')).sort(function(a,b){
      return parseFloat(a.querySelector('.lab-tag').textContent.replace(/[^0-9.]/g,''))-parseFloat(b.querySelector('.lab-tag').textContent.replace(/[^0-9.]/g,''));
    });
    if(labs.length){
      var hb=document.createElement('b');hb.className='toc-exh';hb.textContent='Exercícios';
      var ul=document.createElement('ul');ul.className='toc-ex';
      labs.forEach(function(l){
        var li=document.createElement('li'),a=document.createElement('a');
        var tag=l.querySelector('.lab-tag').textContent.replace('Exercício ','');
        var box=l.querySelector('.done input');
        a.href='#'+(box?box.id:'');a.innerHTML='<span class="te-n">'+tag+'</span><span class="te-t"></span>';
        a.querySelector('.te-t').textContent=l.querySelector('.lab-head h3').textContent;
        if(box) a.dataset.ex=box.id;
        a.addEventListener('click',function(e){e.preventDefault();l.scrollIntoView({behavior:'smooth',block:'start'})});
        li.appendChild(a);ul.appendChild(li);
      });
      ol.parentNode.appendChild(hb);ol.parentNode.appendChild(ul);
    }
  });

  /* Botões de copiar */
  var ICON_COPY='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="4" width="8" height="4" rx="1"/><path d="M16 6h1.5A1.5 1.5 0 0 1 19 7.5v12a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-12A1.5 1.5 0 0 1 6.5 6H8"/></svg>';
  var ICON_OK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var ICON_CODE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></svg>';
  document.querySelectorAll('.code').forEach(function(c){
    var lang=(c.querySelector('.lang')||{}).textContent||'terminal';
    var title={terminal:'Terminal',bash:'Terminal',sh:'Terminal',json:'JSON',yaml:'YAML',dockerfile:'Dockerfile'}[lang.toLowerCase()]||lang;
    var bar=document.createElement('div');bar.className='term-bar';
    bar.innerHTML='<span class="term-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="term-title">'+ICON_CODE+title+'</span>';
    var b=document.createElement('button');b.type='button';b.className='copy';b.innerHTML=ICON_COPY;b.setAttribute('aria-label','Copiar comandos');b.title='Copiar';
    b.addEventListener('click',function(){
      var txt=c.querySelector('code').innerText;
      function ok(){b.innerHTML=ICON_OK;b.classList.add('ok');b.title='Copiado';setTimeout(function(){b.innerHTML=ICON_COPY;b.classList.remove('ok');b.title='Copiar'},1400)}
      function fb(){var r=document.createRange();r.selectNodeContents(c.querySelector('code'));var s=getSelection();s.removeAllRanges();s.addRange(r);b.title='Selecionado — use Ctrl+C'}
      try{navigator.clipboard.writeText(txt).then(ok,fb)}catch(e){fb()}
    });
    bar.appendChild(b);
    c.insertBefore(bar,c.firstChild);
  });

  /* Progresso dos exercícios */
  function refresh(){
    document.querySelectorAll('.panel[data-panel^="aula"]').forEach(function(panel){
      var boxes=panel.querySelectorAll('.done input'); var d=0;
      boxes.forEach(function(x){if(x.checked)d++;});
      var tab=document.querySelector('.tab[data-tab="'+panel.dataset.panel+'"] .prog');
      if(tab){tab.textContent=boxes.length?d+'/'+boxes.length:'';tab.classList.toggle('full',boxes.length&&d===boxes.length);tab.hidden=!boxes.length}
      panel.querySelectorAll('.topico').forEach(function(tp){
        var bx=tp.querySelectorAll('.done input'),all=bx.length>0;bx.forEach(function(x){if(!x.checked)all=false});
        var a=panel.querySelector('.toc a[data-t="'+tp.id+'"]'); if(a) a.classList.toggle('is-done',all);
      });
      panel.querySelectorAll('.toc-ex a[data-ex]').forEach(function(a){var x=document.getElementById(a.dataset.ex);a.classList.toggle('is-done',!!(x&&x.checked));
      });
    });
  }
  document.querySelectorAll('.done input').forEach(function(x){
    x.checked=store.get('ct-'+x.id)==='1';
    x.addEventListener('change',function(){store.set('ct-'+x.id,x.checked?'1':'0');refresh()});
  });
  refresh();

  /* Modo apresentação */
  var pres=document.getElementById('pres'),frame=document.getElementById('presFrame'),deck=[],idx=0,lastFocus=null;
  function buildDeck(panel){
    var d=[],head=panel.querySelector('.aula-head');
    var sub=head.querySelector('.subtitle');
    d.push({cls:'cover',html:'<div class="kicker">'+head.querySelector('.eyebrow').textContent+'</div><h2>'+head.querySelector('h1').innerHTML+'</h2>'+(sub?'<p class="subtitle">'+sub.textContent+'</p>':'')+'<p>'+(head.querySelector('.lead')?head.querySelector('.lead').textContent:'')+'</p>',t:head.querySelector('h1').textContent});
    panel.querySelectorAll('.aula-intro .slide').forEach(function(s){d.push({cls:'',html:'<div class="kicker">Roteiro da aula</div>'+s.outerHTML,t:'Roteiro da aula'})});
    panel.querySelectorAll('.topico').forEach(function(tp){
      var num=tp.querySelector('.topico-num').textContent,tt=tp.querySelector('.topico-head h2').textContent;
      tp.querySelectorAll('.slide').forEach(function(s){d.push({cls:'',html:'<div class="kicker">'+num+' · '+tt+'</div>'+s.outerHTML,t:num+' · '+tt})});
      tp.querySelectorAll('.lab').forEach(function(l){
        var tag=l.querySelector('.lab-tag').textContent, ttl=l.querySelector('.lab-head h3').textContent;
        var goal=l.querySelector('.lab-goal')?l.querySelector('.lab-goal').textContent:'';
        var tm=l.querySelector('.lab-time')?l.querySelector('.lab-time').textContent:'';
        var nsteps=l.querySelectorAll('.steps>li').length;
        d.push({cls:'practice',html:'<div class="hp">Hora de praticar!!!</div>'+
          '<div class="hp-grid"><div class="hp-k">Laboratório</div><div class="hp-v"><b>'+tag+'</b> · '+ttl+'</div>'+
          '<div class="hp-k">Objetivo</div><div class="hp-v hp-goal">'+goal+'</div></div>'+
          '<div class="hp-meta">'+(tm?'<span>⏱ '+tm+'</span>':'')+'<span>'+nsteps+' passos</span><span>GitHub Codespaces</span></div>'+
          '<div class="hp-actions"><button type="button" class="btn" data-goto-lab><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 8h10M9 4l4 4-4 4"/></svg>Ir para o exercício</button></div>',t:tag+' · Hora de praticar',lab:l});
      });
    });
    return d;
  }
  function fit(){
    var el=frame.querySelector('.fit'); if(!el) return;
    function over(){return frame.scrollHeight>frame.clientHeight+1||frame.scrollWidth>frame.clientWidth+1}
    el.style.zoom=1; if(!over()) return;
    var lo=.4,hi=1;
    for(var i=0;i<8;i++){var mid=(lo+hi)/2; el.style.zoom=mid; if(over()) hi=mid; else lo=mid;}
    el.style.zoom=lo;
  }
  window.addEventListener('resize',function(){if(!pres.hidden)fit()});
  document.addEventListener('fullscreenchange',function(){if(!pres.hidden)setTimeout(fit,60)});
  function render(){
    var s=deck[idx]; frame.className='pres-frame '+s.cls; frame.innerHTML='<div class="fit">'+s.html+'</div>'; frame.scrollTop=0; fit();
    document.getElementById('presTitle').textContent=s.t;
    document.getElementById('presCount').textContent=(idx+1)+' / '+deck.length;
    document.getElementById('presBar').style.width=((idx+1)/deck.length*100)+'%';
    var atEnd=idx===deck.length-1;
    var nextBtn=document.getElementById('presNext');
    nextBtn.textContent=atEnd?'Encerrar':'Próximo →';
    nextBtn.classList.toggle('end',atEnd);
  }
  function open(panel){deck=buildDeck(panel);idx=0;lastFocus=document.activeElement;pres.hidden=false;document.body.style.overflow='hidden';render();document.getElementById('presNext').focus()}
  function close(){pres.hidden=true;document.body.style.overflow='';try{if(document.fullscreenElement)document.exitFullscreen()}catch(e){} if(lastFocus)lastFocus.focus()}
  function go(n){idx=Math.max(0,Math.min(deck.length-1,idx+n));render()}
  function resumeToLab(l){
    var panel=l.closest('.panel'); if(!panel) return;
    var d=buildDeck(panel),i=0;
    d.forEach(function(s,ix){if(s.lab===l)i=ix});
    deck=d;idx=i;lastFocus=document.activeElement;pres.hidden=false;document.body.style.overflow='hidden';render();document.getElementById('presNext').focus();
  }
  function flashScrollTo(el){el.scrollIntoView({behavior:'smooth',block:'start'});el.classList.add('flash');setTimeout(function(){el.classList.remove('flash')},1600)}
  frame.addEventListener('click',function(e){
    var b=e.target.closest('[data-goto-lab]'); if(!b) return;
    var s=deck[idx]; if(!s||!s.lab) return;
    close(); flashScrollTo(s.lab);
  });
  document.querySelectorAll('.lab').forEach(function(l){
    var doneLabel=l.querySelector('.done'); if(!doneLabel) return;
    var btn=document.createElement('button');
    btn.type='button'; btn.className='btn lab-back';
    btn.innerHTML='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M13 8H3M7 4L3 8l4 4"/></svg>Voltar ao slide';
    btn.addEventListener('click',function(){resumeToLab(l)});
    doneLabel.insertAdjacentElement('afterend',btn);
  });
  presentBtn.addEventListener('click',function(){open(document.querySelector('.panel[data-panel^="aula"]:not([hidden])'))});

  /* Diagrama animado: Swarm routing mesh */
  var swarmNext=0;
  function swarmCenter(el,wrap){var r=el.getBoundingClientRect(),wr=wrap.getBoundingClientRect();return{x:r.left-wr.left+r.width/2,y:r.top-wr.top+r.height/2}}
  function swarmWait(ms){return new Promise(function(res){setTimeout(res,ms)})}
  document.addEventListener('click',function(e){
    var btn=e.target.closest('[data-swarm-play]'); if(!btn||btn.disabled) return;
    var scope=btn.closest('.slide')||document; var wrap=scope.querySelector('[data-swarm-flow]'); if(!wrap) return;
    var dot=wrap.querySelector('[data-swarm-dot]');
    var client=wrap.querySelector('[data-node="client"]'), mesh=wrap.querySelector('[data-node="mesh"]');
    var workers=['w0','w1','w2'].map(function(n){return wrap.querySelector('[data-node="'+n+'"]')});
    function place(pt){dot.style.left=pt.x+'px';dot.style.top=pt.y+'px'}
    btn.disabled=true;
    var target=workers[swarmNext]; swarmNext=(swarmNext+1)%workers.length;
    dot.style.transition='none'; dot.hidden=false; place(swarmCenter(client,wrap));
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        dot.style.transition='top .55s ease,left .55s ease';
        place(swarmCenter(mesh,wrap));
      });
    });
    swarmWait(600).then(function(){place(swarmCenter(target,wrap));return swarmWait(600)})
      .then(function(){target.classList.add('hit');return swarmWait(500)})
      .then(function(){target.classList.remove('hit');dot.hidden=true;btn.disabled=false});
  });

  /* Diagrama animado: eleição Raft disparada pela queda do líder */
  var raftLeader=0;
  document.addEventListener('click',function(e){
    var btn=e.target.closest('[data-raft-play]'); if(!btn||btn.disabled) return;
    var scope=btn.closest('.slide')||document; var wrap=scope.querySelector('[data-swarm-flow]'); if(!wrap) return;
    var dot=wrap.querySelector('[data-raft-dot]');
    var mgrs=['m0','m1','m2'].map(function(n){return wrap.querySelector('[data-node="'+n+'"]')});
    function place(pt){dot.style.left=pt.x+'px';dot.style.top=pt.y+'px'}
    function setState(i,cls,label){mgrs[i].className='cpd-svc'+(cls?' '+cls:'');mgrs[i].querySelector('.st').textContent='raft: '+label}
    btn.disabled=true;
    var down=raftLeader, cand=(raftLeader+1)%3, elector=[0,1,2].filter(function(i){return i!==down&&i!==cand})[0];
    setState(down,'down','caiu ✗ (sem heartbeat)');
    swarmWait(700).then(function(){
      setState(cand,'cand','candidato (timeout)');
      dot.style.transition='none'; dot.hidden=false; place(swarmCenter(mgrs[cand],wrap));
      return swarmWait(250);
    }).then(function(){
      requestAnimationFrame(function(){dot.style.transition='top .5s ease,left .5s ease';place(swarmCenter(mgrs[elector],wrap))});
      return swarmWait(550);
    }).then(function(){
      mgrs[elector].querySelector('.st').textContent='raft: voto ✓';
      return swarmWait(350);
    }).then(function(){
      dot.style.transition='top .5s ease,left .5s ease'; place(swarmCenter(mgrs[cand],wrap));
      return swarmWait(550);
    }).then(function(){
      dot.hidden=true;
      raftLeader=cand;
      setState(cand,'hl','líder (maioria: 2 de 3)');
      setState(elector,'','seguidor');
      return swarmWait(900);
    }).then(function(){
      setState(down,'','seguidor (voltou)');
      btn.disabled=false;
    });
  });
  document.getElementById('presNext').addEventListener('click',function(){idx===deck.length-1?close():go(1)});
  document.getElementById('presPrev').addEventListener('click',function(){go(-1)});
  document.getElementById('presClose').addEventListener('click',close);
  document.getElementById('presFs').addEventListener('click',function(){try{var p=document.fullscreenElement?document.exitFullscreen():pres.requestFullscreen();if(p&&p.catch)p.catch(function(){})}catch(e){}});
  document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[data-jump]');if(!a)return;var t=document.getElementById(a.dataset.jump);if(!t)return;e.preventDefault();if(!pres.hidden)close();var ref=document.getElementById('ref-semver');(ref||t).scrollIntoView({behavior:'smooth',block:'center'});if(ref){ref.classList.add('flash');setTimeout(function(){ref.classList.remove('flash')},1600)}});
  document.addEventListener('keydown',function(e){
    if(pres.hidden) return;
    if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '){e.preventDefault();go(1)}
    else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();go(-1)}
    else if(e.key==='Home'){idx=0;render()} else if(e.key==='End'){idx=deck.length-1;render()}
    else if(e.key==='Escape'){close()}
  });
  // menu lateral recolhível
  (function(){
    var KEY='ct-toc-min', body=document.body;
    function get(){try{return localStorage.getItem(KEY)==='1'}catch(e){return false}}
    function set(v){try{localStorage.setItem(KEY,v?'1':'0')}catch(e){}}
    var icon='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 3.5 5 8l4.5 4.5M13 3.5 8.5 8l4.5 4.5" opacity=".55"/><path d="M9.5 3.5 5 8l4.5 4.5"/></svg>';
    var btns=[];
    function apply(min){
      body.classList.toggle('toc-min',min);
      btns.forEach(function(b){b.setAttribute('aria-expanded',String(!min));b.title=min?'Expandir menu':'Recolher menu';b.setAttribute('aria-label',b.title)});
    }
    document.querySelectorAll('.toc').forEach(function(nav){
      var b=document.createElement('button'); b.type='button'; b.className='toc-toggle';
      b.innerHTML=icon+'<span>Recolher menu</span>';
      b.addEventListener('click',function(){var m=!body.classList.contains('toc-min');apply(m);set(m)});
      nav.insertBefore(b,nav.firstChild); btns.push(b);
    });
    apply(get());
  })();
}
})();
