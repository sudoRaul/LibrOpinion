-- Idioma preferido del usuario (i18n). Se guarda en el perfil para que viaje
-- entre dispositivos y, en el futuro, poder localizar los correos.
-- La RLS existente (update de la propia fila) ya permite al usuario cambiarlo.
alter table public.profiles add column if not exists locale text;
