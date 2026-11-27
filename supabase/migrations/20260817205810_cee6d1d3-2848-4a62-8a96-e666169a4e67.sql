insert into public.pricing (key, label, price, unit, category)
values ('leaf_guard_per_foot', 'Leaf guard per foot', 8.00, 'ft', 'accessories')
on conflict (key) do nothing;

create or replace function public.finalize_quote_request(_id uuid, _estimate numeric, _details jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  update public.quote_requests
  set estimate = _estimate,
      details = _details,
      status = 'new',
      mode = 'calculator'
  where id = _id and status = 'incomplete';
$$;

grant execute on function public.finalize_quote_request(uuid, numeric, jsonb) to anon, authenticated;