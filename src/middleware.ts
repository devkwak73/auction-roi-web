import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    // 1. 로그인하지 않은 사용자가 보호된 페이지에 접근할 경우
    if (!session && !req.nextUrl.pathname.startsWith('/auth')) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // 2. 로그인한 사용자의 경우 승인 상태 확인
    if (session) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_approved, is_admin')
            .eq('id', session.user.id)
            .single();

        // 관리자 페이지는 관리자만 접근 가능
        if (req.nextUrl.pathname.startsWith('/admin') && !profile?.is_admin) {
            return NextResponse.redirect(new URL('/', req.url));
        }

        // 미승인 사용자는 메인 서비스 이용 불가 (단, 로그아웃이나 승인대기 안내 페이지는 허용 필요할 수도 있음)
        // 여기서는 간단하게 '/' 제외한 모든 곳에서 승인 체크
        if (!profile?.is_approved && req.nextUrl.pathname !== '/waiting-approval' && !req.nextUrl.pathname.startsWith('/auth')) {
            return NextResponse.redirect(new URL('/waiting-approval', req.url));
        }
    }

    return res;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
