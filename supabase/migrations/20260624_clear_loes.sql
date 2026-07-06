-- Clear all horses from LOES
UPDATE horses
SET en_loes = false, fecha_ingreso_loes = NULL
WHERE en_loes = true;
