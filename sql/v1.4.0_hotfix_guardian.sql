-- =====================================================================
-- DaiwaPlace v1.4.0 · HOTFIX del guardián de cosméticos
-- Cierra un hueco: con el permiso de UPDATE general que tiene profiles en Supabase, alguien podía escribir
-- profiles.avatar_deco (y las otras columnas de cosméticos) directo desde la consola SIN haber comprado el ítem.
-- Pega y ejecuta ESTE archivo (es idempotente). Si vas a volver a correr v1.4.0_tienda.sql, ya incluye este arreglo.
-- =====================================================================
create or replace function public.trg_profiles_cosmetics_guard()
returns trigger language plpgsql set search_path = public as $$
declare bad text;
begin
  if tg_op = 'UPDATE'
     and new.avatar_deco is not distinct from old.avatar_deco
     and new.name_style is not distinct from old.name_style
     and new.title_style is not distinct from old.title_style
     and new.card_style is not distinct from old.card_style
     and new.entry_effect is not distinct from old.entry_effect
     and new.profile_bg is not distinct from old.profile_bg then
    return new;
  end if;
  if tg_op = 'INSERT'
     and new.avatar_deco is null and new.name_style is null and new.title_style is null
     and new.card_style is null and new.entry_effect is null and new.profile_bg is null then
    return new;
  end if;
  if current_user in ('authenticated', 'anon') then
    raise exception 'Los cosméticos solo se cambian desde Personalizar' using errcode = '42501';
  end if;
  bad := coalesce(
    public.cos_inactive_ref('avatar_decoration', new.avatar_deco ->> 'id'),
    public.cos_inactive_ref('font',              new.name_style ->> 'font'),
    public.cos_inactive_ref('name_effect',       new.name_style #>> '{effect,id}'),
    public.cos_inactive_ref('title',             new.title_style ->> 'id'),
    public.cos_inactive_ref('profile_card',      new.card_style ->> 'id'),
    public.cos_inactive_ref('entry_effect',      new.entry_effect ->> 'id'),
    public.cos_inactive_ref('background',        new.profile_bg ->> 'id')
  );
  if bad is not null then
    raise exception 'El cosmético «%» todavía no está disponible', bad using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke update (avatar_deco, name_style, title_style, card_style, entry_effect, profile_bg) on public.profiles from anon, authenticated;
select 'Hotfix aplicado' as resultado;
