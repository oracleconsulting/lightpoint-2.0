-- Add generated_letters table to store complaint letters
create table if not exists generated_letters (
  id uuid primary key default uuid_generate_v4(),
  complaint_id uuid not null references complaints(id) on delete cascade,
  letter_type text not null check (letter_type in ('initial_complaint', 'tier2_escalation', 'adjudicator_escalation', 'rebuttal', 'acknowledgement')),
  letter_content text not null,
  generated_at timestamp with time zone default now(),
  locked_at timestamp with time zone,
  sent_at timestamp with time zone,
  sent_by text,
  sent_method text check (sent_method in ('post', 'email', 'post_and_email', 'fax')),
  hmrc_reference text,
  notes text,
  metadata jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add indexes
create index if not exists idx_generated_letters_complaint on generated_letters(complaint_id);
create index if not exists idx_generated_letters_type on generated_letters(letter_type);
create index if not exists idx_generated_letters_sent on generated_letters(sent_at);

-- Add RLS policies
alter table generated_letters enable row level security;

create policy "Users can view letters for their org complaints"
  on generated_letters for select
  using (
    complaint_id in (
      select id from complaints
      where organization_id in (
        select organization_id from lightpoint_users where id = auth.uid()
      )
    )
  );

create policy "Users can insert letters for their org complaints"
  on generated_letters for insert
  with check (
    complaint_id in (
      select id from complaints
      where organization_id in (
        select organization_id from lightpoint_users where id = auth.uid()
      )
    )
  );

create policy "Users can update letters for their org complaints"
  on generated_letters for update
  using (
    complaint_id in (
      select id from complaints
      where organization_id in (
        select organization_id from lightpoint_users where id = auth.uid()
      )
    )
  );

-- Add trigger for updated_at
create or replace function update_generated_letters_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger generated_letters_updated_at
  before update on generated_letters
  for each row
  execute function update_generated_letters_updated_at();

-- Add comment
comment on table generated_letters is 'Stores generated complaint letters with locking and send tracking';

