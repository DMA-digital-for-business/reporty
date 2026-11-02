import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';

test('page rename preserves references, merges, isolates environments and checks dashboard authorization', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
      create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,is_anonymous boolean default false);
      create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
      create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
      grant usage on schema auth,public to anon,authenticated; grant execute on function auth.uid(),auth.jwt() to anon,authenticated;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb);`);
    await db.exec(await readFile(new URL('../initialize.sql',import.meta.url),'utf8'));
    await db.exec(await readFile(new URL('../report_attachments.sql',import.meta.url),'utf8'));

    await db.exec(await readFile(new URL('../page_reports.sql', import.meta.url), 'utf8'));
    const migration = await readFile(new URL('../environment_pages.sql', import.meta.url), 'utf8');
    const developer = randomUUID(), anonymous = randomUUID(), project = randomUUID(), env = randomUUID(), other = randomUUID();
    await db.query('insert into auth.users(id,email,is_anonymous) values($1,$2,false),($3,$4,true)', [developer,'dev@example.com',anonymous,'anon@example.com']);
    const as = async (id, role = 'authenticated', claims = {}) => {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify({sub:id,is_anonymous:id===anonymous,...claims})]);
      await db.exec(`set role ${role}`);
    };
    await as(developer);
    await db.query('insert into public.projects(id,name,created_by) values($1,$2,$3)', [project,'Project',developer]);
    await db.query('insert into public.environments(id,project_id,name,origin) values($1,$2,$3,$4),($5,$2,$6,$7)', [env,project,'Production','https://example.com:8443',other,'Other','https://other.example']);
    const report = async (target, operation, payload) => (await db.query('select public.report_operation(null,$1,$2,$3) data', [target,operation,payload])).rows[0].data;
    const create = async (target, path, url) => report(target,'create',{body:'Report '+path,context:{origin:target===env?'https://example.com:8443':'https://other.example',pagePath:path,url,anchor:{kind:'page'}}});
    const old = await create(env,'/news','https://example.com:8443/news?sort=asc#details');
    await report(env,'reply',{id:old.id,body:'Reply preserved'});
    await db.exec('reset role');
    const image = `${project}/${old.id}/image.jpg`, fileId = randomUUID(), file = `report-attachments/${project}/${old.id}/${fileId}`;
    await db.query('update public.issues set screenshot_path=$1,screenshot_paths=$2 where id=$3',[image,[image],old.id]);
    await db.query('insert into public.issue_attachments(id,issue_id,author_id,name,size,path,committed) values($1,$2,$3,$4,3,$5,true)',[fileId,old.id,developer,'file.txt',file]);
    await db.query('insert into storage.objects(bucket_id,name) values($1,$2),($3,$4)',['screenshots',image,'report-attachments',file]);
    const storageBefore = (await db.query('select * from storage.objects order by name')).rows;
    const filesBefore = (await db.query('select * from public.issue_attachments')).rows;
    await as(developer);
    await report(env,'status',{id:old.id,status:'resolved'});
    await create(env,'/nuove-news','https://example.com:8443/nuove-news');
    const foreign = await create(other,'/news','https://other.example/news');
    const rename = async (from, to, target = env) => (await db.query('select public.rename_environment_page($1,$2,$3) data',[target,from,to])).rows[0].data;
    const pages = async () => (await db.query('select public.environment_pages($1) data',[env])).rows[0].data;
    assert.equal((await pages()).length,2);
    await db.exec('reset role');
    // Applying twice must preserve all data and match the fresh schema.
    const definitions = async () => (await db.query("select pg_get_functiondef(oid) definition from pg_proc where proname in ('environment_pages','rename_environment_page') order by proname")).rows;
    const freshDefinitions = await definitions();
    await db.exec(migration); await db.exec(migration);
    assert.deepEqual(await definitions(),freshDefinitions);
    await as(developer);
    const before = await report(env,'thread',{id:old.id});
    assert.equal((await rename('/news','/nuove-news')).count,1);
    const after = await report(env,'thread',{id:old.id});
    assert.equal(after.issue.page_path,'/nuove-news');
    assert.equal(after.issue.context.url,'https://example.com:8443/nuove-news?sort=asc#details');
    assert.equal(after.issue.context.pagePath,'/nuove-news');
    assert.deepEqual(after.comments,before.comments);
    for (const field of ['id','body','status','priority','author_id','screenshot_path','screenshot_paths','created_at']) assert.deepEqual(after.issue[field],before.issue[field]);
    assert.equal(after.issue.updated_by,developer);
    assert.equal((await report(other,'thread',{id:foreign.id})).issue.page_path,'/news');
    assert.deepEqual(await pages(),[{page_path:'/nuove-news',report_count:2}]);
    await assert.rejects(rename('/news','/missing'),/Page not found/);
    for (const path of ['https://evil.example/x','//evil.example/x','/x?query=1','/x#anchor','/a/../x','/a/%2e%2e/x','/a\\b','/x y','']) await assert.rejects(rename('/nuove-news',path),/Invalid page path/);
    await assert.rejects(rename('/nuove-news','/nuove-news'),/unchanged/);
    const hash = await create(env,'/app#/news','https://example.com:8443/app?lang=it#!/news?sort=asc');
    await rename('/app#/news','/new-app#/nuove-news');
    assert.equal((await report(env,'thread',{id:hash.id})).issue.context.url,'https://example.com:8443/new-app?lang=it#/nuove-news?sort=asc');
    await rename('/new-app#/nuove-news','/plain');
    assert.equal((await report(env,'thread',{id:hash.id})).issue.context.url,'https://example.com:8443/plain?lang=it');
    await as(anonymous); await assert.rejects(pages(),/Not authorized/); await assert.rejects(rename('/plain','/denied'),/Not authorized/);
    await as(null,'anon'); await assert.rejects(pages(),/permission denied/); await assert.rejects(rename('/plain','/denied'),/permission denied/);
    for (const claims of [{client_id:'oauth-client'},{reporty_mcp_connection:randomUUID()}]) {
      await as(developer,'authenticated',claims); await assert.rejects(pages(),/Not authorized/); await assert.rejects(rename('/plain','/denied'),/Not authorized/);
    }
    await as(developer); await assert.rejects(rename('/plain','/denied',randomUUID()),/Not authorized/);
    assert.ok((await pages()).some(page=>page.page_path==='/plain'));
    await db.exec('reset role');
    assert.deepEqual((await db.query('select * from storage.objects order by name')).rows,storageBefore);
    assert.deepEqual((await db.query('select * from public.issue_attachments')).rows,filesBefore);
    const definition = (await db.query("select pg_get_functiondef('public.rename_environment_page(uuid,text,text)'::regprocedure) definition")).rows[0].definition;
    await db.exec(migration);
    assert.equal((await db.query("select pg_get_functiondef('public.rename_environment_page(uuid,text,text)'::regprocedure) definition")).rows[0].definition,definition);
  } finally { await db.close(); }
});
