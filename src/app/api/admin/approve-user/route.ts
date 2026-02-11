import { createClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userIds } = body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ error: '승인할 사용자 ID 목록이 필요합니다.' }, { status: 400 });
        }

        // 1. 요청자가 관리자인지 확인 (보안)
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();

        if (!profile?.is_admin) {
            return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 });
        }

        // 2. Service Role Key로 Admin Client 생성 (RLS 우회)
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
            console.error('SUPABASE_SERVICE_ROLE_KEY is missing');
            return NextResponse.json({ error: '서버 설정 오류: 관리자 키가 없습니다.' }, { status: 500 });
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // 3. 사용자 승인 처리 (is_approved = true)
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ is_approved: true })
            .in('id', userIds);

        if (updateError) {
            console.error('User approval error:', updateError);
            return NextResponse.json({ error: '승인 처리 실패: ' + updateError.message }, { status: 500 });
        }

        return NextResponse.json({ message: '성공적으로 승인되었습니다.' });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
    }
}
