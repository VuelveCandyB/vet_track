-- Segunda ronda: limpiar los 6 pares de duplicados restantes (sin chip, sin historial)
-- Conservar el más antiguo (created_at menor), borrar el más nuevo

BEGIN;

-- Borrar: YULIMAR (más nuevo, o arbitrario si misma fecha)
DELETE FROM horses WHERE id = 'e1f93678-b733-4134-a065-d277a3ddf4b8';

-- Borrar: YUNCO (más nuevo)
DELETE FROM horses WHERE id = 'a76b3e04-956e-4a30-adcd-736f309a2d9e';

-- Borrar: ZAHIRA A. (más nuevo, 2026-04-24)
DELETE FROM horses WHERE id = '6adba608-8ae8-4945-86a0-504e65a68762';

-- Borrar: ZAPPER MOON (más nuevo, 2026-04-24)
DELETE FROM horses WHERE id = 'd91af22e-6175-46fd-8245-28bcc23f7120';

-- Borrar: ZURRIBANDA (más nuevo, 2026-04-24)
DELETE FROM horses WHERE id = '93460705-b918-43a9-ac09-feec19fcb1f3';

-- Borrar: ZYAN (más nuevo, 2026-04-24)
DELETE FROM horses WHERE id = 'd0fc584b-feb3-4554-9df4-ef5d088e18bb';

COMMIT;
