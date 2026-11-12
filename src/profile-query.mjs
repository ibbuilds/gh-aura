/** Multilingual, deterministic intent lookup; not a claim to understand all languages.
 * Natural-language agents can also select explicit IDs. No network or model needed.
 */
const aliases={
  biografia:['bio','about','introduction','story','identity','profile'],
  biografias:['bio','about','introduction','story','identity'],
  bio:['biography','about','intro','identity'],
  sobre:['bio','about','identity'],
  presentacion:['profile','intro','bio'],
  biography:['bio','about','identity'],
  identidad:['identity','bio','profile'],
  contacto:['contact','email','links'],
  contact:['links','email'],
  enlaces:['links','portfolio','contact'],
  profesional:['professional','hiring','evidence'],
  contratacion:['hiring','professional','portfolio'],
  curriculum:['resume','hiring','portfolio'],
  proyectos:['projects','featured','pinned','portfolio'],
  proyecto:['project','portfolio','featured'],
  minimalista:['minimal','barebones','plain','markdown'],
  ultraminimalista:['barebones','minimal','plain'],
  sencillo:['minimal','simple','plain'],
  limpio:['minimal','plain','readable'],
  sobrio:['minimal','professional','plain'],
  minimal:['barebones','plain'],
  tecnico:['technical','engineering','code','projects'],
  ingenieria:['engineering','technical','projects'],
  arquitectura:['engineering','diagram','technical'],
  diagramas:['diagram','mermaid','architecture'],
  grafico:['chart','graph','statistics'],
  graficos:['chart','graphs','stats'],
  estadisticas:['stats','cards','statistics'],
  estadistica:['stats','cards'],
  tarjetas:['cards','images','stats'],
  imagen:['image','art','hero','illustration'],
  imagenes:['image','visual','illustration'],
  animacion:['animation','gif','typing','visual'],
  animaciones:['animation','gif','typing'],
  iconos:['icons','logo','technology','visual'],
  logotipos:['icons','logos','brands'],
  colores:['color','visual','theme'],
  claro:['light','theme'],
  oscuro:['dark','theme'],
  terminal:['terminal','code','ascii','console'],
  consola:['terminal','code','ascii'],
  pixel:['pixel','hero','illustration','visual'],
  retro:['pixel','terminal','illustration'],
  tarot:['illustration','hero','art','visual'],
  ilustracion:['illustration','hero','image','art'],
  banner:['hero','image','header'],
  cabecera:['hero','header','image'],
  encabezado:['header','headline','bio'],
  insignia:['badge','ci','shields'],
  insignias:['badges','ci','shields'],
  medallas:['badges','achievements'],
  tipografia:['typography','text','headings'],
  accesibilidad:['accessibility','alt','contrast'],
  personalizado:['custom','user-supplied','original'],
  fuentes:['sources','resources','reference'],
  diseno:['design','visual','composition'],
};
export function intentWords(text){
  if(typeof text!=='string'||text.length>400)
    throw Error('Source/design search must be at most 400 characters.');
  const flat=text.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const tokens=flat.match(/[a-z0-9-]{2,}/g)||[];
  const unique=[...new Set(tokens)];
  for(const token of [...unique]){
    const extra=aliases[token]||[];
    for(const word of extra)if(!unique.includes(word))unique.push(word);
  }
  return unique.slice(0,48);
}
export function intentMatchScore(item,words){
  if(!words.length)return 0;
  const tags=(item.tags||[]).map(s=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase());
  const fields=[item.id,item.title,item.category,item.use,item.example,
    item.composition,item.fit,item.description].filter(Boolean).join(' ')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return words.reduce((score,word)=>{
    if(tags.includes(word))return score+11;
    if(tags.some(tag=>tag.includes(word)))return score+6;
    if(fields.includes(word))return score+3;
    return score;
  },0);
}
