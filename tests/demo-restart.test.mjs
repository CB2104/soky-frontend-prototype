import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
const base='http://127.0.0.1:3331';
const file='.soky-demo/qa-s1-api/restart-check.json';
if (process.argv[2] === 'before') {
 const login=await fetch(base+'/api/mock/v1/auth/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({email:'admin@soky.test',password:'demo'})});
 const cookie=login.headers.get('set-cookie').split(';')[0];
 const current=await (await fetch(base+'/api/mock/v1/admin/demo/workspace',{headers:{Cookie:cookie}})).json();
 const product=current.products[0];
 const title='S1 conserva cambios tras reiniciar Next';
 const saved=await fetch(base+'/api/mock/v1/admin/products/'+product.id,{method:'PATCH',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({expectedRevision:current.revision,title})});
 assert.equal(saved.status,200);
 assert.equal((await fetch(base+'/api/mock/v1/auth/me',{headers:{Cookie:cookie}})).status,200);
 await fs.writeFile(file,JSON.stringify({cookie,title,slug:product.slug}));
 console.log('PASS Persisted product and verified live session before Next shutdown');
} else {
 const check=JSON.parse(await fs.readFile(file,'utf8'));
 const product=await (await fetch(base+'/api/mock/v1/products/'+check.slug)).json();
 assert.equal(product.title,check.title);
 assert.equal((await fetch(base+'/api/mock/v1/auth/me',{headers:{Cookie:check.cookie}})).status,401);
 console.log('PASS Real Next restart retains saved product and expires process-local session');
}
