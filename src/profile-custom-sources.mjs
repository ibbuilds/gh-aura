import { readFileSync, lstatSync } from 'node:fs';
import { resolve } from 'node:path';
import { plain, httpsUrl } from './text.mjs';

export const CUSTOM_SOURCE_FORMAT='gh-aura-custom-sources-v1';
const maxFile=64*1024;
const clean=(value,length,label)=>{
  if(typeof value!=='string'||value.length>length||
    plain(value)!==value||/[\r\n]/.test(value))
    throw Error('Invalid local source '+label+'.');
  return value.trim();
};
export function readCustomProfileSources(file=process.env.GH_AURA_SOURCES_FILE){
  if(file===undefined||file===null||file==='')return [];
  if(typeof file!=='string'||file.length>1024)
    throw Error('Invalid GH Aura custom source file path.');
  let json;
  try{
    const path=resolve(file);
    const stat=lstatSync(path);
    if(!stat.isFile()||stat.isSymbolicLink()||stat.size>maxFile)
      throw Error('Not a safe regular JSON file.');
    json=JSON.parse(readFileSync(path,'utf8'));
  }catch{
    throw Error('Custom source catalog is missing, malformed or unsafe. Check GH_AURA_SOURCES_FILE locally.');
  }
  if(!json||typeof json!=='object'||Array.isArray(json)||
    json.format!==CUSTOM_SOURCE_FORMAT||!Array.isArray(json.sources)||
    json.sources.length>50||Object.keys(json).some(k=>!['format','sources'].includes(k)))
    throw Error('Invalid custom source catalog format or entry count.');
  const seen=new Set();
  return json.sources.map(item=>{
    if(!item||typeof item!=='object'||Array.isArray(item)||
      Object.keys(item).some(k=>!['id','title','url','category','tags',
        'license','use','limitations','maintenance','example'].includes(k)))
      throw Error('Invalid custom source entry fields.');
    const id=clean(item.id,45,'ID');
    if(!/^[a-z][a-z0-9-]{1,44}$/.test(id)||seen.has(id))
      throw Error('Custom source ID is invalid or repeated.');
    seen.add(id);
    const title=clean(item.title,110,'title');
    const url=clean(item.url,600,'URL');
    const category=clean(item.category||'custom',40,'category');
    const license=clean(item.license||'unknown; inspect upstream before using assets',180,'license');
    const use=clean(item.use||'Optional source selected by the user; do not copy text or assets.',260,'use');
    const limitations=clean(item.limitations||'Not independently verified; review license, privacy and maintenance.',260,'limitations');
    const maintenance=clean(item.maintenance||'not-independently-verified',100,'maintenance');
    const example=clean(item.example||'Consult this source for design inspiration only.',260,'example');
    if(!title||!url||!httpsUrl(url)||!category)
      throw Error('Custom source needs a title, a category and a safe HTTPS URL.');
    if(!Array.isArray(item.tags)||item.tags.length>16||
      item.tags.some(tag=>typeof tag!=='string'||tag.length>40||
        plain(tag)!==tag||/[\r\n]/.test(tag)))
      throw Error('Invalid custom source tags.');
    const tags=[...new Set(item.tags.map(x=>x.toLowerCase().trim()))].filter(Boolean);
    return Object.freeze({
      id:'custom-'+id,title,category,url,tags:Object.freeze(tags),
      trust:'user-supplied',license,maintenance,checkedAt:'user-supplied',
      externalRequests:true,use,example,limitations,
      notice:'This is a user-provided reference, not verified or endorsed by GH Aura. No remote URL is fetched.',
    });
  });
}
