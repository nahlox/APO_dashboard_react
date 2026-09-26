-- Durcissement : les helpers RH ne sont utiles qu'aux utilisateurs connectés
-- (policies RLS), et la fonction trigger n'a pas à être appelable via l'API.
REVOKE EXECUTE ON FUNCTION public.get_rh_tenant_id()                FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.peut_saisir_rh()                  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mois_rh_verrouille(TEXT, DATE)    FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.emargement_check_tenant()         FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_rh_tenant_id()                TO authenticated;
GRANT  EXECUTE ON FUNCTION public.peut_saisir_rh()                  TO authenticated;
GRANT  EXECUTE ON FUNCTION public.mois_rh_verrouille(TEXT, DATE)    TO authenticated;
