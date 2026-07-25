-- Create profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  role text not null default 'learner' check (role in ('learner', 'content_creator', 'content_manager')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Profiles: user can read any profile, but only update own
create policy "Allow individual read access"
  on public.profiles for select
  using (true);

create policy "Allow individual update access"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger to create profile on sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', null, new.raw_user_meta_data ->> 'role');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();