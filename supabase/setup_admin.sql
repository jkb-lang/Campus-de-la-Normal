-- ==============================================================================
-- CAMPUS: LA NORMAL - Configuración Segura del Primer Administrador
-- ==============================================================================
-- Instrucciones:
-- 1. Registrate normalmente desde la página de inicio o pantalla de registro.
-- 2. Copiá el correo electrónico que usaste para registrarte.
-- 3. En la consola SQL de Supabase (o ejecutando esta consulta), reemplazá
--    'tu_correo@ejemplo.com' con tu correo real y ejecutá:

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'tu_correo@ejemplo.com';

-- Para verificar que se asignó correctamente:
SELECT id, email, full_name, role, is_active FROM public.profiles WHERE role = 'admin';
