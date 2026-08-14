-- Limpieza de 65 grupos de caballos duplicados verificados como sin historial médico
-- Conservar: la copia con microchip si es "mixto", o la más antigua si es "ambos sin chip"
-- Borrar: las copias redundantes

BEGIN;

-- Borrar copias "sin chip" de los 53 grupos mixtos
-- Conservar la copia "con chip"
DELETE FROM horses
WHERE id IN (
  SELECT h.id
  FROM horses h
  WHERE (microchip IS NULL OR microchip = '')
    AND (name, birth_date) IN (
      SELECT name, birth_date
      FROM horses
      GROUP BY name, birth_date
      HAVING count(*) > 1
        AND count(*) FILTER (WHERE microchip IS NOT NULL AND microchip <> '') > 0
        AND count(*) FILTER (WHERE microchip IS NULL OR microchip = '') > 0
    )
);

-- 12 grupos "ambos sin chip": IDs identificados en la investigación
-- Conservar el más antiguo (created_at menor), borrar el más nuevo
DELETE FROM horses
WHERE id IN (
  SELECT newer.id
  FROM horses newer
  WHERE (newer.name, newer.birth_date) IN (
    -- YOU'RE ON MUTE
    ('YOU''RE ON MUTE', '2021-01-01'),
    -- YULIMAR
    ('YULIMAR', '2022-01-01'),
    -- YUMYUM EAT EM UP
    ('YUMYUM EAT EM UP', '2021-01-01'),
    -- YUNCO
    ('YUNCO', '2024-01-01'),
    -- YURIMA
    ('YURIMA', '2022-01-01'),
    -- YUTORI
    ('YUTORI', '2024-01-01'),
    -- ZAHIRA A.
    ('ZAHIRA A.', '2020-01-01'),
    -- ZAIRA
    ('ZAIRA', '2023-01-01'),
    -- ZALAMERA BABY BOY
    ('ZALAMERA BABY BOY', '2023-01-01'),
    -- ZAPPER MOON
    ('ZAPPER MOON', '2023-01-01'),
    -- ZURRIBANDA
    ('ZURRIBANDA', '2022-01-01'),
    -- ZYAN
    ('ZYAN', '2023-01-01')
  )
  AND (microchip IS NULL OR microchip = '')
  AND id NOT IN (
    SELECT id
    FROM horses older
    WHERE (older.name, older.birth_date) = (newer.name, newer.birth_date)
    ORDER BY older.created_at ASC
    LIMIT 1
  )
);

COMMIT;
