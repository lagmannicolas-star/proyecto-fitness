const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..');
function store(map=new Map()){return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),map};}
function open(name,storage=store()){
 const elements=new Map(),listeners={};
 function element(id){if(!elements.has(id))elements.set(id,{id,innerHTML:'',textContent:'',value:'',hidden:false,style:{},dataset:{},classList:{add(){},remove(){}},querySelector(){return null},querySelectorAll(){return []},setAttribute(){},getAttribute(){return null},appendChild(){},focus(){},scrollIntoView(){},addEventListener(){}});return elements.get(id);}
 const document={getElementById:element,querySelector(){return null},querySelectorAll(){return []},createElement:()=>element('new'+elements.size),body:{appendChild(){}},documentElement:{dataset:{},setAttribute(){},removeAttribute(){}},referrer:'',visibilityState:'visible',addEventListener(t,f){(listeners[t]??=[]).push(f)}};
 const context={console,document,localStorage:storage,sessionStorage:store(),navigator:{userAgent:'Test desktop',clipboard:{writeText:()=>Promise.resolve()}},location:{hash:'',pathname:'/'+name,href:'http://localhost/'+name,origin:'http://localhost'},history:{pushState(){}},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},Date,URL,URLSearchParams,Blob,FileReader:function(){},Image:function(){},screen:{width:1200},innerWidth:1200,scrollTo(){},matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){}};context.window=context;context.globalThis=context;
 vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'assets/core.js'),'utf8'),context);
 let html=fs.readFileSync(path.join(root,name),'utf8');let js=fs.readFileSync(path.join(root,'assets',name.replace('.html','.js')),'utf8');
 js=js.replace(/\}\)\(\);\s*$/,`window.TEST={get db(){return db},get ui(){return ui},save,load,quote,paymentQuote,render,vendor,offer,payBenefits,${name==='nicolas.html'?'cartAdd,cartGroups,createOrderFrom,payFirstGroup,get cart(){return cart},':name==='proveedores.html'?'parseSheet,parseNum,me,':'me,'}get app(){return app}};})();`);
 vm.runInContext(js,context,{filename:name,timeout:5000});return {context,t:context.TEST,listeners,storage};
}
module.exports={open,store};
if(require.main===module){for(const file of ['admin.html','nicolas.html','proveedores.html']){const a=open(file);assert(a.t.app.innerHTML.length>100);console.log(file+': render inicial correcto');}}
