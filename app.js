/* NBFC Guru · app shell (no framework).
   Data: data/latest.json (schema v1, docs/DATA_FORMAT.md) when NBFC Guru publishes it,
   otherwise the legacy data.js (window.BRIEFING) written by publish.py today.
   Hard rules kept here: every figure shows its source; missing figures are shown as missing and
   never carried over from another day; Muthoot Finance (listed peer) is never shown as MFL. */
(function(){'use strict';
var APP=document.getElementById('app');
var RM=window.matchMedia('(prefers-reduced-motion: reduce)');
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function domain(u){try{return new URL(u).hostname.replace(/^www\./,'');}catch(e){return u;}}
function shortUrl(u){try{var x=new URL(u),p=x.pathname.replace(/\/$/,'');var seg=p.split('/').filter(Boolean).pop()||'';
  seg=seg.replace(/\.(cms|html?|ece|aspx|pdf)$/,'').replace(/[-_]+/g,' ');if(seg.length>40)seg=seg.slice(0,38).replace(/\s+\S*$/,'')+'…';
  return domain(u)+(seg?' · '+seg:'');}catch(e){return u;}}
var URL_RE=/https?:\/\/[^\s<>()\[\]]+/g;
function trimUrl(u){return u.replace(/[.,;:*_]+$/,'');}
/* inline markdown: md links, then bare URLs become short clickable links */
function inlineMd(s){
  var keep=[];
  s=String(s).replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,function(_,t,u){keep.push('<a href="'+esc(u)+'" target="_blank" rel="noreferrer">'+esc(t)+'</a>');return '\u0000'+(keep.length-1)+'\u0000';});
  s=s.replace(URL_RE,function(u){var t=trimUrl(u),rest=u.slice(t.length);
    keep.push('<a class="raw" href="'+esc(t)+'" target="_blank" rel="noreferrer">'+esc(shortUrl(t))+'</a>'+esc(rest));return '\u0000'+(keep.length-1)+'\u0000';});
  s=esc(s).replace(/`([^`]+)`/g,'$1')
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
    .replace(/(^|[^\w*])\*([^*\n]+)\*/g,'$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g,function(_,i){return keep[+i];});
}
function stripMd(s){return String(s).replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/[*_`#>]/g,'').replace(/\s+/g,' ').trim();}
function noCites(s){return String(s).replace(/\s*\((?:\s*\[[^\]]+\]\([^)]+\)\s*,?)+\)/g,'');}
function clip(s,n){s=String(s).trim();if(s.length<=n)return s;var c=s.slice(0,n),st=Math.max(c.lastIndexOf('. '),c.lastIndexOf('? '),c.lastIndexOf('! '));
  if(st>=n*.55)return c.slice(0,st+1);var sp=c.lastIndexOf(' ');return (sp>0?c.slice(0,sp):c).replace(/[\s,;:—-]+$/,'')+'…';}
function firstSentence(s){var m=String(s).match(/^(.+?[.?!])(\s|$)/);return m?m[1]:s;}
function cleanHead(s){return stripMd(s).replace(/^[^A-Za-z0-9₹]+/,'').trim();}
function slug(s){return cleanHead(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);}
/* source list: every URL with its label, split on " · " */
function sourceList(lines){
  var items=[],seen={};
  lines.join('\n').split(/\n|\s·\s/).forEach(function(piece){
    piece=piece.trim().replace(/^[-*]\s+|^\d+\.\s+/,'');if(!piece)return;
    var md,re=/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,any=false;
    while((md=re.exec(piece))){any=true;add(md[1],md[2]);}
    if(any)return;
    var urls=piece.match(URL_RE)||[];
    urls.forEach(function(u){var lab=piece.split(u)[0].replace(/[:\s—–-]+$/,'').trim();add(lab,trimUrl(u));});
  });
  function add(l,u){if(seen[u])return;seen[u]=1;items.push({l:stripMd(l)||shortUrl(u),u:u});}
  return items;
}
/* markdown -> html. The Key numbers block and the Source Links list are not repeated in the
   body: both live in the side rail (cards #kn-card and #src-card), and "On this page" points there. */
