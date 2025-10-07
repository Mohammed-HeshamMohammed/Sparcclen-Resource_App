-- Add resource tables to Supabase (moved from local database)
-- This migration adds categories, resources, tags, and resource_tags tables

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  item_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Resources table
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  url text,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  subcategory_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  resource_type text,
  thumbnail_url text,
  thumbnail_type text,
  colors jsonb,
  metadata jsonb,
  view_count integer DEFAULT 0,
  date_added timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resources_category_id ON resources(category_id);
CREATE INDEX IF NOT EXISTS idx_resources_subcategory_id ON resources(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_resources_slug ON resources(slug);
CREATE INDEX IF NOT EXISTS idx_resources_resource_type ON resources(resource_type);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count);

-- Resource tags junction table
CREATE TABLE IF NOT EXISTS resource_tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(resource_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_resource_tags_resource_id ON resource_tags(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_tags_tag_id ON resource_tags(tag_id);

-- Enable RLS for all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories (public read, authenticated write)
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for resources (public read, authenticated write)
CREATE POLICY "Resources are viewable by everyone"
  ON resources FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage resources"
  ON resources FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for tags (public read, authenticated write)
CREATE POLICY "Tags are viewable by everyone"
  ON tags FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage tags"
  ON tags FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for resource_tags (public read, authenticated write)
CREATE POLICY "Resource tags are viewable by everyone"
  ON resource_tags FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage resource tags"
  ON resource_tags FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Triggers to auto-update updated_at
CREATE TRIGGER trigger_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(resource_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE resources 
  SET view_count = view_count + 1 
  WHERE id = resource_id;
END;
$$ LANGUAGE plpgsql;
