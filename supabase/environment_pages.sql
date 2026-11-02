-- Incrementale e rieseguibile: conserva account, segnalazioni e file.
begin;

create or replace function public.environment_pages(target uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare project uuid;
begin
  select project_id into project from public.environments where id=target;
  if project is null or not public.can_manage_project(project) or auth.jwt()->>'client_id' is not null or auth.jwt()->>'reporty_mcp_connection' is not null then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  return (select coalesce(jsonb_agg(to_jsonb(p) order by p.page_path),'[]'::jsonb)
    from (select page_path,count(*) report_count from public.issues where environment_id=target group by page_path) p);
end;
$$;

create or replace function public.rename_environment_page(target uuid, old_path text, new_path text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare environment public.environments; affected integer;
begin
  select * into environment from public.environments where id=target for update;
  if environment.id is null or not public.can_manage_project(environment.project_id) or auth.jwt()->>'client_id' is not null or auth.jwt()->>'reporty_mcp_connection' is not null then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  if old_path is null or new_path is null or length(old_path) not between 1 and 8192 or length(new_path) not between 1 and 8192
     or new_path !~ '^/[^?#]*(#/[^?#]*)?$' or new_path ~ '^//'
     or new_path ~ '[[:space:][:cntrl:]]' or position(chr(92) in new_path)>0
     or new_path ~ '(^|/)(\.|\.\.)(/|#|$)' or new_path ~* '(^|/)(%2e|\.%2e|%2e\.|%2e%2e)(/|#|$)' then
    raise exception 'Invalid page path' using errcode='22023';
  end if;
  if old_path=new_path then raise exception 'Page path unchanged' using errcode='22023'; end if;
  -- One atomic update also merges into an already populated destination.
  -- Keep document query, route query and ordinary anchors as context.
  update public.issues i set page_path=new_path,
    context=i.context || jsonb_build_object('pagePath',new_path,'origin',environment.origin,'url',
      environment.origin || split_part(new_path,'#',1)
      || coalesce(substring(split_part(i.context->>'url','#',1) from '(\?.*)$'),'')
      || case when position('#' in new_path)>0 then '#' || split_part(new_path,'#',2)
          || case when split_part(i.context->>'url','#',2) ~ '^!?/' then coalesce(substring(split_part(i.context->>'url','#',2) from '(\?.*)$'),'') else '' end
         when position('#' in i.context->>'url')>0 and split_part(i.context->>'url','#',2) !~ '^!?/' then '#' || split_part(i.context->>'url','#',2)
         else '' end),
    updated_at=clock_timestamp(),updated_by=auth.uid(),updated_guest_session_id=null
    where i.environment_id=target and i.page_path=old_path;
  get diagnostics affected = row_count;
  if affected=0 then raise exception 'Page not found' using errcode='P0002'; end if;
  return jsonb_build_object('count',affected,'projectId',environment.project_id);
end;
$$;

revoke all on function public.environment_pages(uuid),public.rename_environment_page(uuid,text,text) from public,anon,authenticated;
grant execute on function public.environment_pages(uuid),public.rename_environment_page(uuid,text,text) to authenticated;
commit;
