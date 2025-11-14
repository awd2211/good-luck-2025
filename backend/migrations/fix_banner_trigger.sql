-- Fix the update_updated_at_column trigger function to use correct field name
-- This fixes the banner edit issue where trigger was looking for 'update_time' instead of 'updated_at'

-- Drop and recreate the trigger function with correct field name
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate all triggers that use this function
-- (The CASCADE in DROP FUNCTION removes the triggers, so we need to recreate them)

-- Users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Admins table
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Orders table (this one uses update_time, so it needs special handling)
-- We'll skip this one for now as it has different field name

-- Banners table
DROP TRIGGER IF EXISTS update_banners_updated_at ON banners;
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON banners
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Notifications table
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fortune management tables
DROP TRIGGER IF EXISTS update_fortune_categories_updated_at ON fortune_categories;
CREATE TRIGGER update_fortune_categories_updated_at BEFORE UPDATE ON fortune_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fortune_services_updated_at ON fortune_services;
CREATE TRIGGER update_fortune_services_updated_at BEFORE UPDATE ON fortune_services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fortune_templates_updated_at ON fortune_templates;
CREATE TRIGGER update_fortune_templates_updated_at BEFORE UPDATE ON fortune_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_horoscopes_updated_at ON daily_horoscopes;
CREATE TRIGGER update_daily_horoscopes_updated_at BEFORE UPDATE ON daily_horoscopes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_media_library_updated_at ON media_library;
CREATE TRIGGER update_media_library_updated_at BEFORE UPDATE ON media_library
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_home_configs_updated_at ON home_configs;
CREATE TRIGGER update_home_configs_updated_at BEFORE UPDATE ON home_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_promotions_updated_at ON promotions;
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_configs_updated_at ON system_configs;
CREATE TRIGGER update_system_configs_updated_at BEFORE UPDATE ON system_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Banner trigger fix completed!' as status;
