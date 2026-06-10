-- ============================================
-- ZeeStore Database Schema for Supabase
-- Jalankan SQL ini di Supabase SQL Editor
-- ============================================

-- 1. CATEGORIES
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  icon text not null default 'bi-tag',
  created_at timestamp with time zone default now()
);

alter table public.categories enable row level security;

create policy "Categories are viewable by everyone"
  on public.categories for select
  using (true);

-- 2. PROFILES (linked to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  phone text,
  address text,
  city text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. PRODUCTS
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  seller_id uuid references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id),
  name text not null,
  description text,
  price bigint not null, -- harga dalam Rupiah (integer)
  stock integer not null default 0,
  image_url text,
  city text default 'Jakarta',
  rating numeric(2,1) default 0,
  sold integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.products enable row level security;

create policy "Products are viewable by everyone"
  on public.products for select
  using (true);

create policy "Authenticated users can insert products"
  on public.products for insert
  with check (auth.uid() = seller_id);

create policy "Sellers can update own products"
  on public.products for update
  using (auth.uid() = seller_id);

create policy "Sellers can delete own products"
  on public.products for delete
  using (auth.uid() = seller_id);

-- 4. CART ITEMS
create table if not exists public.cart_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer not null default 1,
  created_at timestamp with time zone default now(),
  unique(user_id, product_id)
);

alter table public.cart_items enable row level security;

create policy "Users can view own cart"
  on public.cart_items for select
  using (auth.uid() = user_id);

create policy "Users can add to own cart"
  on public.cart_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update own cart"
  on public.cart_items for update
  using (auth.uid() = user_id);

create policy "Users can delete from own cart"
  on public.cart_items for delete
  using (auth.uid() = user_id);

-- 5. ORDERS
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending',
  payment_method text,
  shipping_name text,
  shipping_address text,
  shipping_city text,
  shipping_phone text,
  subtotal bigint not null default 0,
  shipping_cost bigint not null default 0,
  total bigint not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.orders enable row level security;

create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can create own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own orders"
  on public.orders for update
  using (auth.uid() = user_id);

-- 6. ORDER ITEMS
create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id),
  product_name text not null,
  product_image text,
  quantity integer not null,
  price bigint not null,
  created_at timestamp with time zone default now()
);

alter table public.order_items enable row level security;

create policy "Users can view own order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );

create policy "Users can insert order items for own orders"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );

-- ============================================
-- SEED DATA
-- ============================================

-- Categories
insert into public.categories (id, name, icon) values
  ('a1000000-0000-0000-0000-000000000001', 'Elektronik', 'bi-laptop'),
  ('a1000000-0000-0000-0000-000000000002', 'Fashion Pria', 'bi-person'),
  ('a1000000-0000-0000-0000-000000000003', 'Fashion Wanita', 'bi-handbag'),
  ('a1000000-0000-0000-0000-000000000004', 'Makanan & Minuman', 'bi-cup-hot'),
  ('a1000000-0000-0000-0000-000000000005', 'Rumah Tangga', 'bi-house'),
  ('a1000000-0000-0000-0000-000000000006', 'Olahraga', 'bi-bicycle')
on conflict (name) do nothing;

-- Seed products (seller_id will be NULL for seed data — that's fine for browsing)
insert into public.products (name, description, price, stock, image_url, city, rating, sold, category_id) values
  ('Laptop Gaming Pro X1', 'Laptop gaming performa tinggi dengan RTX 4060, RAM 16GB, SSD 512GB. Layar 15.6" FHD 144Hz.', 15499000, 25, 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=400&fit=crop', 'Jakarta', 4.8, 152, 'a1000000-0000-0000-0000-000000000001'),
  ('TWS Earbuds Pro Max', 'Earbuds wireless dengan ANC, bass boost, battery 30 jam. Bluetooth 5.3.', 349000, 150, 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=400&fit=crop', 'Bandung', 4.6, 1024, 'a1000000-0000-0000-0000-000000000001'),
  ('Smartwatch Ultra Fit', 'Smartwatch dengan GPS, heart rate monitor, SpO2, 100+ sport modes. IP68 waterproof.', 899000, 80, 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=400&h=400&fit=crop', 'Surabaya', 4.5, 543, 'a1000000-0000-0000-0000-000000000001'),
  ('Kemeja Flannel Premium', 'Kemeja flannel 100% cotton, comfortable fit, cocok untuk casual dan semi-formal.', 189000, 200, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=400&fit=crop', 'Yogyakarta', 4.7, 876, 'a1000000-0000-0000-0000-000000000002'),
  ('Sneakers Urban Street', 'Sepatu sneakers trendy, sol empuk, cocok untuk daily wear. Tersedia ukuran 39-44.', 459000, 60, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 'Jakarta', 4.9, 2341, 'a1000000-0000-0000-0000-000000000002'),
  ('Tas Selempang Kulit', 'Tas selempang wanita dari kulit sintetis premium, 3 kompartemen, tali adjustable.', 275000, 90, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop', 'Semarang', 4.4, 678, 'a1000000-0000-0000-0000-000000000003'),
  ('Dress Casual Floral', 'Dress casual motif floral, bahan rayon adem, all size fit to L.', 159000, 120, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=400&fit=crop', 'Bandung', 4.6, 445, 'a1000000-0000-0000-0000-000000000003'),
  ('Kopi Arabica Gayo 250g', 'Kopi arabica asli Gayo Aceh, roast level medium, aroma fruity dan chocolatey.', 89000, 300, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop', 'Aceh', 4.8, 3200, 'a1000000-0000-0000-0000-000000000004'),
  ('Matcha Latte Powder 500g', 'Bubuk matcha latte premium, tinggal seduh air panas/dingin. Isi 20 sachet.', 125000, 180, 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=400&h=400&fit=crop', 'Malang', 4.3, 1567, 'a1000000-0000-0000-0000-000000000004'),
  ('Diffuser Aromaterapi LED', 'Diffuser essential oil dengan lampu LED 7 warna, kapasitas 300ml, timer otomatis.', 199000, 70, 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=400&h=400&fit=crop', 'Jakarta', 4.5, 892, 'a1000000-0000-0000-0000-000000000005'),
  ('Yoga Mat Premium 8mm', 'Matras yoga anti-slip, tebal 8mm, bahan TPE eco-friendly. Gratis tas carrier.', 249000, 100, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop', 'Denpasar', 4.7, 1123, 'a1000000-0000-0000-0000-000000000006'),
  ('Dumbbell Set 20kg', 'Set dumbbell adjustable 20kg, grip karet anti-slip, cocok untuk home gym.', 525000, 45, 'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop', 'Surabaya', 4.6, 654, 'a1000000-0000-0000-0000-000000000006')
on conflict do nothing;
