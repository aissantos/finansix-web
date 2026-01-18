-- Enable pg_cron if not enabled (requires superuser, usually available in Supabase projects)
create extension if not exists pg_cron with schema extensions;

-- Create function to clean logs
create or replace function cleanup_old_audit_logs()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.audit_logs
  where timestamp < (now() - interval '90 days');
end;
$$;

-- Schedule the job to run daily at 3am
select cron.schedule(
  'cleanup_audit_logs_job', -- job name
  '0 3 * * *',              -- cron schedule (3 AM daily)
  $$select cleanup_old_audit_logs()$$
);
