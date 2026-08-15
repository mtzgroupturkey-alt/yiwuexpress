export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { gitPull, gitPush, gitCommit, gitCommitAndPush, gitCheckout, gitCreateBranch, gitLog, gitBranches } from '@/lib/deploy/git';

export async function POST(request: Request) {
  try {
    const { action, message, files, branch, checkout } = await request.json();

    let result: any;

    switch (action) {
      case 'pull':
        result = await gitPull();
        break;

      case 'push':
        result = await gitCommitAndPush(message);
        break;

      case 'commit':
        if (!message) {
          return NextResponse.json({ error: 'Commit message required' }, { status: 400 });
        }
        result = await gitCommit(message, files);
        break;

      case 'checkout':
        if (!branch) {
          return NextResponse.json({ error: 'Branch name required' }, { status: 400 });
        }
        result = await gitCheckout(branch);
        break;

      case 'create-branch':
        if (!branch) {
          return NextResponse.json({ error: 'Branch name required' }, { status: 400 });
        }
        result = await gitCreateBranch(branch, checkout);
        break;

      case 'log':
        result = await gitLog(20);
        break;

      case 'branches':
        result = await gitBranches();
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
