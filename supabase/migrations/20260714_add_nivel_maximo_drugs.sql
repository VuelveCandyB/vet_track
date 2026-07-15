-- Add nivel_maximo_permitido column to drugs table
alter table drugs add column if not exists nivel_maximo_permitido text;

-- Update existing drugs with correct data from official PDF JH-18-17 (2018-10-18)

-- Fix Furosemide (critical: WDT is 4 hours, not 48)
update drugs set
  withdrawal_time_horas = 4,
  dosis_ruta = '150-500mg IV (dosis única). Gravedad específica en orina < 1.010',
  tipo_restriccion = 'RAT',
  nivel_maximo_permitido = '100 ng/mL en plasma o suero'
where nombre = 'Furosemide';

-- Fix Triamcinolone Acetonide (dosis 9mg not 22mg, WDT 6 días not 4)
update drugs set
  dosis_ruta = '9mg IA (dosis total)',
  withdrawal_time_horas = 144,
  nivel_maximo_permitido = '100 pg/mL en plasma o suero'
where nombre = 'Triamcinolone Acetonide';

-- Fix Betamethasone (dosis 9mg not 8mg, WDT 6 días not 7)
update drugs set
  dosis_ruta = '9mg IA',
  withdrawal_time_horas = 144,
  nivel_maximo_permitido = '10 pg/mL en plasma o suero'
where nombre = 'Betamethasone';

-- Fix Methylprednisolone (WDT 6 días IA, update notes, add nivel máximo)
update drugs set
  withdrawal_time_horas = 144,
  notas = 'Restricción 6 días (144h) vía IA; 21 días (504h) vía IM',
  nivel_maximo_permitido = '1300 pg/mL en plasma o suero'
where nombre = 'Methylprednisolone';

-- Fix Detomidine (corrección de unidad: mg/kg → mcg/kg)
update drugs set
  dosis_ruta = '11mcg/kg ó 5mg IV',
  nivel_maximo_permitido = '2 ng/mL de carboxydetomidine en orina; LOD en plasma'
where nombre = 'Detomidine';

-- Fix Firocoxib (vía IV → PO)
update drugs set
  dosis_ruta = '1 dosis oral (PO) 0.1mg/kg ó 2cc',
  nivel_maximo_permitido = '40 ng/mL en plasma o suero'
where nombre = 'Firocoxib';

-- Fix Prednisolone (elimina residuo "1%")
update drugs set
  dosis_ruta = '1 mg/kg PO',
  nivel_maximo_permitido = '1 ng/mL en suero o plasma'
where nombre = 'Prednisolone';

-- Populate nivel_maximo_permitido for all remaining existing drugs
update drugs set nivel_maximo_permitido = '10 ng/mL del metabolito 2-(1-hydroxyethyl) promazine sulfoxide (HEPS) en orina' where nombre = 'Acepromazine';
update drugs set nivel_maximo_permitido = '5 mcg/mL en suero o plasma' where nombre = 'Amicar';
update drugs set nivel_maximo_permitido = '300 ng/mL del total de Butorphanol en orina o 2 ng/mL de Butorphanol libre en suero o plasma' where nombre = 'Butorphanol';
update drugs set nivel_maximo_permitido = '6 ng/mL en plasma o suero' where nombre = 'Lidocaine';
update drugs set nivel_maximo_permitido = '10 ng/mL del total de hydroxymepivacaine en orina o sobre el LOD de Mepivacaine en plasma' where nombre = 'Mepivacaine';
update drugs set nivel_maximo_permitido = '400 ng/mL en plasma o suero' where nombre = 'Cimetidine';
update drugs set nivel_maximo_permitido = '20 pg/mL en plasma o suero' where nombre = 'Clenbuterol';
update drugs set nivel_maximo_permitido = '50 pg/mL en plasma o suero' where nombre = 'Dexamethasone';
update drugs set nivel_maximo_permitido = '5 ng/mL en plasma o suero' where nombre = 'Diclofenac';
update drugs set nivel_maximo_permitido = '10 mcg/mL en plasma o suero' where nombre = 'DMSO';
update drugs set nivel_maximo_permitido = '20 ng/mL en plasma o suero' where nombre = 'Flunixin Meglumine';
update drugs set nivel_maximo_permitido = '12 ng/mL en plasma o suero' where nombre = 'Guaifenesin';
update drugs set nivel_maximo_permitido = '100 pg/mL en plasma o suero' where nombre = 'Isoflupredone';
update drugs set nivel_maximo_permitido = '2 ng/mL en plasma o suero' where nombre = 'Ketoprofen';
update drugs set nivel_maximo_permitido = '5 ng/mL en plasma o suero' where nombre = 'Methocarbamol';
update drugs set nivel_maximo_permitido = '10 ng/mL en plasma o suero' where nombre = 'Omeprazole';
update drugs set nivel_maximo_permitido = '40 ng/mL en plasma o suero' where nombre = 'Ranitidine';
update drugs set nivel_maximo_permitido = '200 pg/mL en plasma o suero' where nombre = 'Xylazine';
update drugs set nivel_maximo_permitido = '8 mcg/mL en plasma o suero' where nombre = 'Phenylbutazone';

-- Insert 5 missing drugs from official PDF

insert into drugs (nombre, nombre_comercial, categoria, dosis_ruta, detection_time_horas, withdrawal_time_horas, tipo_restriccion, nivel_maximo_permitido, notas, active)
values ('Cetirizine', '', 'Antihistamínico', '0.4 mg/kg dos (2) veces al día hasta un total de cinco (5) dosis', null, 48, 'WDT', '6 ng/mL en plasma o suero', 'No administrar Ivermectin dentro de las 48 horas previo a la carrera si se ha administrado Cetirizine', true);

insert into drugs (nombre, nombre_comercial, categoria, dosis_ruta, detection_time_horas, withdrawal_time_horas, tipo_restriccion, nivel_maximo_permitido, notas, active)
values ('Dantrolene', '', 'Relajante muscular', '500mg PO (pasta o cápsula)', null, 48, 'WDT', '100 pg/mL de 5-hydroxydantrolene en plasma o suero', '', true);

insert into drugs (nombre, nombre_comercial, categoria, dosis_ruta, detection_time_horas, withdrawal_time_horas, tipo_restriccion, nivel_maximo_permitido, notas, active)
values ('DMSO', '', 'Antiinflamatorio tópico', 'Intravenoso (IV)', null, 48, 'WDT', '10 mcg/mL en plasma o suero', '', true);

insert into drugs (nombre, nombre_comercial, categoria, dosis_ruta, detection_time_horas, withdrawal_time_horas, tipo_restriccion, nivel_maximo_permitido, notas, active)
values ('Glycopyrrolate', 'Glycopyrrolate Injection, USP', 'Anticolinérgico', '1mg IV (dosis única)', null, 48, 'WDT', '3 pg/mL en plasma o suero', '', true);

insert into drugs (nombre, nombre_comercial, categoria, dosis_ruta, detection_time_horas, withdrawal_time_horas, tipo_restriccion, nivel_maximo_permitido, notas, active)
values ('Procaine penicillin', '', 'Antibiótico', 'Intramuscular (IM)', null, 504, 'WDT', '25 ng/mL en plasma o suero', '', true);
