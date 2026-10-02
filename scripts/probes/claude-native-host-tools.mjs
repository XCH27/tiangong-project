import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import assert from 'node:assert/strict';
const repoRoot=new URL('../../',import.meta.url);
const require=createRequire(new URL('app/package.json',repoRoot));
const {query,createSdkMcpServer,tool}=await import(pathToFileURL(require.resolve('@anthropic-ai/claude-agent-sdk')).href);
const cwd=await mkdtemp(join(tmpdir(),'fleet-native-permissions-'));
let requests=0, callbacks=0, intendedPath='';
const server=createServer(async(req,res)=>{
 let raw='';for await(const chunk of req)raw+=chunk;
 if(!req.url?.split('?')[0].endsWith('/messages')){res.writeHead(200,{'content-type':'application/json'});res.end('{}');return;}
 assert.equal(req.headers['x-api-key'],'synthetic-native-probe');
 requests++;
 const body=JSON.parse(raw);
 const hadResult=body.messages.some(m=>Array.isArray(m.content)&&m.content.some(c=>c.type==='tool_result'));
 res.writeHead(200,{'content-type':'text/event-stream'});
 const send=(type,data)=>res.write(`event: ${type}\ndata: ${JSON.stringify({type,...data})}\n\n`);
 send('message_start',{message:{id:'msg_fixture',type:'message',role:'assistant',model:'claude-sonnet-4-6',content:[],stop_reason:null,stop_sequence:null,usage:{input_tokens:10,output_tokens:0}}});
 if(!hadResult){
  send('content_block_start',{index:0,content_block:{type:'tool_use',id:'call_fixture',name:'mcp__fleet__Write',input:{}}});
  send('content_block_delta',{index:0,delta:{type:'input_json_delta',partial_json:JSON.stringify({file_path:intendedPath,content:'native-approved'})}});
 }else{
  send('content_block_start',{index:0,content_block:{type:'text',text:''}});
  send('content_block_delta',{index:0,delta:{type:'text_delta',text:'finished'}});
 }
 send('content_block_stop',{index:0});
 send('message_delta',{delta:{stop_reason:hadResult?'end_turn':'tool_use',stop_sequence:null},usage:{output_tokens:5}});
 send('message_stop',{});res.end();
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
try{
 for(const decision of ['deny','allow','stop']){
  intendedPath=join(cwd,decision+'.txt');
  const pendingApproval=Promise.withResolvers();
  const toolStarted=Promise.withResolvers();
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),25000);
  const env={...process.env,ANTHROPIC_API_KEY:'synthetic-native-probe',ANTHROPIC_AUTH_TOKEN:'',ANTHROPIC_BASE_URL:`http://127.0.0.1:${server.address().port}`,DISABLE_AUTOUPDATER:'1',CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC:'1'};
  for(const key of ['CLAUDE_CODE_USE_BEDROCK','CLAUDE_CODE_USE_VERTEX','CLAUDE_CODE_USE_FOUNDRY','CLAUDE_CODE_USE_ANTHROPIC_AWS'])env[key]='0';
  const { z } = await import(pathToFileURL(require.resolve('zod')).href);
  const host = createSdkMcpServer({name:'fleet',version:'1.0.0',tools:[tool('Write','Write the isolated fixture through its Host', {file_path:z.string(),content:z.string()},async(input)=>{callbacks++;assert.equal(input.file_path,intendedPath);toolStarted.resolve();if(decision==='stop')await pendingApproval.promise;if(controller.signal.aborted)return{content:[{type:'text',text:'Host cancelled'}],isError:true};if(decision==='deny')return{content:[{type:'text',text:'Host denied'}],isError:true};await (await import('node:fs/promises')).writeFile(input.file_path,input.content);return{content:[{type:'text',text:'Host committed'}]};})]});
  const session=query({prompt:'Perform the fixture Write tool call.',options:{cwd,env,pathToClaudeCodeExecutable:process.env.FLEET_CLAUDE_CLI_PATH ?? '/opt/homebrew/bin/claude',extraArgs:{bare:null},abortController:controller,tools:[],allowedTools:[],settingSources:[],strictMcpConfig:true,mcpServers:{fleet:host},permissionMode:'default',persistSession:false,settings:{disableAllHooks:true},canUseTool:async(name,input)=> name==='mcp__fleet__Write'?{behavior:'allow',updatedInput:input}:{behavior:'deny',message:'Unknown native tool'} }});
  let result;
  if(decision==='stop')void toolStarted.promise.then(()=>{controller.abort();pendingApproval.resolve();});
  try{for await(const event of session)if(event.type==='result')result=event;}catch(error){if(decision!=='stop')throw error;}
  finally{clearTimeout(timer);session.close();controller.abort();}
  if(decision!=='stop')assert.ok(result,'No terminal SDK result');
  if(decision==='allow')assert.equal(await readFile(intendedPath,'utf8'),'native-approved');
  else await assert.rejects(readFile(intendedPath),{code:'ENOENT'});
  console.log('PASS native CLI '+decision+' traversed the SDK MCP bridge and Host decision before the actual local effect');
 }
 assert.equal(callbacks,3);assert.ok(requests>=4 && requests<=6);
 console.log(`PASS ${requests} loopback requests, no vendor inference and no real account credentials`);
}finally{server.closeAllConnections();await new Promise(done=>server.close(done));await rm(cwd,{recursive:true,force:true});}
