CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.body, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_reports_search_vector ON reports;
--> statement-breakpoint
CREATE TRIGGER trg_reports_search_vector
  BEFORE INSERT OR UPDATE OF title, body ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_search_vector();
