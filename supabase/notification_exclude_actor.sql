-- Exclude the acting user or guest session from future notification recipients.
-- Requires creation and reply notifications. Preserves existing events and read receipts.
begin;
create or replace function public.notify_issue_status() returns trigger
language plpgsql security definer set search_path='' as $$
declare label text; previous text; actor uuid; guest uuid; event_kind text;
begin
  if tg_op='INSERT' then
    event_kind:='created'; previous:=null; actor:=new.author_id; guest:=new.guest_session_id;
  else
    if new.status is not distinct from old.status then return new; end if;
    event_kind:='status_changed'; previous:=old.status; actor:=new.updated_by; guest:=new.updated_guest_session_id;
  end if;
  select coalesce(g.display_name,u.email,'Utente') into label
    from public.issues i left join auth.users u on u.id=actor
    left join public.guest_sessions g on g.id=guest where i.id=new.id;
  insert into public.notifications(issue_id,user_id,previous_status,status,actor_name,kind)
    select new.id,u.id,previous,new.status,label,event_kind from auth.users u
    where not coalesce((to_jsonb(u)->>'is_anonymous')::boolean,false)
      and u.id is distinct from actor;
  insert into public.notifications(issue_id,guest_session_id,previous_status,status,actor_name,kind)
    select new.id,g.id,previous,new.status,label,event_kind from public.guest_sessions g
    join public.guest_invites v on v.id=g.invite_id and v.revoked_at is null
    where g.project_id=new.project_id and g.id is distinct from guest;
  return new;
end;
$$;
revoke all on function public.notify_issue_status() from public,anon,authenticated;
drop trigger if exists issue_status_notification on public.issues;
create trigger issue_status_notification after insert or update of status on public.issues
for each row execute function public.notify_issue_status();

create or replace function public.notify_issue_reply() returns trigger
language plpgsql security definer set search_path='' as $$
declare report public.issues; label text;
begin
  select * into report from public.issues where id=new.issue_id and project_id=new.project_id;
  select coalesce(g.display_name,u.email,'Utente') into label
    from public.comments c left join auth.users u on u.id=new.author_id
    left join public.guest_sessions g on g.id=new.guest_session_id where c.id=new.id;
  insert into public.notifications(issue_id,user_id,kind,comment_id,status,actor_name)
    select report.id,u.id,'reply',new.id,report.status,label from auth.users u
    where not coalesce((to_jsonb(u)->>'is_anonymous')::boolean,false)
      and u.id is distinct from new.author_id;
  insert into public.notifications(issue_id,guest_session_id,kind,comment_id,status,actor_name)
    select report.id,g.id,'reply',new.id,report.status,label from public.guest_sessions g
    join public.guest_invites v on v.id=g.invite_id and v.revoked_at is null
    where g.project_id=report.project_id and g.id is distinct from new.guest_session_id;
  return new;
end;
$$;
revoke all on function public.notify_issue_reply() from public,anon,authenticated;
drop trigger if exists issue_reply_notification on public.comments;
create trigger issue_reply_notification after insert on public.comments
for each row execute function public.notify_issue_reply();

commit;
