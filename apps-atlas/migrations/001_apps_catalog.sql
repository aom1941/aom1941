create table if not exists apps (
  id text primary key,
  name text not null,
  path text not null,
  layer text not null check (layer in ('apps', 'services', 'agents', 'infra', 'hub')),
  kind text not null check (kind in ('ui', 'service', 'agent', 'infra', 'hub')),
  zweck text not null,
  capabilities text not null,
  storage_today text not null,
  db_need text not null check (db_need in ('yes', 'maybe', 'no')),
  maturity text not null,
  github_url text,
  sort_order integer not null default 100
);

create table if not exists structure_layers (
  id text primary key,
  title text not null,
  role text not null,
  contents text not null,
  sort_order integer not null default 100
);

create index if not exists apps_layer_idx on apps (layer, sort_order);
create index if not exists apps_db_need_idx on apps (db_need);