/* long reports: each h2 section skips layout/paint while off-screen (content-visibility), so opening Read stays a short task */
function chunk(html){var parts=html.split(/(?=<h2 )/);return parts.map(function(x,i){return i?'<section class="mds">'+x+'</section>':x;}).join('');}
function markdown(src,toc,srcOut){
  var lines=src.split(/\r?\n/),out=[],i=0,pre=true;
  while(i<lines.length){
    var line=lines[i].trim();
    if(!line){i++;continue;}
    var h=line.match(/^(#{1,3})\s+(.+)/);
    if(h){var lvl=h[1].length;
      if(lvl===1&&pre){i++;continue;}
      pre=false;
      if(lvl===2&&/key numbers/i.test(h[2])){i++;
        while(i<lines.length&&!/^##\s/.test(lines[i].trim()))i++;
        if(toc)toc.push({id:'kn-card',t:'Key numbers'});continue;}
      if(lvl===2&&/source/i.test(h[2])){i++;var blk=[];
        while(i<lines.length&&!/^(#{1,2}\s|---+$)/.test(lines[i].trim())){if(lines[i].trim())blk.push(lines[i]);i++;}
        if(srcOut)srcOut.push.apply(srcOut,blk);
        if(toc)toc.push({id:'src-card',t:'Sources'});continue;}
      var id=slug(h[2]);if(toc&&lvl===2)toc.push({id:id,t:cleanHead(h[2])});
      out.push('<h'+lvl+' id="'+id+'">'+inlineMd(h[2])+'</h'+lvl+'>');i++;
      continue;}
    if(pre&&/^\*[^*].*\*$/.test(line)&&/edition/i.test(line)){i++;continue;}
    if(pre&&/^\*\*Date:\*\*/.test(line)){i++;continue;}
    if(/^---+$/.test(line)){if(!pre)out.push('<hr>');i++;continue;}
    if(line.indexOf('|')===0){
      var rows=[];
      while(i<lines.length&&lines[i].trim().indexOf('|')===0){
        var cells=lines[i].trim().replace(/^\||\|$/g,'').split('|').map(function(x){return x.trim();});
        if(!cells.every(function(x){return /^:?-{2,}:?$/.test(x);}))rows.push(cells);i++;}
      if(rows.length){var hd0=rows[0],nc=hd0.length,body=rows.slice(1),cells=[].concat.apply([],body),
          avg=cells.length?cells.reduce(function(a,x){return a+stripMd(x).length;},0)/cells.length:0,
          mode=nc>3||avg>36?'tstack':'tscroll',lab=hd0.map(function(x){return esc(stripMd(x));});
        out.push('<div class="twrap '+mode+'"><table><thead><tr>'+hd0.map(function(x){return '<th scope="col">'+inlineMd(x)+'</th>';}).join('')+'</tr></thead><tbody>'+
          body.map(function(r){return '<tr>'+r.map(function(x,ci){return '<td data-l="'+(lab[ci]||'')+'">'+inlineMd(x)+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></div>');}
      continue;}
    if(/^[-*]\s+/.test(line)){var items=[];
      while(i<lines.length&&/^[-*]\s+/.test(lines[i].trim())){items.push('<li>'+inlineMd(lines[i].trim().replace(/^[-*]\s+/,''))+'</li>');i++;}
      out.push('<ul>'+items.join('')+'</ul>');continue;}
    if(/^\d+\.\s+/.test(line)){var ol=[];
      while(i<lines.length&&/^\d+\.\s+/.test(lines[i].trim())){ol.push('<li>'+inlineMd(lines[i].trim().replace(/^\d+\.\s+/,''))+'</li>');i++;}
      out.push('<ol>'+ol.join('')+'</ol>');continue;}
    var para=[line];i++;
    while(i<lines.length&&lines[i].trim()&&!/^(#{1,3}\s|---+$|\||[-*]\s+|\d+\.\s+)/.test(lines[i].trim())){para.push(lines[i].trim());i++;}
    out.push('<p>'+inlineMd(para.join(' '))+'</p>');
  }
  return out.join('');
}

/* ---------------- motion (from todo-app ui/motion: Motion.kt + LaunchEntrance.kt) ---------------- */
/* SwiftUI-style spring(response, dampingFraction), unit mass; sampled into a CSS linear() easing. */
function spring(response,damping){
  var w=2*Math.PI/response,z=damping;
  function x(t){if(z<1){var wd=w*Math.sqrt(1-z*z);return 1-Math.exp(-z*w*t)*(Math.cos(wd*t)+z*w/wd*Math.sin(wd*t));}
    return 1-Math.exp(-w*t)*(1+w*t);}
  var T=0;for(var t=0;t<3;t+=0.004){if(Math.abs(1-x(t))>0.01)T=t;}T+=0.004;
  var n=48,pts=[];for(var i=0;i<=n;i++)pts.push(+x(T*i/n).toFixed(4));pts[n]=1;
  var ok=window.CSS&&CSS.supports&&CSS.supports('transition-timing-function','linear(0, 1)');
  return {ms:Math.round(T*1000),easing:ok?'linear('+pts.join(',')+')':'cubic-bezier(.2,.9,.3,1.04)'};
}
var SPRINGS={Smooth:spring(.50,1.00),Glide:spring(.40,.86),Snappy:spring(.50,.80),Quick:spring(.30,.86),
  Soft:spring(.80,.90),Pop:spring(.35,.58),Rise:spring(.24,.90)};
var ENTRANCE={TotalMs:450,StaggerMs:32,MaxRows:8,HeaderDropPx:8,RowRisePx:24,BottomRisePx:24,BottomDelayMs:60,ReducedMs:150};
var STANDARD='cubic-bezier(.4,0,.2,1)',FADE_IN=220;
document.documentElement.style.setProperty('--ease-quick',SPRINGS.Quick.easing);
document.documentElement.style.setProperty('--ease-smooth',SPRINGS.Smooth.easing);
document.documentElement.style.setProperty('--ease-glide',SPRINGS.Glide.easing);
/* cascade: header drops 8px, rows rise (24px on launch, 12px on navigation) with a 32 ms stagger
   (max 8 rows), opacity on a tween (never a spring). Reduced motion: one 150 ms fade, no movement. */
function cascade(root,launch){
  if(!root.animate)return;
  if(RM.matches){root.animate([{opacity:0},{opacity:1}],{duration:ENTRANCE.ReducedMs,easing:'ease-in-out'});return;}
  var rows=0,vh=window.innerHeight*1.15;
  var sw=inSwap;
  root.querySelectorAll('[data-st]').forEach(function(el){
    if(sw&&stat(el,sw.keepSeg))return;
    var r=el.getBoundingClientRect();if(r.top>vh)return;
    if(sw){var i2=Math.min(rows++,ENTRANCE.MaxRows-1),d2=i2*ENTRANCE.StaggerMs,dx=sw.dir&&!sw.keepSeg?sw.dir*12:0;
      el.animate([{transform:'translate('+dx+'px,8px)'},{transform:'none'}],{duration:SPRINGS.Rise.ms,delay:d2,easing:SPRINGS.Rise.easing,fill:'backwards'});
      el.animate([{opacity:0},{opacity:1}],{duration:180,delay:d2,easing:'cubic-bezier(0,0,.2,1)',fill:'backwards'});return;}
    var head=el.dataset.st==='h',idx=head?0:Math.min(rows++,ENTRANCE.MaxRows-1);
    var delay=head?0:idx*ENTRANCE.StaggerMs,dist=head?(launch?-ENTRANCE.HeaderDropPx:0):(launch?ENTRANCE.RowRisePx:10);if(!dist)return;
    el.animate([{transform:'translateY('+dist+'px)'},{transform:'none'}],{duration:SPRINGS.Rise.ms+(launch?0:80),delay:delay,easing:SPRINGS.Rise.easing,fill:'backwards'});
    el.animate([{opacity:launch?0:.35},{opacity:1}],{duration:FADE_IN,delay:delay,easing:STANDARD,fill:'backwards'});
  });
}
function riseTabbar(){var t=document.getElementById('tabbar');if(!t.animate)return;
  if(RM.matches){t.animate([{opacity:0},{opacity:1}],{duration:150});return;}
  var base=getComputedStyle(t).transform;base=base==='none'?'':base+' ';
  t.animate([{transform:base+'translateY('+ENTRANCE.BottomRisePx+'px)',opacity:0},{transform:base+'translateY(0)',opacity:1}],
    {duration:SPRINGS.Snappy.ms,delay:ENTRANCE.BottomDelayMs,easing:SPRINGS.Snappy.easing,fill:'backwards'});}

/* ---------------- data layer ---------------- */
var CORE=['sensex','nifty','niftyfin','manappuram','muthoot','iifl','shriram','bajaj','usdinr','gold10g','brent'];
var FULL={sensex:'Sensex',nifty:'Nifty 50',niftyfin:'Nifty Financial Services',manappuram:'Manappuram Finance',muthoot:'Muthoot Finance',
  iifl:'IIFL Finance',shriram:'Shriram Finance',bajaj:'Bajaj Finance',usdinr:'USD/INR',gold10g:'Gold (₹/10g)',brent:'Brent ($/bbl)',
  goldspot:'Gold spot ($/oz)',fii:'FII net (₹ cr)',dii:'DII net (₹ cr)'};
var SHORT={sensex:'Sensex',nifty:'Nifty 50',niftyfin:'Nifty Fin Services',manappuram:'Manappuram',muthoot:'Muthoot Finance',
  iifl:'IIFL Finance',shriram:'Shriram Finance',bajaj:'Bajaj Finance',usdinr:'USD/INR',gold10g:'MCX Gold /10g',brent:'Brent',
  goldspot:'Spot gold',fii:'FII net',dii:'DII net'};
var GROUP={sensex:'index',nifty:'index',niftyfin:'index',manappuram:'peer',muthoot:'peer',iifl:'peer',shriram:'peer',bajaj:'peer',
  usdinr:'macro',gold10g:'macro',brent:'macro',goldspot:'macro',fii:'flows',dii:'flows'};
var MARKET_ORDER=['nifty','sensex','niftyfin','gold10g','goldspot','brent','usdinr'];
var PEER_ORDER=['muthoot','manappuram','iifl','shriram','bajaj'];
var JOBS={'01-daily-watch':{tab:'News',name:'News desk',when:'7:00 AM'},'02-regulation':{tab:'Rules',name:'Rules desk',when:'7:00 AM'},
  '03-weekly-analysis':{tab:'Weekly',name:'Weekly analysis',when:'7:15 AM Mondays'}};

var M={source:null,generated:null,days:[],byId:{},series:{}};
function num(v){if(v==null)return null;var s=String(v).replace(/[−–]/g,'-').replace(/,/g,'');var m=s.match(/[-+]?\d+(?:\.\d+)?/);return m?parseFloat(m[0]):null;}
/* value_num (number|null) from NBFC Guru wins, even when null (= ambiguous, never guessed); else parse value */
function numOf(it){if(it&&Object.prototype.hasOwnProperty.call(it,'value_num'))return typeof it.value_num==='number'&&isFinite(it.value_num)?it.value_num:null;return num(it&&it.value);}
function buildSeries(days){ /* oldest -> newest; a day without the figure is a gap (null), never carried forward */
  var s={},asc=days.slice().sort(function(a,b){return a.id<b.id?-1:1;});
  Object.keys(FULL).forEach(function(k){s[k]=[];});
  asc.forEach(function(d){var have={};((d.key_numbers||{}).items||[]).forEach(function(it){have[it.key]=it;});
    Object.keys(s).forEach(function(k){s[k].push({d:d.id,v:have[k]?numOf(have[k]):null});});});
  return s;}
function index(days){M.days=days.slice().sort(function(a,b){return a.id<b.id?1:-1;});M.byId={};M.days.forEach(function(d){M.byId[d.id]=d;});}
function fromLegacy(B){
  if(!B||!B.days)throw new Error('data.js has no days');
  M.source='data.js';M.generated=B.generated;index(B.days);M.series=buildSeries(B.days);}
function fromJson(j){
  M.source='data/latest.json';M.generated=j.generated;
  var days=(j.days||[]).map(function(d){return d.id===j.today.id?j.today:Object.assign({stub:true},d);});
  if(!days.some(function(d){return d.id===j.today.id;}))days.push(j.today);
  index(days);
  M.series={};var ser=j.series||{};Object.keys(ser).forEach(function(k){
    M.series[k]=Object.keys(ser[k]).sort().map(function(d){return {d:d,v:ser[k][d]};});});}
function loadScript(src){return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
/* data.js stays the source of truth. data/latest.json (~19 KB compressed vs ~1.1 MB) is used only when
   it was built in the same publish run as data.js (same "generated"), read from data.js's first bytes.
   So a missing or stale data/ folder can never show an old edition. ?src=json / ?src=legacy force one. */
function headGenerated(){
  return fetch('/data.js?probe='+Date.now(),{headers:{Range:'bytes=0-255'},cache:'no-store'}).then(function(r){
    if(!r.ok||!r.body)throw 0;var rd=r.body.getReader();
    return rd.read().then(function(c){rd.cancel().catch(function(){});return new TextDecoder().decode(c.value||new Uint8Array()).slice(0,400);});})
  .then(function(t){var g=t.match(/"generated":\s*"([^"]+)"/);return g?g[1]:null;});}
function legacy(){return loadScript('/data.js').then(function(){fromLegacy(window.BRIEFING);});}
function loadData(){
  var q=location.search;if(/[?&]src=legacy/.test(q))return legacy();
  var force=/[?&]src=json/.test(q);
  var js=fetch('/data/latest.json',{cache:'no-cache'}).then(function(r){if(!r.ok)throw 0;return r.json();});
  var gen=force?Promise.resolve(null):headGenerated().catch(function(){return null;});
  return Promise.all([js,gen]).then(function(v){var j=v[0],g=v[1];
    if(!j||j.schema_version!==1||!j.today)throw 0;
    if(!force&&(!g||j.generated<g))throw 0; /* stale or unverifiable: use data.js */
    fromJson(j);}).catch(function(){return legacy();});}
function getDay(id){var d=M.byId[id];if(!d)return Promise.resolve(null);if(!d.stub)return Promise.resolve(d);
  return fetch('/data/'+id+'.json').then(function(r){if(!r.ok)throw 0;return r.json();}).then(function(full){
    M.byId[id]=full;M.days[M.days.indexOf(d)]=full;return full;}).catch(function(){return d;});}

/* ---------------- helpers ---------------- */
function $(s,r){return (r||document).querySelector(s);}
function news(day){return rep(day,'01-daily-watch');}
function rules(day){return rep(day,'02-regulation');}
function rep(day,key){return (day.reports||[]).filter(function(r){return r.key===key;})[0];}
function ok(r){return r&&!r.missing&&r.content!==undefined;}
/* the IST calendar day; desks still missing on it are "not filed yet", on older days they "did not arrive" (?today= for tests) */
function todayIST(){var q=location.search.match(/[?&]today=(\d{4}-\d{2}-\d{2})/);return q?q[1]:new Date(Date.now()+19800000).toISOString().slice(0,10);}
function live(day){return day&&day.id===todayIST();}
function missState(day,r){var j=JOBS[r.key]||{when:r.when||''};
  if(!r.expected)return {t:'Not due today',s:'Not due today \u00b7 '+j.when,x:'This job only files on Mondays.',c:'nd'};
  if(live(day))return {t:'Not filed yet',s:'Not filed yet \u00b7 due '+j.when,x:'The '+j.when+' job has not filed yet today. This page updates when it does.',c:'wait'};
  return {t:'Did not arrive',s:'Did not arrive \u00b7 due '+j.when,x:'The '+j.when+' job did not leave a file.',c:'miss'};}
function filedN(day){return (day.reports||[]).filter(function(r){return !r.missing;}).length;}
function dueN(day){return (day.reports||[]).filter(function(r){return r.expected;}).length;}
function kn(day){return day.key_numbers||{items:[],watchlist:[],core_total:11,core_found:0};}
function item(day,k){return kn(day).items.filter(function(i){return i.key===k;})[0];}
var MONS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],DOWS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function dt(id){return new Date(id+'T00:00:00');}
function shortDay(id){var d=dt(id);return DOWS[d.getDay()]+' '+d.getDate()+' '+MONS[d.getMonth()];}
function dm(id){var d=dt(id);return d.getDate()+' '+MONS[d.getMonth()];}
function srcA(s){if(!s||!s.url)return '<span>source not linked in report</span>';
  return '<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.label||domain(s.url))+'<span class="sr"> (opens in new tab)</span></a>';}
function itemSrc(it){return it.sources&&it.sources.length?it.sources.map(srcA).join(', '):srcA(it.source);}
function itemWhen(it,dayId){var p=[it.asof?(it.asof===dayId?'today':dm(it.asof)):'as-of not stated'];if(it.basis)p.push(esc(it.basis));return p.join(' · ');}
function itemMeta(it,dayId){var p=[];p.push(it.asof?(it.asof===dayId?'today':dm(it.asof)):'as-of not stated');if(it.basis)p.push(esc(it.basis));p.push(it.sources&&it.sources.length?it.sources.map(srcA).join(', '):srcA(it.source));return p.join(' · ');}
function dirOf(it){if(it.dir==='up'||it.dir==='down')return it.dir==='up'?'up':'dn';
  if(GROUP[it.key]==='flows'){var n=num(it.value);return n==null?'':n<0?'dn':'up';}return '';}
function chg(it){var c=it.change;if(!c||/^[—–-]$/.test(String(c).trim()))return '<span class="chip flat">no change given</span>';
  var d=dirOf(it);return '<span class="chip '+(d||'flat')+'">'+esc(c)+'</span>';}
function mins(w){return Math.max(1,Math.round((w||0)/220));}
function wordsOf(r){return r.words||stripMd(r.content||'').split(/\s+/).filter(Boolean).length;}

/* sparkline: inline SVG, gaps where a day had no figure */
function spark(k,uptoId,w,h,dir){
  var pts=(M.series[k]||[]).filter(function(p){return p.d<=uptoId;}).slice(-14);
  var vals=pts.map(function(p){return p.v;}).filter(function(v){return v!=null;});
  if(vals.length<2)return '<svg width="'+w+'" height="'+h+'" aria-hidden="true"></svg>';
  var lo=Math.min.apply(0,vals),hi=Math.max.apply(0,vals),rg=hi-lo||1,n=pts.length,pad=3;
  var X=function(i){return pad+(w-2*pad)*i/(n-1);},Y=function(v){return pad+(h-2*pad)*(1-(v-lo)/rg);};
  var segs=[],cur=[];pts.forEach(function(p,i){if(p.v==null){if(cur.length)segs.push(cur);cur=[];}else cur.push([X(i),Y(p.v)]);});if(cur.length)segs.push(cur);
  var col=dir==='dn'?'var(--dn)':dir==='up'?'var(--up)':'var(--ink3)';
  var path=segs.map(function(s){return 'M'+s.map(function(q){return q[0].toFixed(1)+' '+q[1].toFixed(1);}).join('L');}).join('');
  var last=segs[segs.length-1],lp=last[last.length-1];
  var first=pts.filter(function(p){return p.v!=null;})[0];
  var label='Trend over '+vals.length+' editions from '+dm(first.d)+': low '+lo.toLocaleString('en-IN')+', high '+hi.toLocaleString('en-IN');
  return '<svg width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" role="img" aria-label="'+esc(label)+'"><path d="'+path+'" fill="none" stroke="'+col+'" stroke-width="1.7" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/><circle cx="'+lp[0].toFixed(1)+'" cy="'+lp[1].toFixed(1)+'" r="2.4" fill="'+col+'"/></svg>';}

/* top stories: structured day.stories[] if NBFC Guru sends them, else parsed from the URGENT block */
function stories(day){
  if(day.stories&&day.stories.length)return day.stories.map(function(s){return {h:s.title,rest:s.dek||'',why:s.why||'',tag:s.tag||'',sentiment:s.sentiment||'',src:(s.sources||[]).map(function(x){return {l:x.label,u:x.url};})};});
  var r=news(day);if(!ok(r))return [];
  var m=r.content.match(/##\s+🔴[^\n]*\n([\s\S]*?)(?=\n##\s|$)/),scope=m?m[1]:'',out=[],re=/\*\*(\d+)\.\s*([^*]+?)\*\*\s*([\s\S]*?)(?=\n\*\*\d+\.|\n##\s|$)/g,x;
  while((x=re.exec(scope))&&out.length<5){
    var title=stripMd(x[2]),head=firstSentence(title),rest=title.slice(head.length).trim(),body=x[3];
    var bl=body.split('\n').map(function(l){return l.trim();}).filter(function(l){return /^[-*]\s+/.test(l);}).map(function(l){return l.replace(/^[-*]\s+/,'');});
    var why=bl.filter(function(l){return /why it matters/i.test(l);})[0]||'';
    var fact=bl.filter(function(l){return !/why it matters/i.test(l);})[0]||'';
    var src=[],mr=/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,y;while((y=mr.exec(body))){if(!src.some(function(s){return s.u===y[2];}))src.push({l:y[1],u:y[2]});}
    out.push({h:head,rest:rest||clip(stripMd(noCites(fact)),220),why:clip(stripMd(noCites(why)).replace(/^why it matters[^:]*:\s*/i,''),260),src:src.slice(0,2)});}
  return out;}
var SENT={positive:'up',negative:'dn',watch:'acc',neutral:'flat'};
var SENT_T='Sentiment is from Muthoot Fincorp\u2019s (MFL\u2019s) point of view';
function tags(s){var t='';if(s.sentiment)t+='<span class="chip '+(SENT[s.sentiment]||'flat')+'" title="'+SENT_T+'"><span class="sr">'+SENT_T+': </span>'+esc(s.sentiment)+' for MFL</span>';if(s.tag)t+='<span class="chip flat">'+esc(s.tag)+'</span>';return t;}
function srcLine(src){if(!src||!src.length)return '';return '<p class="by">Source: '+src.map(function(s){return '<a href="'+esc(s.u)+'" target="_blank" rel="noopener noreferrer">'+esc(s.l)+'</a>';}).join(', ')+'</p>';}

function rulesSummary(day){
  var r=rules(day);if(!ok(r))return null;
  var t0=r.content.match(/^##\s+[^\n]*Daily Teaching[^\n]*$/m),teach0=t0?cleanHead(t0[0].replace(/^##\s+/,'')).replace(/^Daily Teaching\s*[—–-]\s*/,''):'';
  if(Array.isArray(day.rules))return {lead:'',rules:day.rules,items:[],teach:teach0,note:day.rules_note||''};
  var c=r.content,sec=c.match(/##\s+[^\n]*New Regulatory Updates[^\n]*\n([\s\S]*?)(?=\n##\s|$)/i),lead='',items=[];
  if(sec){var paras=sec[1].split(/\n\s*\n/).map(function(p){return p.trim();}).filter(function(p){return p&&!/^#|^\||^---/.test(p);});
    lead=paras[0]?clip(stripMd(noCites(paras[0])),280):'';
    (sec[1].match(/^###\s+.+$/gm)||[]).forEach(function(h){items.push(cleanHead(h.replace(/^###\s+/,'')));});}
  var t=c.match(/^##\s+[^\n]*Daily Teaching[^\n]*$/m);var teach=t?cleanHead(t[0].replace(/^##\s+/,'')).replace(/^Daily Teaching\s*[—–-]\s*/,''):'';
  return {lead:lead,items:items.slice(0,4),teach:teach};}

var RTAG={NEW_REG:'New',AMENDMENT:'Amendment',CONSULTATION:'Consultation',CLARIFICATION:'Clarification'};
function mflChip(v){if(v===true)return '<span class="chip up">Applies to MFL</span>';if(v==='unclear')return '<span class="chip flat" title="NBFC Guru could not yet tell whether this applies to Muthoot Fincorp">MFL impact unclear</span>';if(v===false)return '<span class="chip flat">Not for MFL</span>';return '';}
function ruleRow(x){
  var m=[];if(x.issuer)m.push(esc(x.issuer));if(x.ref)m.push('<span class="num">'+esc(x.ref)+'</span>');if(x.date)m.push('dated '+esc(dm(x.date)+' '+x.date.slice(0,4)));
  if(x.effective)m.push('effective '+esc(dm(x.effective)));
  return '<div class="rule"><div class="tagrow">'+(x.tag?'<span class="chip acc">'+esc(RTAG[x.tag]||x.tag)+'</span>':'')+mflChip(x.applies_to_mfl)+'</div>'+
    '<b>'+esc(x.title||'')+'</b><div class="m">'+m.join(' · ')+' · '+(x.url?'<a href="'+esc(x.url)+'" target="_blank" rel="noopener noreferrer">circular<span class="sr"> (opens in new tab)</span></a>':'source not linked')+'</div></div>';}

/* ---------------- theme + install ---------------- */
var ICON={sun:'<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3.6"/><path d="M10 1.8v2M10 16.2v2M1.8 10h2M16.2 10h2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4"/></svg>',
  moon:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16.5 12.2A6.8 6.8 0 0 1 7.8 3.5a6.8 6.8 0 1 0 8.7 8.7z"/></svg>',
  auto:'<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="M10 3a7 7 0 0 1 0 14z" fill="currentColor"/></svg>',
  dl:'<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v10M6 9l4 4 4-4M4 16h12"/></svg>',
  play:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z"/></svg>',
  stop:'<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="3.5" width="9" height="9" rx="1.5"/></svg>'};
function theme(){return document.documentElement.dataset.theme||'auto';}
var TNM={auto:'Auto (follows system)',light:'Light',dark:'Dark'},TNEXT={auto:'light',light:'dark',dark:'auto'};
function themeLabel(){var t=theme();return 'Theme: '+TNM[t]+'. Switch to '+TNM[TNEXT[t]];}
function themeIcon(){var t=theme();return ICON[t==='auto'?'auto':t==='light'?'sun':'moon'];}
function themeBtn(){return '<button class="ic gl press" id="themeBtn" type="button" aria-label="'+themeLabel()+'">'+themeIcon()+'</button>';}
function syncCbTheme(){var b=document.getElementById('cbTheme');if(b){b.innerHTML=themeIcon();b.setAttribute('aria-label',themeLabel());}}
function setTheme(t,quiet){document.documentElement.dataset.theme=t;try{t==='auto'?localStorage.removeItem('nbfc-theme'):localStorage.setItem('nbfc-theme',t);}catch(e){}
  var dark=t==='dark'||(t==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelectorAll('meta[name=theme-color]').forEach(function(m){m.content=dark?'#070a14':'#eef0f7';});
  var b=$('#themeBtn');if(b)b.outerHTML=themeBtn();syncCbTheme();if(!quiet)toast('Theme: '+t);}
/* theme change: circular reveal from the toggle (todo-app ThemeReveal easing cubic-bezier(.2,0,0,1));
   without View Transitions a 250 ms colour crossfade; reduced motion: instant */
function themeReveal(btn,t){var de=document.documentElement;
  if(RM.matches){setTheme(t);return;}
  if(!document.startViewTransition){de.classList.add('tfade');setTheme(t);setTimeout(function(){de.classList.remove('tfade');},300);return;}
  var r=btn.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,R=Math.hypot(Math.max(cx,innerWidth-cx),Math.max(cy,innerHeight-cy));
  de.dataset.vt='theme';
  var vt=document.startViewTransition(function(){setTheme(t,true);});
  vt.ready.then(function(){de.animate({clipPath:['circle(0px at '+cx+'px '+cy+'px)','circle('+Math.ceil(R)+'px at '+cx+'px '+cy+'px)']},
    {duration:340,easing:'cubic-bezier(.2,0,0,1)',pseudoElement:'::view-transition-new(root)'});}).catch(function(){});
  vt.finished.finally(function(){delete de.dataset.vt;var b=btn.id==='cbTheme'?btn:$('#themeBtn');if(b)b.focus({preventScroll:true});});}
var installEvt=null;
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();installEvt=e;var b=$('#installBtn');if(b)b.hidden=false;});
window.addEventListener('appinstalled',function(){installEvt=null;var b=$('#installBtn');if(b)b.hidden=true;toast('Installed');});
var toastT;function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on');},2000);}

/* ---------------- read aloud (podcast-script.txt via the device voice) ---------------- */
var speaking=false;
function toggleAudio(id,btn){
  if(!('speechSynthesis' in window)){toast('Read-aloud is not supported here');return;}
  if(speaking){speechSynthesis.cancel();speaking=false;btn.classList.remove('on');btn.querySelector('.play').innerHTML=ICON.play;btn.setAttribute('aria-pressed','false');return;}
  fetch('/days/'+id+'/podcast-script.txt').then(function(r){if(!r.ok)throw 0;return r.text();}).then(function(txt){
    var parts=txt.split(/\n\s*\n/).map(function(s){return s.trim();}).filter(Boolean);
    var vs=speechSynthesis.getVoices(),v=vs.filter(function(x){return /en[-_]IN/i.test(x.lang);})[0]||vs.filter(function(x){return /^en/i.test(x.lang);})[0];
    speechSynthesis.cancel();speaking=true;btn.classList.add('on');btn.querySelector('.play').innerHTML=ICON.stop;btn.setAttribute('aria-pressed','true');
    parts.forEach(function(p,i){var u=new SpeechSynthesisUtterance(p);if(v)u.voice=v;u.rate=1.02;
      if(i===parts.length-1)u.onend=function(){speaking=false;btn.classList.remove('on');btn.querySelector('.play').innerHTML=ICON.play;btn.setAttribute('aria-pressed','false');};
      speechSynthesis.speak(u);});
  }).catch(function(){toast('Audio script not available offline');});}

/* ---------------- views ---------------- */
var S={day:null,view:'today',key:null};
/* hero header: date eyebrow + controls, optional greeting, big title, status line. On scroll the title
   shrinks/fades (transform+opacity) and the fixed compact bar (#cbar) takes over. */
function greeting(){var h=new Date(Date.now()+19800000).getUTCHours();return h<4?'Hello':h<12?'Good morning':h<17?'Good afternoon':'Good evening';}
function builtIST(){var g=String(M.generated||'').match(/T(\d{2}:\d{2})/);return g?g[1]:'';}
function status(day){var p=[];if(live(day)&&builtIST())p.push('Updated '+builtIST()+' IST');p.push(filedN(day)+'/'+dueN(day)+' desks');return p.join(' \u00b7 ');}
function header(day,title,o){o=o||{};
  return '<header class="hd'+(o.hero?' big':'')+'" data-st="h"><div class="hd-row"><div class="eyebrow">'+(day&&live(day)?'<span class="ldot" aria-hidden="true"></span>':'')+esc(day?day.label:'')+'</div>'+
    '<div class="ctrls"><button class="ic gl press" id="installBtn" type="button" aria-label="Install app"'+(installEvt?'':' hidden')+'>'+ICON.dl+'</button>'+themeBtn()+'</div></div>'+
    (o.greet?'<p class="greet">'+esc(o.greet)+'</p>':'')+'<h1>'+esc(title)+'</h1>'+(o.sub?'<p class="hsub">'+o.sub+'</p>':'')+'</header>';}
function pct(c){var m=String(c||'').match(/\(\s*([+\-\u2212\u2013]?\d[\d.,]*\s*%)\s*\)/);return m?m[1].replace(/\s+/g,''):String(c||'');}
function hasChg(it){return it.change&&!/^[\u2014\u2013-]$/.test(String(it.change).trim());}
var ARW={up:'\u25b2',dn:'\u25bc'};
/* key-numbers ticker: only figures printed in this day's report; a missing item is left out */
var TICK=['nifty','sensex','niftyfin','gold10g','goldspot','usdinr','brent','muthoot','manappuram','iifl','shriram','bajaj'];
function ticker(day){
  var its=TICK.map(function(k){var it=item(day,k);return it&&it.value?{k:k,it:it}:null;}).filter(Boolean);if(its.length<3)return '';
  function li(x,dup){var d=dirOf(x.it),c=hasChg(x.it)?pct(x.it.change):'\u2014';
    return '<li><a href="#/'+day.id+'/markets"'+(dup?' tabindex="-1"':'')+'><span class="tn">'+esc(SHORT[x.k])+'</span> <span class="tv num">'+esc(x.it.value)+'</span> <span class="tch num '+(d||'flat')+'">'+(ARW[d]?'<span aria-hidden="true">'+ARW[d]+'</span>':'')+esc(c)+'</span></a></li>';}
  var a=its.map(function(x){return li(x,false);}).join(''),b=its.map(function(x){return li(x,true);}).join('');
  return '<section class="tick" data-st aria-label="Key numbers from this edition\u2019s news report. Each opens Markets with its source."><div class="tk-vp"><div class="tk-track"><ul class="tk-list">'+a+'</ul><ul class="tk-list" aria-hidden="true">'+b+'</ul></div></div></section>';}
function glance(day,st){if(!st.length)return '';
  return '<section class="g card glance" data-st aria-labelledby="h-gl"><h2 id="h-gl" class="kick">'+(live(day)?'Today at a glance':'At a glance \u00b7 '+esc(shortDay(day.id)))+'</h2><ul>'+
    st.slice(0,3).map(function(s){return '<li><a href="#/'+day.id+'/read/01-daily-watch">'+esc(s.h)+'</a>'+(s.src&&s.src[0]?' <span class="gsrc">'+srcA({label:s.src[0].l,url:s.src[0].u})+'</span>':'')+'</li>';}).join('')+'</ul></section>';}
function pills(day,suffix){
  return '<nav class="pills" aria-label="Edition" data-st>'+M.days.slice(0,7).map(function(d){
    return '<a class="pill g press" href="#/'+d.id+(suffix||'')+'"'+(d.id===day.id?' aria-current="true"':'')+'>'+(d.id===M.days[0].id?'Today · ':'')+shortDay(d.id)+'</a>';}).join('')+
    '<a class="pill g press" href="#/archive">All editions</a></nav>';}

function marketsTable(day,keys,cap){
  var rows=keys.map(function(k){var it=item(day,k);if(!it)return '';var d=dirOf(it);
    return '<tr><td><span class="nm">'+esc(SHORT[k]||it.name)+'</span><span class="meta">'+itemWhen(it,day.id)+'</span><span class="meta s">'+itemSrc(it)+'</span></td>'+
      '<td><span class="vc"><span class="v num">'+esc(it.value)+'</span>'+chg(it)+'</span></td><td class="sp">'+spark(k,day.id,72,28,d)+'</td></tr>';}).join('');
  if(!rows)return '';
  return '<table class="tc num"><caption>'+cap+'</caption><thead><tr><th scope="col">Item</th><th scope="col">Value · chg</th><th scope="col" class="sp"><span class="sr">Trend, last </span>14d</th></tr></thead><tbody>'+rows+'</tbody></table>';}
function missingLine(day,keys){var miss=keys.filter(function(k){return CORE.indexOf(k)>=0&&!item(day,k);});
  return miss.length?'<div class="missing"><b>Not in today\u2019s report:</b> '+miss.map(function(k){return esc(FULL[k]);}).join(', ')+'. Shown as missing, never an older number.</div>':'';}
function flowsBlock(day){
  var f=['fii','dii'].map(function(k){var it=item(day,k);
    if(!it)return '<div><small>'+esc(SHORT[k])+' (₹ cr)</small><b class="num" style="color:var(--ink3)">—</b><div class="meta">Not in today\u2019s report</div></div>';
    var d=dirOf(it);return '<div><small>'+esc(SHORT[k])+' (₹ cr)</small><b class="num '+d+'">'+esc(it.value)+'</b><div class="meta">'+itemWhen(it,day.id)+'</div><div class="meta">'+itemSrc(it)+'</div>'+spark(k,day.id,140,32,d)+'</div>';}).join('');
  return '<section aria-labelledby="h-flows"><div class="sec" data-st><h2 id="h-flows">Fund flows</h2><span class="aside">provisional, cash market</span></div><div class="g flush flows" data-st>'+f+'</div></section>';}
function watchlist(day){var w=kn(day).watchlist||[];if(!w.length)return '';
  return '<section aria-labelledby="h-wl"><div class="sec" data-st><h2 id="h-wl">Watchlist · MFL</h2><span class="aside">Muthoot Fincorp</span></div><div class="g flush list wl" data-st>'+
    w.map(function(x){return '<div><div class="k">'+esc(x.name)+'</div><div class="val">'+inlineMd(x.value)+'</div><div class="meta">'+(x.asof_label?'as of '+esc(x.asof_label):'as-of not stated')+'<br>'+srcA(x.source)+'</div></div>';}).join('')+'</div></section>';}

function viewToday(day){
  var st=stories(day),top=st[0],nr=news(day),rr=rules(day),k=kn(day);
  var srcCount=(day.reports||[]).reduce(function(a,r){return a+(r.sources||0);},0);
  var words=(day.reports||[]).filter(ok).reduce(function(a,r){return a+wordsOf(r);},0);
  var latest=day.id===M.days[0].id;
  var h=header(day,latest?'Today\u2019s Brief':shortDay(day.id),{hero:true,greet:latest&&live(day)?greeting()+', Achu':latest?'Latest edition':'Edition of '+day.weekday,
    sub:'<span class="st-dot '+(filedN(day)>=dueN(day)?'ok':live(day)?'wait':'miss')+'" aria-hidden="true"></span>'+esc(status(day))+(day.podcast?' \u00b7 audio script':'')})+pills(day,'');
  var main='',side='';
  h+=ticker(day)+glance(day,st);
  if(day.podcast)main+='<div data-st><button type="button" class="audio g press" id="audioBtn" aria-pressed="false"><span class="play">'+ICON.play+'</span><span><b>Morning audio brief</b><span>Read aloud on this phone · '+filedN(day)+' of '+dueN(day)+' desks filed</span></span><span class="wave" aria-hidden="true">'+[8,14,10,18,12,20,9,15,11,7,13].map(function(x){return '<s style="height:'+x+'px"></s>';}).join('')+'</span></button></div>';
  else if(live(day))main+='<div data-st><div class="audio g off" role="note"><span class="play">'+ICON.play+'</span><span><b>Morning audio brief</b><span>Audio script not filed yet today</span></span></div></div>';
  if(top){main+='<article class="g card hero" data-st aria-labelledby="h-top"><div class="tagrow"><span class="kick">Top story · News desk</span>'+tags(top)+'</div><h2 id="h-top">'+esc(top.h)+'</h2>'+(top.rest?'<p>'+esc(top.rest)+'</p>':'')+
    (top.why?'<p class="why"><b>Why it matters for MFL:</b> '+esc(top.why)+'</p>':'')+srcLine(top.src).replace('class="by"','class="by" style="margin-top:12px;font-size:13px;color:var(--ink3)"')+
    '<div class="kpis num" role="list"><div role="listitem"><small>Desks</small><b>'+filedN(day)+'/'+dueN(day)+'</b></div><div role="listitem"><small>Read</small><b>'+mins(words)+'m</b></div><div role="listitem"><small>Sources</small><b>'+srcCount+'</b></div><div role="listitem"><small>Key nos</small><b>'+(k.core_found||0)+'/'+(k.core_total||11)+'</b></div></div>'+
    '<a class="cta press" href="#/'+day.id+'/read/01-daily-watch">Read the news desk <span aria-hidden="true">→</span></a></article>';}
  else main+=live(day)&&nr&&nr.missing?'<div class="g card empty" data-st><h2>The news desk has not filed yet</h2><p>The 7:00 AM job has not filed for '+esc(day.label)+' yet. This page offers a refresh when it does.</p></div>':'<div class="g card empty" data-st><h2>The news desk did not arrive</h2><p>The 7:00 AM job left no file for '+esc(day.label)+'.</p></div>';
  /* markets carousel */
  var tiles=MARKET_ORDER.map(function(k2){var it=item(day,k2);if(!it)return '';var d=dirOf(it);
    return '<a class="tile g press" href="#/'+day.id+'/markets"><div class="n">'+esc(SHORT[k2])+'</div><div class="v num">'+esc(it.value)+'</div>'+chg(it)+spark(k2,day.id,124,34,d)+'<span class="src">'+(it.asof?dm(it.asof):'as-of n/s')+' · '+esc((it.source&&it.source.label)||'no source')+'</span></a>';}).join('');
  main+='<section aria-labelledby="h-mk"><div class="sec" data-st><h2 id="h-mk">Markets</h2><a class="aside" href="#/'+day.id+'/markets">All numbers &amp; sources →</a></div>'+
    (tiles?'<div class="tiles" data-st>'+tiles+'</div>':'<div class="g card" data-st><p>No market figures in today\u2019s report.</p></div>')+'</section>';
  /* peers */
  var pt=marketsTable(day,PEER_ORDER,'NSE close. Muthoot Finance is a separate listed company and a peer, not Muthoot Fincorp (MFL).');
  main+='<section aria-labelledby="h-peers"><div class="sec" data-st><h2 id="h-peers">Gold-loan &amp; NBFC peers</h2><span class="aside">listed peers</span></div><div class="g flush" data-st>'+(pt||'<p class="missing">No peer prices in today\u2019s report.</p>')+missingLine(day,PEER_ORDER)+'</div></section>';
  main+=flowsBlock(day);
  /* more stories */
  if(st.length>1)main+='<section aria-labelledby="h-more"><div class="sec" data-st><h2 id="h-more">Also in the news</h2></div>'+st.slice(1,4).map(function(s,i){
    return '<a class="story g press" data-st href="#/'+day.id+'/read/01-daily-watch"><div class="tagrow"><span class="t">Urgent · '+(i+2)+'</span>'+tags(s)+'</div><h3>'+esc(s.h)+'</h3>'+(s.rest?'<p>'+esc(clip(s.rest,200))+'</p>':'')+(s.src&&s.src.length?'<p class="by" style="font-size:12.5px;color:var(--ink3);margin-top:6px">Source: '+s.src.map(function(x){return esc(x.l);}).join(', ')+'</p>':'')+'</a>';}).join('')+'</section>';
  /* side column */
  side+=watchlist(day);
  var rs=rulesSummary(day);
  side+='<section aria-labelledby="h-rules"><div class="sec" data-st><h2 id="h-rules">Rules desk</h2><span class="aside">RBI · SEBI · IBBI</span></div><div class="g card" data-st>'+
    (rs?((rs.lead?'<p style="color:var(--ink2);font-size:15px">'+esc(rs.lead)+'</p>':'')+(rs.rules?(rs.rules.length?'<div>'+rs.rules.map(ruleRow).join('')+'</div>':'<div class="rule none"><b>No new NBFC circulars today</b>'+(rs.note?'<div class="m">'+esc(rs.note)+'</div>':'')+'</div>')+(rs.rules.length&&rs.note?'<p class="note" style="margin-top:8px">'+esc(rs.note)+'</p>':''):'')+(rs.items.length?'<div style="display:grid;gap:8px;margin-top:12px">'+rs.items.map(function(x){return '<div class="rl">'+esc(x)+'</div>';}).join('')+'</div>':'')+
      (rs.teach?'<p class="why" style="margin-top:14px"><b>Today\u2019s lesson:</b> '+esc(rs.teach)+'</p>':'')+'<a class="cta ghost press" href="#/'+day.id+'/read/02-regulation">Read the rules desk <span aria-hidden="true">→</span></a>')
      :'<p>'+(rr&&rr.expected?(live(day)?'The rules desk has not filed yet today (due '+JOBS['02-regulation'].when+' IST).':'The rules desk did not arrive for this day.'):'No rules report for this day.')+'</p>')+'</div></section>';
  side+='<section aria-labelledby="h-desks"><div class="sec" data-st><h2 id="h-desks">Desks</h2><span class="aside">filed by NBFC Guru</span></div><div class="g flush list" data-st>'+
    (day.reports||[]).map(function(r){var j=JOBS[r.key]||{name:r.kind||r.key,when:r.when||''};var ms=r.missing?missState(day,r):null,cls=ms?ms.c:'';
      var sub=ms?ms.s:mins(wordsOf(r))+' min read · '+(r.sources||0)+' sources · '+j.when;
      return '<a class="desk press '+cls+'" href="#/'+day.id+'/read/'+r.key+'"><span class="dot" aria-hidden="true"></span><span class="bd"><b>'+esc(j.name)+'</b><span>'+esc(sub)+'</span></span><span class="chev" aria-hidden="true">›</span></a>';}).join('')+'</div></section>';
  return h+'<div class="cols"><div>'+main+'</div><div class="side">'+side+'</div></div>'+foot();}

function viewMarkets(day){
  var all=Object.keys(FULL),idx=['nifty','sensex','niftyfin'],mac=['usdinr','gold10g','goldspot','brent'];
  return header(day,'Markets')+pills(day,'/markets')+'<div class="cols"><div>'+
    '<section aria-labelledby="h-ix"><div class="sec" data-st><h2 id="h-ix">Indices</h2><span class="aside">from today\u2019s news report</span></div><div class="g flush" data-st>'+(marketsTable(day,idx,'Each figure links to the source the report used.')||'')+missingLine(day,idx)+'</div></section>'+
    '<section aria-labelledby="h-mc"><div class="sec" data-st><h2 id="h-mc">Currency &amp; commodities</h2></div><div class="g flush" data-st>'+(marketsTable(day,mac,'MCX gold is the morning print; spot gold and Brent as stated in the report.')||'')+missingLine(day,mac)+'</div></section>'+
    '<section aria-labelledby="h-pr"><div class="sec" data-st><h2 id="h-pr">Peers</h2></div><div class="g flush" data-st>'+(marketsTable(day,PEER_ORDER,'Muthoot Finance is a listed peer, not Muthoot Fincorp (MFL).')||'')+missingLine(day,PEER_ORDER)+'</div></section>'+
    '</div><div class="side">'+flowsBlock(day)+watchlist(day)+
    '<p class="note" data-st style="margin-top:14px">Key numbers: '+(kn(day).core_found||0)+' of '+(kn(day).core_total||11)+' core items in this edition. Trends use only figures printed in each day\u2019s own report; a day without a figure is a gap.</p></div></div>'+foot();}

function viewRead(day,key){
  var r=rep(day,key)||(day.reports||[]).filter(ok)[0]||(day.reports||[])[0];if(!r)return header(day,'Read')+'<div class="g card empty"><h2>Nothing filed</h2></div>';
  key=r.key;
  var seg='<nav class="seg g" aria-label="Desk" data-st>'+(day.reports||[]).map(function(x){var j=JOBS[x.key]||{tab:x.section};
    return '<a class="press'+(x.missing?' off':'')+'" href="#/'+day.id+'/read/'+x.key+'"'+(x.key===key?' aria-current="true"':'')+'>'+esc(j.tab)+(x.missing?'<span class="sr"> ('+missState(day,x).t.toLowerCase()+')</span>':'')+'</a>';}).join('')+'</nav>';
  var j=JOBS[key]||{name:r.kind,when:r.when};
  if(r.missing)return header(day,j.tab||'Read')+pills(day,'/read/'+key)+seg+'<div class="g card empty" data-st><h2>'+esc(missState(day,r).t)+'</h2><p>'+esc(missState(day,r).x)+'</p></div>'+foot();
  var toc=[],src=[],body=chunk(markdown(r.content,toc,src)),list=sourceList(src);
  var side='';
  if(key==='01-daily-watch'){
    var items=kn(day).items;
    side+='<section id="kn-card" aria-labelledby="h-kn"><div class="sec"><h2 id="h-kn">Key numbers</h2><span class="aside">'+(kn(day).core_found||0)+'/'+(kn(day).core_total||11)+' core</span></div><div class="g flush">'+
      (items.length?marketsTable(day,items.map(function(i){return i.key;}),'Only figures in this day\u2019s report.'):'<p class="missing">No Key numbers table in this report.</p>')+missingLine(day,CORE)+'</div></section>';}
  if(list.length)side+='<section id="src-card" aria-labelledby="h-src"><div class="sec"><h2 id="h-src">Sources</h2><span class="aside">'+list.length+'</span></div><div class="g srcs">'+
    list.map(function(s){return '<a href="'+esc(s.u)+'" target="_blank" rel="noopener noreferrer">'+esc(s.l)+'<small>'+esc(domain(s.u))+'</small></a>';}).join('')+'</div></section>';
  return header(day,j.tab||'Read')+pills(day,'/read/'+key)+seg+'<div class="cols"><article class="g art" data-st aria-labelledby="h-art"><div class="kick">'+esc(j.name)+' · '+esc(shortDay(day.id))+'</div><h1 id="h-art" style="margin-top:6px">'+esc(r.title)+'</h1>'+
    '<p class="by">NBFC Guru · '+esc(j.when)+' IST · '+mins(wordsOf(r))+' min read · '+(r.sources||0)+' sources</p>'+
    (toc.length?'<nav class="toc" aria-label="On this page">'+toc.map(function(t){return '<a href="#'+t.id+'" data-jump="'+t.id+'">'+esc(t.t)+'</a>';}).join('')+'</nav>':'')+
    '<div class="md">'+body+'</div></article><div class="side">'+side+'</div></div>'+foot();}

/* ---------------- archive: month calendar + library shelf ---------------- */
var ARCH={mo:null,x:null,y:0},MONL=['January','February','March','April','May','June','July','August','September','October','November','December'];
var AV={n:'News',r:'Rules',w:'Weekly',a:'Audio script'};
function avail(d){var a=[];(d.reports||[]).forEach(function(r){if(r.missing)return;var c={'01-daily-watch':'n','02-regulation':'r','03-weekly-analysis':'w'}[r.key];if(c)a.push(c);});if(d.podcast)a.push('a');return a;}
function availTxt(d){var a=avail(d);return a.length?a.map(function(x){return AV[x];}).join(', '):'no desk filed';}
function months(){var s={};M.days.forEach(function(d){s[d.id.slice(0,7)]=1;});return Object.keys(s).sort();} /* oldest first */
function moName(mo){return MONL[+mo.slice(5,7)-1]+' '+mo.slice(0,4);}
function p2(n){return (n<10?'0':'')+n;}
function calGrid(mo){
  var y=+mo.slice(0,4),m=+mo.slice(5,7)-1,n=new Date(y,m+1,0).getDate(),lead=(new Date(y,m,1).getDay()+6)%7,t=todayIST(),cells=[],focus=null;
  for(var i=0;i<lead;i++)cells.push('<td role="gridcell"></td>');
  for(var d=1;d<=n;d++){var id=mo+'-'+p2(d),ed=M.byId[id],lab=DOWS[new Date(y,m,d).getDay()]+' '+d+' '+MONL[m];
    if(ed){focus=id;var a=avail(ed);
      cells.push('<td role="gridcell"><a class="cd ed'+(id===t?' now':'')+'" href="#/'+id+'" data-cal-id="'+id+'" tabindex="-1"><span class="n">'+d+'</span><span class="dots" aria-hidden="true">'+a.map(function(x){return '<i class="d-'+x+'"></i>';}).join('')+'</span><span class="sr"> '+esc(lab)+': '+esc(availTxt(ed))+'</span></a></td>');}
    else cells.push('<td role="gridcell"><span class="cd" tabindex="-1"><span class="n">'+d+'</span><span class="sr"> '+esc(lab)+': no edition</span></span></td>');}
  while(cells.length%7)cells.push('<td role="gridcell"></td>');
  var rows='';for(var r=0;r<cells.length;r+=7)rows+='<tr>'+cells.slice(r,r+7).join('')+'</tr>';
  var html='<thead><tr>'+['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(function(w){return '<th scope="col" abbr="'+w+'"><span aria-hidden="true">'+w[0]+'</span><span class="sr">'+w+'</span></th>';}).join('')+'</tr></thead><tbody>'+rows+'</tbody>';
  /* roving tabindex: the newest edition in the month takes the Tab stop */
  return focus?html.replace('data-cal-id="'+focus+'" tabindex="-1"','data-cal-id="'+focus+'" tabindex="0"'):html.replace('class="cd" tabindex="-1"','class="cd" tabindex="0"');}
function calHtml(mo){var ms=months(),i=ms.indexOf(mo);
  return '<section class="g cal" data-st aria-labelledby="calT"><div class="cal-h"><button type="button" class="ic sm gl press" data-cal="-1" aria-label="Previous month"'+(i<=0?' disabled':'')+'><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5"/></svg></button>'+
    '<h2 id="calT" aria-live="polite">'+esc(moName(mo))+'</h2><button type="button" class="ic sm gl press" data-cal="1" aria-label="Next month"'+(i>=ms.length-1?' disabled':'')+'><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5"/></svg></button></div>'+
    '<div class="cal-vp"><table class="cal-g" role="grid" aria-labelledby="calT">'+calGrid(mo)+'</table></div>'+
    '<ul class="legend" aria-label="Dot colours"><li><i class="d-n"></i>News</li><li><i class="d-r"></i>Rules</li><li><i class="d-w"></i>Weekly</li><li><i class="d-a"></i>Audio script</li></ul></section>';}
var HUES=[214,172,352,28,266,142,198,8,46,322];
function hsh(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h);}
function shelfHtml(){var asc=M.days.slice().reverse(),out='',cur='';
  asc.forEach(function(d){var mo=d.id.slice(0,7),a=avail(d),wk=a.indexOf('w')>=0,h=hsh(d.id),dd=dt(d.id);
    if(mo!==cur){if(cur)out+='</ul></div>';out+='<div class="smo" data-mo="'+mo+'"><h3 class="slbl">'+esc(MONL[+mo.slice(5,7)-1])+'<span> '+mo.slice(0,4)+'</span></h3><ul class="books">';cur=mo;}
    out+='<li class="bk'+(wk?' wk':'')+(a.length?'':' none')+'" style="--hue:'+HUES[h%HUES.length]+';--bh:'+(150+h%22)+'px;--lt:'+(27+h%6)+'%"><a class="sp" href="#/'+d.id+'" data-book="'+d.id+'">'+
      '<span class="sd" aria-hidden="true">'+DOWS[dd.getDay()]+'</span><span class="sn" aria-hidden="true">'+dd.getDate()+' '+MONS[dd.getMonth()]+'</span>'+(wk?'<span class="sw" aria-hidden="true">Weekly</span>':'')+
      '<span class="sdots" aria-hidden="true">'+a.map(function(x){return '<i class="d-'+x+'"></i>';}).join('')+'</span><span class="sr">'+esc(d.label)+': '+esc(availTxt(d))+'</span></a></li>';});
  return '<section class="lib" data-st aria-labelledby="h-lib"><div class="sec"><h2 id="h-lib">Library</h2><span class="aside">'+M.days.length+' editions \u00b7 swipe the shelf</span></div>'+
    '<div class="g shelfbox"><div class="shelf" id="shelf"><div class="srow">'+out+(cur?'</ul></div>':'')+'</div></div></div></section>';}
function viewArchive(){
  var ms=months();if(!ARCH.mo||ms.indexOf(ARCH.mo)<0)ARCH.mo=ms[ms.length-1];
  return header(M.days[0],'Archive',{sub:M.days.length+' editions since '+esc(dm(M.days[M.days.length-1].id))+' '+M.days[M.days.length-1].id.slice(0,4)})+calHtml(ARCH.mo)+shelfHtml()+foot();}
/* month switch: grid slides (transform/opacity), the shelf scrolls to that month */
function calGo(delta){var ms=months(),i=ms.indexOf(ARCH.mo)+delta;if(i<0||i>=ms.length)return;ARCH.mo=ms[i];
  var g=$('.cal-g'),t=$('#calT'),bs=document.querySelectorAll('[data-cal]');if(!g)return;
  t.textContent=moName(ARCH.mo);bs[0].disabled=i<=0;bs[1].disabled=i>=ms.length-1;
  function swap(){g.innerHTML=calGrid(ARCH.mo);if(!RM.matches&&g.animate)g.animate([{transform:'translateX('+(delta*24)+'px)',opacity:0},{transform:'none',opacity:1}],{duration:SPRINGS.Quick.ms,easing:SPRINGS.Quick.easing});}
  if(RM.matches||!g.animate)swap();else g.animate([{transform:'none',opacity:1},{transform:'translateX('+(-delta*24)+'px)',opacity:0}],{duration:110,easing:'cubic-bezier(.4,0,1,1)'}).finished.then(swap,swap);
  shelfTo(ARCH.mo,true);}
function shelfTo(mo,smooth){var sh=$('#shelf'),grp=sh&&sh.querySelector('.smo[data-mo="'+mo+'"]');if(!grp)return;
  sh.scrollTo({left:Math.max(0,grp.offsetLeft-12),behavior:smooth&&!RM.matches?'smooth':'auto'});}
function calKey(e){var c=e.target.closest('.cd');if(!c||!c.closest('.cal-g'))return;
  var all=[].slice.call(document.querySelectorAll('.cal-g .cd')),i=all.indexOf(c),j=i;
  switch(e.key){case 'ArrowLeft':j=i-1;break;case 'ArrowRight':j=i+1;break;case 'ArrowUp':j=i-7;break;case 'ArrowDown':j=i+7;break;
    case 'Home':j=i-(i+((new Date(ARCH.mo+'-01T00:00:00').getDay()+6)%7))%7;break;case 'End':j=Math.min(all.length-1,i+6-(i+((new Date(ARCH.mo+'-01T00:00:00').getDay()+6)%7))%7);break;
    case 'PageUp':e.preventDefault();calGo(-1);return;case 'PageDown':e.preventDefault();calGo(1);return;default:return;}
  e.preventDefault();j=Math.max(0,Math.min(all.length-1,j));all.forEach(function(x){x.tabIndex=-1;});all[j].tabIndex=0;all[j].focus();}
/* JS tilt fallback when CSS scroll-driven animations are missing: rAF, transform only, cached geometry */
var SDA=window.CSS&&CSS.supports&&CSS.supports('animation-timeline','view()');
function shelfTilt(sh){if(SDA||RM.matches)return;var bks=[].slice.call(sh.querySelectorAll('.sp')),geo=bks.map(function(b){var p=b.parentNode;return p.offsetLeft+p.parentNode.parentNode.offsetLeft+p.offsetWidth/2;}),raf=0;
  function upd(){raf=0;var c=sh.scrollLeft+sh.clientWidth/2,w=sh.clientWidth/2;
    bks.forEach(function(b,i){var d=(geo[i]-c)/w;if(d<-1.3||d>1.3)return;d=Math.max(-1,Math.min(1,d));
      b.style.transform='perspective(600px) rotateY('+(-d*32).toFixed(1)+'deg) translateY('+(-(1-Math.abs(d))*5).toFixed(1)+'px) scale('+(0.94+(1-Math.abs(d))*0.1).toFixed(3)+')';});}
  sh.addEventListener('scroll',function(){if(!raf)raf=requestAnimationFrame(upd);},{passive:true});upd();}
function initArchive(){var sh=$('#shelf');if(!sh)return;
  if(ARCH.x!=null)sh.scrollLeft=ARCH.x;else{var nb=sh.querySelector('[data-book="'+M.days[0].id+'"]');nb=nb&&nb.parentNode;if(nb&&ARCH.mo===months().slice(-1)[0])sh.scrollLeft=nb.offsetLeft+nb.offsetWidth/2-sh.clientWidth/2;else shelfTo(ARCH.mo,false);}
  shelfTilt(sh);
  var cal=$('.cal-vp'),x0=null,y0=0;
  cal.addEventListener('touchstart',function(e){var t=e.touches[0];x0=t.clientX;y0=t.clientY;},{passive:true});
  cal.addEventListener('touchend',function(e){if(x0==null)return;var t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;x0=null;
    if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.4)calGo(dx<0?1:-1);},{passive:true});}
/* book open: the spine pulls out, the rest of the page swipes away, the book grows to the page (FLIP, transform/opacity),
   then the day's Today view is written underneath and the book fades off it. ~400 ms. */
var flying=null;
function openBook(a){var id=a.dataset.book,sh=$('#shelf');if(sh){ARCH.x=sh.scrollLeft;ARCH.y=scrollY;}
  if(RM.matches||!a.animate||flying){location.hash='#/'+id;return;}
  var r=a.getBoundingClientRect(),vw=innerWidth,vh=innerHeight,cs=getComputedStyle(a.parentNode);
  var fly=document.createElement('div');fly.className='bookfly';fly.setAttribute('aria-hidden','true');
  fly.style.cssText='--hue:'+cs.getPropertyValue('--hue')+';--lt:'+cs.getPropertyValue('--lt')+';width:'+vw+'px;height:'+vh+'px';fly.innerHTML='<i></i>';document.body.appendChild(fly);
  a.style.visibility='hidden';
  var me=a.parentNode,cx=r.left+r.width/2;
  sh.querySelectorAll('.bk').forEach(function(b){if(b===me)return;var br=b.getBoundingClientRect();if(br.right<-40||br.left>vw+40)return;
    var s=(br.left+br.width/2)<cx?-1:1;b.animate([{transform:'none',opacity:1},{transform:'translateX('+(s*90)+'px) rotate('+(s*4)+'deg)',opacity:0}],{duration:260,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});});
  APP.querySelectorAll('[data-st]:not(.lib),.lib>.sec').forEach(function(el){var er=el.getBoundingClientRect();if(er.bottom<0||er.top>vh)return;
    el.animate([{transform:'none',opacity:1},{transform:'translateY(-14px)',opacity:0}],{duration:220,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});});
  var sx=r.width/vw,sy=r.height/vh,t0='translate('+r.left+'px,'+r.top+'px) scale('+sx+','+sy+')',t1='translate('+r.left+'px,'+(r.top-18)+'px) scale('+sx*1.12+','+sy*1.06+')';
  var an=fly.animate([{transform:t0,offset:0},{transform:t1,offset:.28,easing:'cubic-bezier(.3,0,.2,1)'},{transform:'translate(0,0) scale(1,1)',offset:1}],{duration:420,easing:'cubic-bezier(.2,0,0,1)',fill:'forwards'});
  fly.firstChild.animate([{opacity:0,offset:0},{opacity:0,offset:.45},{opacity:1,offset:1}],{duration:420,fill:'forwards'});
  flying={el:fly,id:id};
  an.finished.then(function(){location.hash='#/'+id;},function(){location.hash='#/'+id;});}
function landBook(){var f=flying;if(!f)return;flying=null;var el=f.el;
  var a=el.animate([{opacity:1},{opacity:0}],{duration:180,easing:'cubic-bezier(0,0,.2,1)',fill:'forwards'});a.finished.then(function(){el.remove();},function(){el.remove();});}
function foot(){var g=M.generated?new Date(M.generated):null;
  return '<footer class="foot">Filed by NBFC Guru, 7:00 AM IST. Every figure links to the source its report used; anything a report did not state is shown as missing. Muthoot Finance appears only as a listed peer, never as MFL.'+
    (g&&!isNaN(g)?'<br>Data built '+g.toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})+' IST':'')+' · source: '+esc(M.source||'')+(navigator.onLine===false?' · offline copy':'')+'</footer>';}

/* ---------------- router ---------------- */
function parse(){
  var h=decodeURIComponent(location.hash.replace(/^#\/?/,'')),p=h.split('/').filter(Boolean),id=M.days[0]&&M.days[0].id;
  if(p[0]==='archive')return {view:'archive',day:id};
  if(p[0]==='latest')p[0]=id;
  if(p[0]&&/^\d{4}-\d{2}-\d{2}$/.test(p[0])){var d=M.byId[p[0]]?p[0]:id;
    if(p[1]==='markets')return {view:'markets',day:d};
    if(p[1]==='read')return {view:'read',day:d,key:p[2]};
    if(p[1]&&JOBS[p[1]])return {view:'read',day:d,key:p[1]}; /* old site links: #YYYY-MM-DD/01-daily-watch */
    return {view:'today',day:d};}
  if(p[0]==='read')return {view:'read',day:S.day||id};
  if(p[0]==='markets')return {view:'markets',day:S.day||id};
  return {view:'today',day:S.day||id};}
var first=true,TABS=['today','read','markets','archive'],KEYS=['01-daily-watch','02-regulation','03-weekly-analysis'];
/* direction: +1 = forward (new view enters from the right). Tabs by bar order, editions newer->older, Read desks by order. */
function dirFor(pv,pd,pk,v,d,k){
  if(pv!==v)return TABS.indexOf(v)>TABS.indexOf(pv)?1:-1;
  if(pd!==d)return d<pd?1:-1;
  if(v==='read'&&pk!==k)return KEYS.indexOf(k)>KEYS.indexOf(pk)?1:-1;
  return 0;}
/* sliding indicator pill: FLIP with transform only, springs (Snappy) between items */
function placeInd(box,act,from){if(!box)return null;var ind=box.querySelector(':scope>.ind');
  if(!ind){ind=document.createElement('span');ind.className='ind';ind.setAttribute('aria-hidden','true');box.insertBefore(ind,box.firstChild);}
  if(!act){ind.style.opacity='0';return null;}
  var x=act.offsetLeft,y=act.offsetTop,w=act.offsetWidth,h=act.offsetHeight;
  ind.style.opacity='1';ind.style.width=w+'px';ind.style.height=h+'px';ind.style.transform='translate('+x+'px,'+y+'px)';
  if(from&&(from.x!==x||from.w!==w)&&!RM.matches&&ind.animate)
    ind.animate([{transform:'translate('+from.x+'px,'+from.y+'px) scaleX('+(from.w/w)+')'},{transform:'translate('+x+'px,'+y+'px)'}],{duration:SPRINGS.Snappy.ms,easing:SPRINGS.Snappy.easing});
  return {x:x,y:y,w:w};}
var tabInd=null,segInd=null;
function syncTabInd(anim){var tb=document.getElementById('tabbar');tabInd=placeInd(tb,tb.querySelector('a[aria-current=page]'),anim?tabInd:null);}
function syncSegInd(from){var seg=$('.seg');segInd=seg?placeInd(seg,seg.querySelector('a[aria-current=true]'),from):null;}
function reInd(){syncTabInd(false);syncSegInd(null);fit();}
/* scrollable tables get a fade edge only when they actually overflow */
/* near=true: only tables on screen now (cheap during a swap); the rest are checked once the entrance has settled */
var fitT;function fit(near){var vh=innerHeight*1.5;document.querySelectorAll('.twrap.tscroll').forEach(function(w){
  if(near===true&&w.getBoundingClientRect().top>vh)return;w.classList.toggle('ov',w.scrollWidth>w.clientWidth+2);});
  if(near===true){clearTimeout(fitT);fitT=setTimeout(fit,450);}}
window.addEventListener('resize',reInd);
/* warm the neighbouring editions so a date switch never waits on the network */
function prefetch(id){var i=M.days.findIndex(function(d){return d.id===id;});
  [i-1,i+1].forEach(function(j){var d=M.days[j];if(d&&d.stub)getDay(d.id);});}
/* first Read render pays a one-off style/glyph warm-up (~50 ms on desktop). Pay it while idle after launch,
   off-screen, so the first tap on Read is a short task. */
function warm(day){var ric=window.requestIdleCallback||function(f){return setTimeout(f,1200);};
  ric(function(){if(!day||S.view==='read')return;var k=document.createElement('div');
    k.className='wrap';k.setAttribute('aria-hidden','true');k.inert=true;
    k.style.cssText='position:absolute;left:-9999px;top:0;width:'+APP.clientWidth+'px;visibility:hidden;contain:layout paint';
    k.innerHTML=viewRead(day,'01-daily-watch');document.body.appendChild(k);void k.offsetHeight;k.remove();},{timeout:3000});}
var seq=0;
function route(){
  var r=parse(),pv=S.view,pd=S.day,pk=S.key,my=++seq;
  if(pv==='archive'&&r.view!=='archive'&&!flying){var sh0=$('#shelf');if(sh0){ARCH.x=sh0.scrollLeft;ARCH.y=scrollY;}}
  /* old content stays on screen until the new view is built */
  return getDay(r.day).then(function(day){
    if(my!==seq)return;
    S.view=r.view;S.day=r.day;S.key=r.key;
    var html=S.view==='archive'?viewArchive():S.view==='markets'?viewMarkets(day):S.view==='read'?viewRead(day,S.key):viewToday(day);
    var changed=!first&&(pv!==S.view||pd!==S.day||pk!==S.key),dir=changed?dirFor(pv,pd,pk,S.view,S.day,S.key):0;
    var segFrom=pv==='read'&&S.view==='read'?segInd:null,de=document.documentElement;
    var pre=null;
    function apply(){
      if(pre){APP.replaceChildren(document.importNode(pre.content,true));pre=null;}else APP.innerHTML=html;APP.setAttribute('aria-busy','false');
      document.title=(S.view==='today'?'Today\u2019s Brief':S.view[0].toUpperCase()+S.view.slice(1))+' · '+shortDay(day.id)+' · NBFC Guru';
      document.querySelectorAll('#tabbar a').forEach(function(a){var t=a.dataset.tab;
        a.href=t==='archive'?'#/archive':t==='today'?'#/'+day.id:'#/'+day.id+'/'+t;
        if(t===S.view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
      if(changed&&(pv!==S.view||pd!==S.day)){window.scrollTo(0,S.view==='archive'?ARCH.y||0:0);var hd=$('h1');if(hd){hd.setAttribute('tabindex','-1');hd.focus({preventScroll:true});}}
      if(S.view==='archive')initArchive();
      chromeBar(day);
      syncTabInd(!first);syncSegInd(segFrom);fit(true);
      var pc=$('.pill[aria-current=true]'),pl=pc&&pc.parentNode;
      if(pl&&pl.scrollTo)pl.scrollTo({left:Math.max(0,pc.offsetLeft-(pl.clientWidth-pc.offsetWidth)/2),behavior:first||RM.matches?'auto':'smooth'});
      cascade(APP,first);}
    if(first||!changed||RM.matches||!APP.animate||flying){
      var wasFirst=first;apply();landBook();if(first)riseTabbar();first=false;prefetch(day.id);if(wasFirst)warm(day);return;}
    /* sequential swap, never a crossfade: old content leaves (opacity 0, -4px, ~100 ms), then the new view
       is written and rises in. Header, date chips and (Read -> Read) the desk tabs stay put. */
    var keepSeg=pv==='read'&&S.view==='read';
    /* parse the new view while the old one fades (compositor-only), so the swap itself is shorter */
    pre=document.createElement('template');pre.innerHTML=html;
    if(!outP)outP=swapOut(keepSeg).then(function(){outP=null;});
    outP.then(function(){if(my!==seq)return;
      APP.style.minHeight=APP.offsetHeight+'px';
      inSwap={dir:dir,keepSeg:keepSeg};apply();inSwap=null;
      clearTimeout(mhT);mhT=setTimeout(function(){if(my===seq)APP.style.minHeight='';},520);});
    prefetch(day.id);
  });}
var outP=null,inSwap=null,mhT;
function stat(el,keepSeg){return el.classList.contains('hd')||el.classList.contains('pills')||(keepSeg&&el.classList.contains('seg'));}
function swapOut(keepSeg){
  var vh=innerHeight,list=[];
  APP.querySelectorAll('[data-st]').forEach(function(el){if(stat(el,keepSeg))return;
    var r=el.getBoundingClientRect();if(r.bottom<0||r.top>vh)return;list.push(el);});
  if(!list.length)return Promise.resolve();
  var anims=list.map(function(el){var o=getComputedStyle(el).opacity;el.getAnimations().forEach(function(x){x.cancel();});
    return el.animate([{opacity:o,transform:'none'},{opacity:0,transform:'translateY(-4px)'}],{duration:100,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});});
  return Promise.all(anims.map(function(x){return x.finished.catch(function(){});}));}
APP.addEventListener('click',function(e){
  var bk=e.target.closest('a[data-book]');if(bk&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey){e.preventDefault();openBook(bk);return;}
  var t=e.target.closest('button,a[data-jump]');if(!t)return;
  if(t.dataset.cal){calGo(+t.dataset.cal);return;}
  if(t.id==='themeBtn'){themeReveal(t,TNEXT[theme()]);}
  else if(t.id==='installBtn'&&installEvt){installEvt.prompt();installEvt.userChoice.finally(function(){installEvt=null;t.hidden=true;});}
  else if(t.id==='audioBtn'){toggleAudio(S.day,t);}
  else if(t.dataset.jump){e.preventDefault();var el=document.getElementById(t.dataset.jump);if(el)el.scrollIntoView({behavior:RM.matches?'auto':'smooth',block:'start'});}
});
APP.addEventListener('keydown',calKey);
/* ticker: hold still while a finger is on it */
var holdT;APP.addEventListener('touchstart',function(e){var t=e.target.closest('.tick');if(t){clearTimeout(holdT);t.classList.add('hold');}},{passive:true});
APP.addEventListener('touchend',function(e){var t=e.target.closest('.tick');if(t){clearTimeout(holdT);holdT=setTimeout(function(){t.classList.remove('hold');},1600);}},{passive:true});
document.getElementById('cbar').addEventListener('click',function(e){var b=e.target.closest('#cbTheme');if(b)themeReveal(b,TNEXT[theme()]);});
window.addEventListener('hashchange',function(){if(speaking){speechSynthesis.cancel();speaking=false;}route();});
window.addEventListener('online',function(){toast('Back online');});
window.addEventListener('offline',function(){toast('Offline · showing the last saved edition');});

loadData().then(route).catch(function(err){
  APP.setAttribute('aria-busy','false');
  APP.innerHTML='<div class="g card empty" style="margin-top:60px"><h2>Could not load the brief</h2><p>'+(navigator.onLine===false?'You are offline and no edition is saved on this device yet.':'The data file did not load. Try again in a minute.')+'</p><a class="cta press" href="">Retry</a></div>';
  console.error(err);});
/* ---------------- compact bar, aurora, ticker ---------------- */
var CB=document.getElementById('cbar'),AUR=document.getElementById('aur'),cbH1=null,hdEnd=220,cbOn=null,cbRaf=0,aurOff=false;
var TTL={today:'Today\u2019s Brief',read:'Read',markets:'Markets',archive:'Archive'};
function chromeBar(day){
  var it=item(day,'nifty'),mk='';
  if(it&&it.value){var d=dirOf(it);mk=' \u00b7 <span class="cb-m">Nifty <span class="num">'+esc(it.value)+'</span>'+(hasChg(it)?' <span class="num '+(d||'')+'">'+esc(pct(it.change))+'</span>':'')+'</span>';}
  document.getElementById('cbT').innerHTML=esc(S.view==='archive'?'Archive':TTL[S.view])+'<span> \u00b7 '+esc(S.view==='archive'?M.days.length+' editions':shortDay(day.id))+'</span>';
  document.getElementById('cbS').innerHTML='<span class="st-dot '+(filedN(day)>=dueN(day)?'ok':live(day)?'wait':'miss')+'" aria-hidden="true"></span>'+esc(status(day))+mk;
  syncCbTheme();measureHd();
  var tk=$('.tick .tk-list');if(tk){var w=tk.offsetWidth;tk.parentNode.style.setProperty('--tkd',Math.max(20,Math.round(w/38))+'s');obs(tk.closest('.tick'));}}
function measureHd(){cbH1=$('.hd h1');var hd=$('.hd');hdEnd=hd?hd.offsetTop+hd.offsetHeight:220;cbOn=null;cbUpd();}
function cbUpd(){cbRaf=0;var y=window.scrollY,p=Math.min(1,Math.max(0,y/Math.max(1,hdEnd-24))),q=Math.min(1,Math.max(0,(y-(hdEnd-110))/80));
  if(RM.matches)q=q>.5?1:0;
  if(cbH1&&!RM.matches){cbH1.style.transform=p?'translateY('+(y*.32).toFixed(1)+'px) scale('+(1-.22*p).toFixed(3)+')':'';cbH1.style.opacity=p?Math.max(0,1-p*1.15).toFixed(3):'';}
  CB.style.opacity=q;CB.style.transform=q<1?'translateY('+((q-1)*12).toFixed(1)+'px) scale('+(.97+.03*q).toFixed(3)+')':'';
  CB.style.visibility=q?'visible':'hidden';AUR.style.opacity=(1-p).toFixed(3);
  var on=q>.5;if(on!==cbOn){cbOn=on;CB.inert=!on;CB.classList.toggle('on',on);}
  var off=p>=1;if(off!==aurOff){aurOff=off;AUR.classList.toggle('off',off);}}
addEventListener('scroll',function(){if(!cbRaf)cbRaf=requestAnimationFrame(cbUpd);},{passive:true});
addEventListener('resize',function(){measureHd();});
/* off-screen: pause the ticker (saves GPU on long reads) */
var IO=window.IntersectionObserver?new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle('off',!e.isIntersecting);});}):null;
function obs(el){if(IO&&el)IO.observe(el);}
/* edge refraction (SVG displacement inside backdrop-filter) only where Chromium renders it and the device has headroom */
(function(){var de=document.documentElement,q=location.search;
  if(/[?&]glass=flat/.test(q))return;
  var okc=!!window.chrome&&window.CSS&&CSS.supports('backdrop-filter','blur(2px) url(#lgx)')&&(navigator.hardwareConcurrency||4)>=6&&!(navigator.deviceMemory&&navigator.deviceMemory<4);
  if(okc||/[?&]glass=refract/.test(q))de.classList.add('refract');})();
function tbw(){var t=document.getElementById('tabbar');document.documentElement.style.setProperty('--tbw',(t.offsetWidth+28)+'px');}
tbw();window.addEventListener('resize',tbw);if(document.fonts)document.fonts.ready.then(function(){tbw();reInd();});

/* "New edition available": a new service worker took over, or the data on the server is newer than what is on screen */
function showUpdate(){
  if($('#upd'))return;var d=document.createElement('div');d.id='upd';d.className='upd g';d.setAttribute('role','status');
  d.innerHTML='<span>New edition available</span><button type="button" class="go">Refresh</button><button type="button" class="x" aria-label="Dismiss">×</button>';
  d.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;if(b.classList.contains('go'))location.reload();else d.remove();});
  document.body.appendChild(d);
  if(d.animate&&!RM.matches)d.animate([{opacity:0,transform:'translate(-50%,16px)'},{opacity:1,transform:'translate(-50%,0)'}],{duration:SPRINGS.Snappy.ms,easing:SPRINGS.Snappy.easing});}
function probe(){
  if(!M.generated||document.visibilityState==='hidden'||navigator.onLine===false)return;
  headGenerated().then(function(g){if(g&&g>M.generated)showUpdate();}).catch(function(){});}
window.__nbfcProbe=probe;window.__nbfcShowUpdate=showUpdate;
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')probe();});
window.addEventListener('online',probe);setInterval(probe,10*60*1000);

if('serviceWorker' in navigator&&location.protocol!=='file:')window.addEventListener('load',function(){
  var had=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange',function(){if(had)showUpdate();had=true;});
  navigator.serviceWorker.register('/sw.js').then(function(reg){
    document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')reg.update().catch(function(){});});
  }).catch(function(){});
  setTimeout(probe,4000);});
})();
