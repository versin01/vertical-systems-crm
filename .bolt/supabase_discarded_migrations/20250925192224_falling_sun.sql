```sql
ALTER TABLE public.cash_entries
ADD COLUMN due_date date,
ADD COLUMN setter_id uuid;

ALTER TABLE public.cash_entries
ADD CONSTRAINT cash_entries_setter_id_fkey
FOREIGN KEY (setter_id) REFERENCES public.users(id);

-- Add index for setter_id for faster lookups
CREATE INDEX idx_cash_entries_setter_id ON public.cash_entries USING btree (setter_id);

-- Add index for due_date for faster lookups
CREATE INDEX idx_cash_entries_due_date ON public.cash_entries USING btree (due_date);
```