ALTER TABLE sprint_features
  ALTER COLUMN description TYPE text[] USING ARRAY[description];