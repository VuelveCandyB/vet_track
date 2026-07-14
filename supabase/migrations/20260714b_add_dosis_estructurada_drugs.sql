-- Add structured dose fields to drugs table
alter table drugs add column if not exists dosis_min numeric;
alter table drugs add column if not exists dosis_max numeric;
alter table drugs add column if not exists dosis_unidad text;

-- Populate dosis_min, dosis_max, dosis_unidad for all 30 drugs based on PDF and clinical literature

-- Acepromazine: 0.05 mg/kg (single dose)
update drugs set dosis_min = 0.05, dosis_max = 0.05, dosis_unidad = 'mg/kg' where nombre = 'Acepromazine';

-- Amicar: 10cc diarios (no structured dose, leave null)
update drugs set dosis_min = null, dosis_max = null, dosis_unidad = null where nombre = 'Amicar';

-- Betamethasone: 9 mg IA
update drugs set dosis_min = 9, dosis_max = 9, dosis_unidad = 'mg' where nombre = 'Betamethasone';

-- Butorphanol: 0.1 mg/kg IV
update drugs set dosis_min = 0.1, dosis_max = 0.1, dosis_unidad = 'mg/kg' where nombre = 'Butorphanol';

-- Cetirizine: 0.4 mg/kg BID x5 dosis
update drugs set dosis_min = 0.4, dosis_max = 0.4, dosis_unidad = 'mg/kg' where nombre = 'Cetirizine';

-- Cimetidine: 20 mg/kg BID x7 dosis
update drugs set dosis_min = 20, dosis_max = 20, dosis_unidad = 'mg/kg' where nombre = 'Cimetidine';

-- Clenbuterol: 0.8 mcg/kg OD (5cc or 0.8 mcg/kg)
update drugs set dosis_min = 0.8, dosis_max = 0.8, dosis_unidad = 'mcg/kg' where nombre = 'Clenbuterol';

-- Dantrolene: 500 mg PO
update drugs set dosis_min = 500, dosis_max = 500, dosis_unidad = 'mg' where nombre = 'Dantrolene';

-- Detomidine: 11 mcg/kg or 5mg IV
update drugs set dosis_min = 5, dosis_max = 11, dosis_unidad = 'mcg/kg (or 5mg IV)' where nombre = 'Detomidine';

-- Dexamethasone: 0.05 mg/kg IV/IM/PO
update drugs set dosis_min = 0.05, dosis_max = 0.05, dosis_unidad = 'mg/kg' where nombre = 'Dexamethasone';

-- Diclofenac: topical cream, no structured dose
update drugs set dosis_min = null, dosis_max = null, dosis_unidad = null where nombre = 'Diclofenac';

-- DMSO: 0.1-1.0 g/kg IV (clinical reference, not regulatory)
update drugs set dosis_min = 0.1, dosis_max = 1.0, dosis_unidad = 'g/kg', notas = 'Dosis de referencia clínica (no reglamentaria) — fuente: literatura veterinaria.' where nombre = 'DMSO';

-- Firocoxib: 0.1 mg/kg or 2cc oral
update drugs set dosis_min = 0.1, dosis_max = 0.1, dosis_unidad = 'mg/kg (or 2cc)' where nombre = 'Firocoxib';

-- Flunixin Meglumine: 1.1 mg/kg IV
update drugs set dosis_min = 1.1, dosis_max = 1.1, dosis_unidad = 'mg/kg' where nombre = 'Flunixin Meglumine';

-- Furosemide: 150-500 mg IV
update drugs set dosis_min = 150, dosis_max = 500, dosis_unidad = 'mg' where nombre = 'Furosemide';

-- Glycopyrrolate: 1 mg IV (single dose)
update drugs set dosis_min = 1, dosis_max = 1, dosis_unidad = 'mg' where nombre = 'Glycopyrrolate';

-- Guaifenesin: 2 g BID x5 dosis
update drugs set dosis_min = 2, dosis_max = 2, dosis_unidad = 'g' where nombre = 'Guaifenesin';

-- Isoflupredone: 10 mg subQ or 20 mg IA/IV/IM
update drugs set dosis_min = 10, dosis_max = 20, dosis_unidad = 'mg' where nombre = 'Isoflupredone';

-- Ketoprofen: 2.2 mg/kg IV
update drugs set dosis_min = 2.2, dosis_max = 2.2, dosis_unidad = 'mg/kg' where nombre = 'Ketoprofen';

-- Lidocaine: 200 mg subcutaneous
update drugs set dosis_min = 200, dosis_max = 200, dosis_unidad = 'mg' where nombre = 'Lidocaine';

-- Mepivacaine: 0.07 mg/kg subcutaneous
update drugs set dosis_min = 0.07, dosis_max = 0.07, dosis_unidad = 'mg/kg' where nombre = 'Mepivacaine';

-- Methocarbamol: 15 mg/kg IV or 5g oral
update drugs set dosis_min = 5, dosis_max = 15, dosis_unidad = 'mg/kg (or 5g oral)' where nombre = 'Methocarbamol';

-- Methylprednisolone: 10cc (400mg) IA
update drugs set dosis_min = 400, dosis_max = 400, dosis_unidad = 'mg' where nombre = 'Methylprednisolone';

-- Omeprazole: 1 tube (2.2g) OD
update drugs set dosis_min = 2.2, dosis_max = 2.2, dosis_unidad = 'g' where nombre = 'Omeprazole';

-- Phenylbutazone: 10cc (2g) IV daily x3 days
update drugs set dosis_min = 2, dosis_max = 2, dosis_unidad = 'g' where nombre = 'Phenylbutazone';

-- Prednisolone: 1 mg/kg oral
update drugs set dosis_min = 1, dosis_max = 1, dosis_unidad = 'mg/kg' where nombre = 'Prednisolone';

-- Procaine penicillin: 15,000-30,000 IU/kg IM (clinical reference, not regulatory)
update drugs set dosis_min = 15000, dosis_max = 30000, dosis_unidad = 'IU/kg', notas = 'Dosis de referencia clínica (no reglamentaria) — fuente: literatura veterinaria.' where nombre = 'Procaine penicillin';

-- Ranitidine: 8 mg/kg BID x7 dosis
update drugs set dosis_min = 8, dosis_max = 8, dosis_unidad = 'mg/kg' where nombre = 'Ranitidine';

-- Triamcinolone Acetonide: 9 mg IA (total dose)
update drugs set dosis_min = 9, dosis_max = 9, dosis_unidad = 'mg' where nombre = 'Triamcinolone Acetonide';

-- Xylazine: 200 mg IV
update drugs set dosis_min = 200, dosis_max = 200, dosis_unidad = 'mg' where nombre = 'Xylazine';
