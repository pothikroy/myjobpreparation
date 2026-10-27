/* Transport only: local progress and backups retain their original schemas. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StudyCloudRecords=api;})(typeof window==='undefined'?globalThis:window,function(){
 'use strict';
 const FORMAT='study-text-parts-v1',LIMIT=200000,SIZE=65000;
 function encode(data){
  const text=JSON.stringify(data);if(text.length<=LIMIT)return {data};
  const parts=[];
  for(let start=0;start<text.length;){let end=Math.min(start+SIZE,text.length);const last=text.charCodeAt(end-1);if(end<text.length&&last>=0xD800&&last<=0xDBFF)end--;parts.push(text.slice(start,end));start=end;}
  return {parts};
 }
 function decode(parts){if(!parts.length||parts.some(p=>typeof p!=='string'))throw new Error('A saved progress part is missing. Please retry sync.');return JSON.parse(parts.join(''));}
 function validParts(id,parts){return Array.isArray(parts)&&parts.length>0&&parts.length<=256&&new Set(parts).size===parts.length&&parts.every(p=>typeof p==='string'&&p.startsWith(id+'--')&&/^[a-z0-9-]+$/.test(p));}
 return {FORMAT,LIMIT,SIZE,encode,decode,validParts};
});
