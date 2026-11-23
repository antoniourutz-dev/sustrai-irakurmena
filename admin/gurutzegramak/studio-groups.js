/* Crossword studio: broad curricular groups, stable selection and no duplicate answers. */
(function (scope, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (scope) scope.CrosswordStudioGroups = api;
})(typeof window !== 'undefined' ? window : undefined, function () {
  'use strict';
  const GROUPS = Object.freeze([
    {id:'circulacion', icon:'❤️', label:'Bihotza eta zirkulazioa',
      description:'Kardiologia eta odolaren gaixotasunak',
      roots:['cardiologia','hematologia']},
    {id:'respiracion', icon:'🫁', label:'Arnasketa eta larrialdiak',
      description:'Pneumologia, larrialdiak eta zainketa intentsiboak',
      roots:['neumologia','urgencias','intensivos','anestesiologia']},
    {id:'cuidados', icon:'🩹', label:'Erizaintza eta zainketak',
      description:'Zauriak, prozedurak, higienea eta errehabilitazioa',
      roots:['enfermeria','procedimientos_clinicos','lesiones_traumatismos',
        'bioseguridad_higiene','equipamiento_material','cirugia','traumatologia','rehabilitacion']},
    {id:'diagnostico', icon:'🔬', label:'Analisiak eta diagnostikoa',
      description:'Laborategia, probak, irudiak eta azterketa klinikoa',
      roots:['laboratorio','imagen','pruebas_diagnosticas','exploracion_valoracion','genetica']},
    {id:'farmacia', icon:'💊', label:'Sendagaiak eta tratamenduak',
      description:'Farmazia, hormonak eta nutrizioa',
      roots:['farmacia','endocrinologia','nutricion']},
    {id:'prevencion', icon:'🛡️', label:'Infekzioak eta prebentzioa',
      description:'Mikrobiologia, immunitatea eta osasun publikoa',
      roots:['infecciosas','microbiologia','inmunologia','alergologia','salud_publica']},
    {id:'cuerpo', icon:'🧠', label:'Gorputza eta beste espezialitateak',
      description:'Anatomia, neurologia, digestioa eta bestelako arloak',
      roots:['anatomia_fisiologia','neurologia','nefrologia','gastroenterologia',
        'dermatologia','urologia','oftalmologia','otorrinolaringologia',
        'odontologia','oncologia','reumatologia','medicina_interna']},
    {id:'atencion', icon:'🤝', label:'Pazientearen arreta eta komunikazioa',
      description:'Osasun-arreta, familia, pediatria eta hizkera profesionala',
      roots:['comunicacion_clinica','gestion_sanitaria','lenguaje_profesional',
        'medicina_familiar','pediatria','ginecologia','obstetricia','geriatria','psiquiatria']}
  ]);
  const ids = () => GROUPS.map(g=>g.id);
  function validIds(selected) {
    const input = new Set(Array.isArray(selected)?selected:[]);
    return ids().filter(id=>input.has(id));
  }
  function root(code) { return String(code||'').split('.')[0]; }
  function eligible(entries,assignments,selected,makeCandidate,options={}) {
    const chosen=validIds(selected);
    if(!chosen.length)return [];
    const chosenRoots=new Set(GROUPS.filter(g=>chosen.includes(g.id)).flatMap(g=>g.roots));
    const all=chosen.length===GROUPS.length;
    const allowed=all?null:new Set((assignments||[])
      .filter(x=>chosenRoots.has(root(x.specialty_code))&&x.review_state!=='rejected')
      .map(x=>x.entry_code));
    const seen=new Set(),excluded=options.excluded||new Set();
    return (entries||[]).filter(item=>{
      if(excluded.has(item.code)||(!all&&!allowed.has(item.code)))return false;
      const found=makeCandidate(item,{phrases:!!options.phrases});
      if(!found||seen.has(found.word))return false;
      seen.add(found.word);
      return true;
    });
  }
  function serialize(selected) {
    const chosen=validIds(selected);
    if(chosen.length===GROUPS.length)return 'all';
    return 'groups:'+chosen.join(',');
  }
  function deserialize(value) {
    const serialized=String(value||'');
    if(serialized==='all'||!serialized||serialized.startsWith('category:'))return ids();
    if(serialized.startsWith('groups:'))return validIds(serialized.slice(7).split(','));
    const code=root(serialized);
    const mapped=GROUPS.filter(g=>g.roots.includes(code)).map(g=>g.id);
    return mapped.length?mapped:ids();
  }
  return Object.freeze({GROUPS,ids,validIds,eligible,serialize,deserialize});
});
