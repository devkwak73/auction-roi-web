-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create properties table
CREATE TABLE properties (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    case_number TEXT NOT NULL,
    property_type TEXT NOT NULL,
    address TEXT NOT NULL,
    building_area DECIMAL DEFAULT 0.0,
    auction_price BIGINT NOT NULL,
    expected_sale_price BIGINT NOT NULL,
    public_price BIGINT NOT NULL,
    is_adjustment_area BOOLEAN DEFAULT FALSE,
    is_redevelopment_area BOOLEAN DEFAULT FALSE,
    is_local_area BOOLEAN DEFAULT FALSE,
    
    loan_amount BIGINT DEFAULT 0,
    loan_months INTEGER DEFAULT 0,
    interest_rate DECIMAL DEFAULT 0.0,
    interior_cost BIGINT DEFAULT 0,
    eviction_cost BIGINT DEFAULT 0,
    brokerage_fee BIGINT DEFAULT 0,
    vacancy_management_cost BIGINT DEFAULT 0,
    other_costs BIGINT DEFAULT 0,
    
    monthly_rent BIGINT DEFAULT 0,
    monthly_deposit BIGINT DEFAULT 0,
    jeonse_deposit BIGINT DEFAULT 0,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile." ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Properties Policies
CREATE POLICY "Users can view their own properties." ON properties
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own properties." ON properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties." ON properties
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties." ON properties
    FOR DELETE USING (auth.uid() = user_id);

-- Admin Policy (Example: Admin can see all properties)
CREATE POLICY "Admins can view all properties." ON properties
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
