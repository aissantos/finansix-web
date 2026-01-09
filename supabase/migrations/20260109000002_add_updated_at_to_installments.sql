-- Add updated_at column to installments table
-- This column is referenced by triggers but was missing from initial schema

ALTER TABLE installments 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_installments_updated_at ON installments;

CREATE TRIGGER update_installments_updated_at
  BEFORE UPDATE ON installments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN installments.updated_at IS 'Timestamp of last update';
