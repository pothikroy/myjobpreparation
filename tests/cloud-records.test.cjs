const test=require('node:test'),assert=require('node:assert/strict');
const codec=require('../cloud-records.js');
test('small progress retains the existing inline cloud representation',()=>{
 const data={gre_big_book_v1:'{"questions":{}}'};
 assert.deepEqual(codec.encode(data),{data});
});
test('large Unicode progress splits into safe records and reassembles byte for byte',()=>{
 const data={gre_big_book_v1:JSON.stringify({note:'বাংলা🙂 review '.repeat(30000)})};
 const {parts}=codec.encode(data);assert.ok(parts.length>1);
 for(const part of parts){assert.ok(Buffer.byteLength(part)<200000);assert.ok(!/[\uD800-\uDBFF]$/.test(part));assert.ok(!/^[\uDC00-\uDFFF]/.test(part));}
 const transported=parts.map(p=>Buffer.from(p,'utf8').toString('utf8'));
 assert.deepEqual(codec.decode(transported),data);
});
test('manifests cannot reference another module or an incomplete record',()=>{
 assert.equal(codec.validParts('gre-big-book',['gre-big-book--a--0']),true);
 assert.equal(codec.validParts('gre-big-book',['math--a--0']),false);
 assert.equal(codec.validParts('gre-big-book',['gre-big-book--a--0','gre-big-book--a--0']),false);
 assert.throws(()=>codec.decode(['{"data":',null]));
});
