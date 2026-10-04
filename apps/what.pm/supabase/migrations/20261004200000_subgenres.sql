alter table public.items
  add column if not exists subgenres text[] not null default '{}';

comment on column public.items.subgenres is 'Finer genres within the main one, so far only for literary fiction';
