-- 1단계: 기존 Auth 사용자 확인
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- 2단계: Auth 사용자를 profiles 테이블에 복사
INSERT INTO public.profiles (id, email, is_approved, is_admin)
SELECT 
    id, 
    email,
    TRUE,  -- 기존 사용자는 자동 승인
    FALSE
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 3단계: 확인
SELECT * FROM public.profiles;
