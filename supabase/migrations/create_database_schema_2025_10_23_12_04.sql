-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_type AS ENUM ('personal', 'business');
CREATE TYPE link_type AS ENUM ('redirect', 'masking');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled');

-- Users table with subscription info
CREATE TABLE users_2025_10_23_12_04 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    user_type user_type DEFAULT 'personal',
    subscription_status subscription_status DEFAULT 'inactive',
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    links_limit INTEGER DEFAULT 10, -- Personal users: 10 links, Business: unlimited (-1)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Links table with security features
CREATE TABLE links_2025_10_23_12_04 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users_2025_10_23_12_04(id) ON DELETE CASCADE,
    alias VARCHAR(100) UNIQUE NOT NULL,
    destination_url TEXT NOT NULL,
    link_type link_type DEFAULT 'redirect',
    title VARCHAR(255),
    description TEXT,
    
    -- Security features
    password_hash VARCHAR(255), -- For password protection
    expires_at TIMESTAMP WITH TIME ZONE, -- For expiration
    max_clicks INTEGER, -- For click limit
    current_clicks INTEGER DEFAULT 0,
    
    -- Geo restrictions (JSON array of country codes)
    allowed_countries JSONB,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clicks table for analytics
CREATE TABLE clicks_2025_10_23_12_04 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    link_id UUID REFERENCES links_2025_10_23_12_04(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    country VARCHAR(2), -- Country code from IP geolocation
    city VARCHAR(100),
    device_type VARCHAR(50), -- mobile, desktop, tablet
    browser VARCHAR(50),
    os VARCHAR(50)
);

-- Subscriptions table for payment tracking
CREATE TABLE subscriptions_2025_10_23_12_04 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users_2025_10_23_12_04(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    status subscription_status DEFAULT 'inactive',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_links_user_id_2025_10_23_12_04 ON links_2025_10_23_12_04(user_id);
CREATE INDEX idx_links_alias_2025_10_23_12_04 ON links_2025_10_23_12_04(alias);
CREATE INDEX idx_clicks_link_id_2025_10_23_12_04 ON clicks_2025_10_23_12_04(link_id);
CREATE INDEX idx_clicks_clicked_at_2025_10_23_12_04 ON clicks_2025_10_23_12_04(clicked_at);

-- Enable RLS
ALTER TABLE users_2025_10_23_12_04 ENABLE ROW LEVEL SECURITY;
ALTER TABLE links_2025_10_23_12_04 ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks_2025_10_23_12_04 ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions_2025_10_23_12_04 ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON users_2025_10_23_12_04
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users_2025_10_23_12_04
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for links
CREATE POLICY "Users can view own links" ON links_2025_10_23_12_04
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create links" ON links_2025_10_23_12_04
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own links" ON links_2025_10_23_12_04
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own links" ON links_2025_10_23_12_04
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for clicks (read-only for users)
CREATE POLICY "Users can view clicks for own links" ON clicks_2025_10_23_12_04
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM links_2025_10_23_12_04 
            WHERE id = link_id AND user_id = auth.uid()
        )
    );

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions_2025_10_23_12_04
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON subscriptions_2025_10_23_12_04
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to create user profile after signup
CREATE OR REPLACE FUNCTION create_user_profile_2025_10_23_12_04()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users_2025_10_23_12_04 (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile
CREATE TRIGGER create_user_profile_trigger_2025_10_23_12_04
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile_2025_10_23_12_04();

-- Function to update click count
CREATE OR REPLACE FUNCTION increment_click_count_2025_10_23_12_04()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE links_2025_10_23_12_04 
    SET current_clicks = current_clicks + 1,
        updated_at = NOW()
    WHERE id = NEW.link_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment click count
CREATE TRIGGER increment_click_count_trigger_2025_10_23_12_04
    AFTER INSERT ON clicks_2025_10_23_12_04
    FOR EACH ROW EXECUTE FUNCTION increment_click_count_2025_10_23_12_04();