-- ============================================
-- Courses & Bookmarks for AI Skills
-- ============================================

-- Courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  instructor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'published')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, course_id)
);

-- Enable RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Courses: anyone can view published courses
CREATE POLICY "Anyone can view published courses"
  ON public.courses FOR SELECT
  USING (status = 'published');

-- Courses: content creators can view their own courses (any status) later – skip for now
-- (Will be added in Step 4)

-- Bookmarks: users can manage their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON public.bookmarks FOR SELECT
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own bookmarks"
  ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own bookmarks"
  ON public.bookmarks FOR DELETE
  USING (auth.uid()::text = user_id::text);

-- Seed sample published courses (for testing)
INSERT INTO public.courses (title, description, thumbnail_url, instructor_id, status)
VALUES
  ('Machine Learning พื้นฐาน', 'เรียนรู้พื้นฐาน Machine Learning ตั้งแต่ Data Preparation ไปจนถึง Model Evaluation', 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400', NULL, 'published'),
  ('Deep Learning with TensorFlow', 'สร้าง Neural Network ด้วย TensorFlow และ Keras', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400', NULL, 'published'),
  ('Python for Data Science', 'เริ่มต้นเขียน Python สำหรับงาน Data Science และการวิเคราะห์ข้อมูล', 'https://images.unsplash.com/photo-1515879218367-8466d910aeaf?w=400', NULL, 'published'),
  ('Generative AI และ LLMs', 'เรียนรู้การทำงานของ Large Language Models และ Generative AI', 'https://images.unsplash.com/photo-1677756119517-756a188d2d94?w=400', NULL, 'published')
ON CONFLICT DO NOTHING;