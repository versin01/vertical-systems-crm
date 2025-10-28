```sql
-- Add due_date column to cash_entries table
ALTER TABLE public.cash_entries
ADD COLUMN due_date date NOT NULL DEFAULT CURRENT_DATE;

-- Add setter_id column to cash_entries table
ALTER TABLE public.cash_entries
ADD COLUMN setter_id uuid NULL;

-- Add foreign key constraint for setter_id
ALTER TABLE public.cash_entries
ADD CONSTRAINT cash_entries_setter_id_fkey
FOREIGN KEY (setter_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- Create index on due_date for faster queries
CREATE INDEX idx_cash_entries_due_date ON public.cash_entries USING btree (due_date);

-- Create index on setter_id for faster queries
CREATE INDEX idx_cash_entries_setter_id ON public.cash_entries USING btree (setter_id);

-- Update the updated_at column automatically
CREATE TRIGGER update_cash_entries_updated_at BEFORE UPDATE ON public.cash_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```