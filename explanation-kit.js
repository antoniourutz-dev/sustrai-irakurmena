/* SUSTRAI · Azalpen pedagogikoak, erantzunaren ondoren soilik. */
'use strict';
(function(){
  function node(tag,kind,text){
    const el=document.createElement(tag);
    if(kind)el.className=kind;
    if(text!==undefined&&text!==null)el.textContent=String(text);
    return el;
  }
  function append(target,data){
    if(!target||!data||typeof data.reason!=='string'||!data.reason.trim())return;
    const details=node('details','sr-explanation');
    details.append(node('summary','','Zergatik? · Ikusi azalpena'));
    const body=node('div','sr-explanation-body');
    const attribution=typeof data.attribution==='string'&&data.attribution.length<=200
      ? data.attribution
      : 'SUSTRAIren azalpen didaktikoa · ez da azterketako testu ofiziala';
    body.append(node('p','sr-exp-label',attribution));
    body.append(node('p','sr-exp-reason',data.reason));
    if(data.excerpt){
      const quote=node('blockquote','sr-exp-quote',data.excerpt);
      body.append(quote);
    }
    if(data.location)body.append(node('p','sr-exp-location','Testuko kokalekua: '+data.location));
    if(Array.isArray(data.distractors)&&data.distractors.length){
      body.append(node('strong','','Zergatik ez beste aukerak?'));
      const list=node('ul','sr-exp-distractors');
      for(const distractor of data.distractors){
        if(!distractor||typeof distractor.reason_eu!=='string')continue;
        list.append(node('li','',String(distractor.option||'?')+': '+distractor.reason_eu));
      }
      if(list.children.length)body.append(list);
    }
    if(data.strategy){
      body.append(node('strong','','Irakurtzeko estrategia'));
      body.append(node('p','',data.strategy));
    }
    if(data.transfer){
      body.append(node('strong','','Saiatu berriro'));
      body.append(node('p','',data.transfer));
    }
    details.append(body);
    target.append(details);
  }
  window.SustraiExplanation={append};
})();
