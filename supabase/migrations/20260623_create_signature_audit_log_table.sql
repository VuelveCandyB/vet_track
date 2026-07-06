-- Create signature_audit_log table
-- Complete audit trail for all PMF signatures (Art. 1412c)
-- Tracks who signed what and when for regulatory compliance

CREATE TABLE signature_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pmf_record_id UUID NOT NULL REFERENCES pmf_records(id) ON DELETE CASCADE,
  signer_type VARCHAR(50) NOT NULL CHECK (signer_type IN ('vet_oficial', 'representante')),
  signer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  signer_name VARCHAR(255) NOT NULL,
  signed_at TIMESTAMP DEFAULT now() NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Indexes
CREATE INDEX idx_signature_audit_log_pmf_record_id ON signature_audit_log(pmf_record_id);
CREATE INDEX idx_signature_audit_log_signer_id ON signature_audit_log(signer_id);
CREATE INDEX idx_signature_audit_log_signed_at ON signature_audit_log(signed_at);
CREATE INDEX idx_signature_audit_log_signer_type ON signature_audit_log(signer_type);

-- Enable RLS
ALTER TABLE signature_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS: All authenticated can read (audit trail is for inspection)
CREATE POLICY "Enable read for authenticated users" ON signature_audit_log
  FOR SELECT TO authenticated USING (true);

-- RLS: Only backend can insert (app inserts signatures, not direct user inserts)
CREATE POLICY "Enable insert for signatures" ON signature_audit_log
  FOR INSERT TO authenticated WITH CHECK (true);
