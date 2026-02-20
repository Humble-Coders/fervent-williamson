/*
  Add dashboard visibility columns to service_categories table
  
  This migration:
  1. Adds isDashboardVisible column (default true)
  2. Adds dashboardSortOrder column (default 0)
  3. Migrates existing dashboard_visible_categories JSON config to new columns
  4. Removes the old system config entry
*/

-- Add new columns to service_categories table
ALTER TABLE "service_categories" 
ADD COLUMN "isDashboardVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "dashboardSortOrder" INTEGER DEFAULT 0;

-- Migrate existing dashboard visibility configuration from system_configs
-- First, get the existing configuration and update categories accordingly
DO $$
DECLARE
    config_value TEXT;
    visible_ids TEXT[];
    category_id TEXT;
    sort_index INTEGER := 0;
BEGIN
    -- Get existing dashboard visibility configuration
    SELECT value INTO config_value 
    FROM system_configs 
    WHERE key = 'dashboard_visible_categories';
    
    IF config_value IS NOT NULL AND config_value != '[]' THEN
        -- Parse JSON array of visible category IDs
        SELECT ARRAY(SELECT json_array_elements_text(config_value::json)) INTO visible_ids;
        
        -- Set all categories to not visible first
        UPDATE service_categories SET "isDashboardVisible" = false;
        
        -- Set visible categories and assign sort order
        FOREACH category_id IN ARRAY visible_ids
        LOOP
            UPDATE service_categories 
            SET "isDashboardVisible" = true, 
                "dashboardSortOrder" = sort_index
            WHERE id = category_id;
            
            sort_index := sort_index + 1;
        END LOOP;
        
        RAISE NOTICE 'Migrated % visible categories from system config', array_length(visible_ids, 1);
    ELSE
        -- No existing config, all categories remain visible (default)
        RAISE NOTICE 'No existing dashboard visibility config found, all categories remain visible';
    END IF;
END $$;

-- Remove the old system config entry
DELETE FROM system_configs WHERE key = 'dashboard_visible_categories';

-- Create index for performance (optional but recommended)
CREATE INDEX "service_categories_dashboard_visible_idx" 
ON "service_categories"("isDashboardVisible") 
WHERE "isDashboardVisible" = true;

-- Create index for sort order
CREATE INDEX "service_categories_dashboard_sort_idx" 
ON "service_categories"("dashboardSortOrder") 
WHERE "isDashboardVisible" = true;
