-- ============================================================
-- DCLM OSUN II — Database Schema Adjustment for Firebase Import
-- Run this in your Supabase SQL Editor BEFORE running the migration script.
-- ============================================================

-- 1. Drop foreign key constraints to allow changing types
alter table public.live_chat_messages drop constraint if exists live_chat_messages_user_id_fkey;
alter table public.radio_presence drop constraint if exists radio_presence_user_id_fkey;
alter table public.workforce_applications drop constraint if exists workforce_applications_user_id_fkey;
alter table public.workforce_unit_messages drop constraint if exists workforce_unit_messages_user_id_fkey;
alter table public.support_tickets drop constraint if exists support_tickets_user_id_fkey;
alter table public.giving_transactions drop constraint if exists giving_transactions_user_id_fkey;
alter table public.users drop constraint if exists users_id_fkey;

-- 2. Alter column types to text (to support legacy alphanumeric UIDs from Firebase)
alter table public.users alter column id type text;
alter table public.live_chat_messages alter column user_id type text;
alter table public.radio_presence alter column user_id type text;
alter table public.workforce_applications alter column user_id type text;
alter table public.workforce_unit_messages alter column user_id type text;
alter table public.support_tickets alter column user_id type text;
alter table public.giving_transactions alter column user_id type text;

-- 3. Re-add foreign key constraints referencing users(id) as text
alter table public.live_chat_messages add constraint live_chat_messages_user_id_fkey foreign key (user_id) references public.users(id) on delete set null;
alter table public.radio_presence add constraint radio_presence_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;
alter table public.workforce_applications add constraint workforce_applications_user_id_fkey foreign key (user_id) references public.users(id) on delete cascade;
alter table public.workforce_unit_messages add constraint workforce_unit_messages_user_id_fkey foreign key (user_id) references public.users(id) on delete set null;
alter table public.support_tickets add constraint support_tickets_user_id_fkey foreign key (user_id) references public.users(id) on delete set null;
alter table public.giving_transactions add constraint giving_transactions_user_id_fkey foreign key (user_id) references public.users(id) on delete set null;
