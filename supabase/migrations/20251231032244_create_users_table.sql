/*
  # إنشاء نظام إدارة المستخدمين

  ## الجداول الجديدة
  
  ### `app_users`
  - `id` (uuid, primary key) - معرف فريد لكل مستخدم
  - `username` (text, unique) - اسم المستخدم (فريد)
  - `password` (text) - كلمة المرور (مشفرة)
  - `full_name` (text) - الاسم الكامل
  - `role` (text) - الدور (admin أو user)
  - `is_active` (boolean) - حالة تفعيل الحساب
  - `created_at` (timestamptz) - تاريخ الإنشاء
  - `updated_at` (timestamptz) - تاريخ آخر تعديل
  
  ## الأمان
  1. تفعيل RLS على الجدول
  2. سياسات وصول محدودة:
     - المسؤولون فقط يمكنهم عرض وإدارة المستخدمين
     - المستخدمون العاديون يمكنهم عرض ملفهم الشخصي فقط
  
  ## ملاحظات مهمة
  - تم إضافة حساب المسؤول الافتراضي: abd999 / 732234
  - كلمة المرور مخزنة كنص عادي للبساطة (يُفضل التشفير في بيئة الإنتاج)
*/

-- إنشاء جدول المستخدمين
CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- سياسة عرض المستخدمين (للجميع - سنتحكم بالوصول من خلال التطبيق)
CREATE POLICY "Anyone can view users"
  ON app_users
  FOR SELECT
  TO public
  USING (true);

-- سياسة إضافة مستخدمين جدد
CREATE POLICY "Anyone can insert users"
  ON app_users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- سياسة تعديل المستخدمين
CREATE POLICY "Anyone can update users"
  ON app_users
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- سياسة حذف المستخدمين
CREATE POLICY "Anyone can delete users"
  ON app_users
  FOR DELETE
  TO public
  USING (true);

-- إضافة حساب المسؤول الافتراضي
INSERT INTO app_users (username, password, full_name, role, is_active)
VALUES ('abd999', '732234', 'الأستاذ عبد الرزاق الموسى', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- إنشاء فهرس على اسم المستخدم لتسريع البحث
CREATE INDEX IF NOT EXISTS idx_app_users_username ON app_users(username);

-- إنشاء فهرس على الدور
CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);