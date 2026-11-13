import { createHash } from 'node:crypto';
import { getJSON, requestJSON, graphql, tokenFor, validateLogin, decodeReadme } from './github.mjs';
import { inspectBadgeAccounts } from './badge-accounts.mjs';
import { reserveBadgeWrite } from './badge-write-budget.mjs';

const sha=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
const digest=payload=>createHash('sha256').update(JSON.stringify(payload)).digest('hex');
const text=(value,max,label)=>{
  if(typeof value!=='string'||!value.trim()||value.length>max||/[\u0000-\u0008\u000b-\u001f\u007f]/.test(value))throw Error('Invalid collaboration '+label+'.');
  return value;
};
const label='Private GH Aura workflow exercise; not verified professional work or an earned award.';
export function planBadgeCollaboration(input={}){
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid collaboration intent.');
  const {repo,collaborator,kind='coauthor',consent,content,question,answer}=input;
  if(typeof repo!=='string'||!/^[a-z\d-]{1,39}\/[a-z\d_.-]{1,80}$/i.test(repo))throw Error('Expected owned private workspace OWNER/REPO.');
  const owner=validateLogin(repo.split('/')[0]);validateLogin(collaborator);
  if(owner.toLowerCase()===collaborator.toLowerCase()||consent!==true)throw Error('Two distinct locally authorized identities and explicit consent are required.');
  if(!['coauthor','discussion-answer'].includes(kind))throw Error('Unknown collaboration route.');
  const payload={format:'gh-aura-badge-collaboration-v1',repo,collaborator,kind,consent:true,
    ...(kind==='coauthor'?{content:text(content,12000,'content')}:{question:text(question,4000,'question'),answer:text(answer,8000,'answer')}),
    requirements:{primary:{login:owner,repositoryPermissions:kind==='coauthor'?['Contents: write','Pull requests: write']:['Discussions: write']},
      secondary:{login:collaborator,repositoryAccess:'write',repositoryPermissions:kind==='coauthor'?['Contents: read']:['Discussions: write'],
        emailPermission:kind==='coauthor'?'Email addresses: read unless using authenticated ID-based noreply':'not required'},
      setup:kind==='coauthor'?'Existing marked private workspace and authorized second account.':'Existing marked private workspace, Discussions enabled and an answerable Q&A category.'},
    label,attempt:kind==='coauthor'?'pair-extraordinaire':'galaxy-brain',awardStatus:'unverified'};
  return {...payload,fingerprint:digest(payload)};
}
export function validateBadgeCollaboration(input){
  const expected=planBadgeCollaboration(input);
  if(expected.fingerprint!==input?.fingerprint||Object.keys(input).length!==Object.keys(expected).length||Object.keys(input).some(k=>!Object.hasOwn(expected,k)||JSON.stringify(input[k])!==JSON.stringify(expected[k])))throw Error('Collaboration plan changed; review a new plan.');
  return input;
}
export async function preflightBadgeCollaboration(input,options={}){
  const plan=validateBadgeCollaboration(input);
  const access=await inspectBadgeAccounts({...options,repo:plan.repo});
  if(access.collaborator.login.toLowerCase()!==plan.collaborator.toLowerCase())throw Error('Secondary credential is not the reviewed collaborator.');
  const token=options.collaboratorToken??process.env.GH_AURA_COLLAB_TOKEN;
  const secondary={...options,token,cache:undefined,publicRead:false};
  const base='/repos/'+plan.repo.split('/').map(encodeURIComponent).join('/');
  const repo=await getJSON(base,secondary);
  if(repo?.permissions?.push!==true)throw Error('The reviewed collaborator needs write access to this private workspace.');
  let author=null,category=null;
  if(plan.kind==='coauthor'){
    const email=options.collaboratorEmail??process.env.GH_AURA_COLLAB_EMAIL;
    const name=options.collaboratorName??process.env.GH_AURA_COLLAB_NAME;
    if(typeof name!=='string'||!name.trim()||name.length>100||/[\u0000-\u001f\u007f<>]/.test(name)||typeof email!=='string'||email.length>254||!/^\S+@\S+\.\S+$/.test(email)||/[<>\r\n]/.test(email))throw Error('Configure the collaborator name and verified email locally, never in agent arguments.');
    const user=await getJSON('/user',secondary);
    const noreply=typeof user?.id==='number'&&email.toLowerCase()===(user.id+'+'+plan.collaborator+'@users.noreply.github.com').toLowerCase();
    const emails=noreply?[]:await getJSON('/user/emails?per_page=100',secondary);
    if(!noreply&&(!Array.isArray(emails)||!emails.some(x=>x.verified===true&&x.email?.toLowerCase()===email.toLowerCase())))throw Error('Collaborator email is not verified for the authenticated second account.');
    author={name,email};
  }else{
    const [owner,name]=plan.repo.split('/');
    const data=await graphql('query($owner:String!,$name:String!){repository(owner:$owner,name:$name){id isPrivate discussionCategories(first:100){nodes{id isAnswerable} pageInfo{hasNextPage}}}}',{owner,name},{...options,token:tokenFor(options),cache:undefined});
    const r=data.repository;
    if(r?.isPrivate!==true||r.discussionCategories?.pageInfo?.hasNextPage!==false)throw Error('Complete private Discussion categories could not be inspected.');
    const chosen=r.discussionCategories.nodes?.find(x=>x.isAnswerable===true);
    if(!chosen)throw Error('Enable Discussions and a Q&A category in the reviewed private workspace before applying.');
    category={repositoryId:r.id,categoryId:chosen.id};
  }
  return {base,branch:repo.default_branch,secondary,author,category};
}
export async function executeBadgeCollaboration(input,approval,options={}){
  const plan=validateBadgeCollaboration(input);
  if(approval!==plan.fingerprint)throw Error('Exact collaboration approval required.');
  const context=await preflightBadgeCollaboration(plan,options);
  const primary={...options,token:tokenFor(options),cache:undefined,publicRead:false};
  let writes=0,requests=0,lastWrite=0;
  const pause=options.sleep||((ms)=>new Promise(resolve=>setTimeout(resolve,ms)));
  const reserve=options.reserveWrite||((owner,count)=>reserveBadgeWrite(owner,{directory:options.budgetDirectory,count}));
  const mutate=async(auth,path,method,body)=>{
    if(++requests>60)throw Error('Collaboration request budget reached; inspect before retrying.');
    await reserve(auth===context.secondary?plan.collaborator:plan.repo.split('/')[0],1);
    if(lastWrite)await pause(Math.max(0,1100-(Date.now()-lastWrite)));
    lastWrite=Date.now();writes++;
    return requestJSON(path,{...auth,method,body});
  };
  const read=async path=>{if(++requests>120)throw Error('Collaboration read budget reached.');return getJSON(path,primary);};
  const graph=async(auth,query,variables)=>{
    if(++requests>120)throw Error('Collaboration read budget reached.');
    return graphql(query,variables,auth);
  };
  const graphWrite=async(auth,operation,type,variables,fields)=>{
    const result=await mutate(auth,'/graphql','POST',{query:'mutation($input:'+type+'!){'+operation+'(input:$input){'+fields+'}}',variables:{input:variables}});
    if(result?.errors?.length||!result?.data?.[operation])throw Error('Discussion mutation result is uncertain; inspect before retrying.');
    return result.data[operation];
  };
  const marker='GH-AURA-'+plan.fingerprint;
  if(plan.kind==='discussion-answer'){
    const [owner,name]=plan.repo.split('/'),body=plan.question+'\n\n'+label+'\n<!-- '+marker+' -->';
    let cursor=null,found=[],complete=false;
    for(let page=0;page<10;page++){
      const data=await graph(context.secondary,'query($owner:String!,$name:String!,$after:String){repository(owner:$owner,name:$name){discussions(first:100,after:$after,orderBy:{field:CREATED_AT,direction:DESC}){nodes{id body author{login}} pageInfo{hasNextPage endCursor}}}}',{owner,name,after:cursor});
      const list=data.repository?.discussions;
      if(!Array.isArray(list?.nodes))throw Error('Discussion history could not be inspected.');
      found.push(...list.nodes.filter(x=>x.body?.includes(marker)));
      if(!list.pageInfo?.hasNextPage){complete=true;break;}cursor=list.pageInfo.endCursor;
    }
    if(!complete||found.length>1||found.some(x=>x.body!==body||x.author?.login?.toLowerCase()!==plan.collaborator.toLowerCase()))throw Error('Discussion marker conflicts or bounded history is incomplete.');
    const discussion=found[0]||((await graphWrite(context.secondary,'createDiscussion','CreateDiscussionInput',{...context.category,body,title:'GH Aura private Q&A exercise '+plan.fingerprint.slice(0,12)},'discussion{id}')).discussion);
    if(typeof discussion?.id!=='string')throw Error('Discussion creation result is unknown.');
    const answer=plan.answer+'\n\n'+label+'\n<!-- '+marker+'-ANSWER -->';
    let after=null,comments=[],commentsComplete=false,existingAnswer=null;
    for(let page=0;page<10;page++){
      const data=await graph(context.secondary,'query($id:ID!,$after:String){node(id:$id){... on Discussion{answer{id} comments(first:100,after:$after){nodes{id body isAnswer viewerCanMarkAsAnswer author{login}} pageInfo{hasNextPage endCursor}}}}}',{id:discussion.id,after});
      const node=data.node,list=node?.comments;existingAnswer=node?.answer;
      if(!Array.isArray(list?.nodes))throw Error('Discussion comments could not be inspected.');
      comments.push(...list.nodes.filter(x=>x.body?.includes(marker+'-ANSWER')));
      if(!list.pageInfo?.hasNextPage){commentsComplete=true;break;}after=list.pageInfo.endCursor;
    }
    if(!commentsComplete||comments.length>1||comments.some(x=>x.body!==answer||x.author?.login?.toLowerCase()!==plan.repo.split('/')[0].toLowerCase()))throw Error('Discussion answer conflicts or history is incomplete.');
    if(existingAnswer&&existingAnswer.id!==comments[0]?.id)throw Error('Another answer was chosen; it will not be replaced.');
    const comment=comments[0]||((await graphWrite(primary,'addDiscussionComment','AddDiscussionCommentInput',{discussionId:discussion.id,body:answer},'comment{id}')).comment);
    const verified=await graph(context.secondary,'query($id:ID!){node(id:$id){... on DiscussionComment{id isAnswer viewerCanMarkAsAnswer body author{login} discussion{id}}}}',{id:comment?.id});
    const c=verified.node;
    if(c?.body!==answer||c.author?.login?.toLowerCase()!==plan.repo.split('/')[0].toLowerCase()||c.discussion?.id!==discussion.id)throw Error('Exact answer identity could not be verified.');
    if(!c.isAnswer){
      if(c.viewerCanMarkAsAnswer!==true)throw Error('The reviewed second account cannot accept this answer.');
      await graphWrite(context.secondary,'markDiscussionCommentAsAnswer','MarkDiscussionCommentAsAnswerInput',{id:c.id},'discussion{id answer{id}}');
    }
    const final=await graph(context.secondary,'query($id:ID!){node(id:$id){... on Discussion{answer{id}}}}',{id:discussion.id});
    if(final.node?.answer?.id!==c.id)throw Error('Accepted answer remains unverified.');
  }else{
    const {base,branch,author}=context;
    const head='gh-aura/pair-'+plan.fingerprint.slice(0,20),path='docs/gh-aura/pair-'+plan.fingerprint.slice(0,20)+'.md';
    const content=plan.content+'\n\n'+label+'\n<!-- '+marker+' -->\n',expected=sha(Buffer.from(content));
    const message='docs(sandbox): reviewed coauthor exercise\n\n'+marker+'\n\nCo-authored-by: '+author.name+' <'+author.email+'>';
    const prs=await read(base+'/pulls?state=all&head='+encodeURIComponent(plan.repo.split('/')[0]+':'+head)+'&per_page=100');
    if(!Array.isArray(prs)||prs.length>1)throw Error('Review branch has ambiguous pull requests.');
    let pr=prs[0],ref=await read(base+'/git/ref/heads/'+encodeURIComponent(head));
    if(pr?.state==='closed'&&!pr.merged_at)throw Error('The reviewed coauthor PR was closed; it will not be reopened.');
    let exactHead=ref?.object?.sha||pr?.head?.sha;
    const verifyHead=async()=>{
      if(!/^[a-f\d]{40}$/i.test(exactHead||''))throw Error('Exact coauthor head is unavailable.');
      const commit=await read(base+'/git/commits/'+exactHead);
      const file=await read(base+'/contents/'+path+'?ref='+exactHead);
      if(commit?.message!==message||commit.parents?.length!==1||file?.sha!==expected||decodeReadme(file)!==content)throw Error('Coauthor branch changed or differs from the reviewed file and trailer.');
      const diff=await read(base+'/compare/'+commit.parents[0].sha+'...'+exactHead);
      if(diff?.files?.length!==1||diff.files[0].filename!==path||diff.files[0].status!=='added')throw Error('Unexpected changes in the coauthor branch.');
    };
    if(!exactHead){
      const prior=await read(base+'/contents/'+path+'?ref='+encodeURIComponent(branch));
      if(prior)throw Error('Coauthor path already exists without its reviewed PR.');
      const start=await read(base+'/git/ref/heads/'+encodeURIComponent(branch));
      if(!/^[a-f\d]{40}$/i.test(start?.object?.sha||''))throw Error('Cannot verify default branch before coauthor staging.');
      const parent=await read(base+'/git/commits/'+start.object.sha);
      const blob=await mutate(primary,base+'/git/blobs','POST',{content,encoding:'utf-8'});
      if(blob?.sha!==expected)throw Error('Coauthor file blob mismatch.');
      const tree=await mutate(primary,base+'/git/trees','POST',{base_tree:parent.tree.sha,tree:[{path,mode:'100644',type:'blob',sha:blob.sha}]});
      const commit=await mutate(primary,base+'/git/commits','POST',{message,tree:tree.sha,parents:[start.object.sha]});
      exactHead=commit?.sha;
      if(!/^[a-f\d]{40}$/i.test(exactHead||''))throw Error('Coauthor commit result is uncertain.');
      await mutate(primary,base+'/git/refs','POST',{ref:'refs/heads/'+head,sha:exactHead});
    }
    await verifyHead();
    if(!pr){pr=await mutate(primary,base+'/pulls','POST',{title:'GH Aura reviewed private coauthor exercise',body:label+'\n\n'+marker,head,base:branch});}
    if(!Number.isInteger(pr?.number))throw Error('Coauthor PR result is uncertain.');
    pr=await read(base+'/pulls/'+pr.number);
    if(pr?.head?.sha!==exactHead||pr.base?.ref!==branch||pr.base?.repo?.full_name?.toLowerCase()!==plan.repo.toLowerCase()||pr.head?.repo?.full_name?.toLowerCase()!==plan.repo.toLowerCase()||!pr.body?.includes(marker))throw Error('Pull request differs from the reviewed private operation.');
    if(!pr.merged_at){
      if(pr.state!=='open')throw Error('Coauthor PR is not open.');
      const merged=await mutate(primary,base+'/pulls/'+pr.number+'/merge','PUT',{sha:exactHead,merge_method:'merge'});
      if(merged?.merged!==true)throw Error('Coauthor merge was not confirmed; inspect repository rules.');
    }
    const final=await read(base+'/pulls/'+pr.number),file=await read(base+'/contents/'+path+'?ref='+encodeURIComponent(branch));
    if(!final?.merged_at||file?.sha!==expected)throw Error('Merged coauthor file is not verified on the default branch.');
  }
  return {state:'events-observed',kind:plan.kind,attempt:plan.attempt,awards:'unverified',writesPerformed:writes,requests,
    note:'The reviewed private events were observed. GitHub alone decides achievement eligibility; no award is promised.'};
}
