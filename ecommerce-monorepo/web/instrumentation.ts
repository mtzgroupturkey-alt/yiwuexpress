/**
 * Next.js Instrumentation Hook
 * Runs once at server startup (before any request handler).
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Fix IPv6 fetch failures on Linux (Ubuntu 24.04 production).
    // Node.js on Linux defaults to IPv6 DNS (AAAA records first).
    // If the server lacks full IPv6 routing, all outbound fetch() calls to
    // external AI providers (openrouter.ai, llm.gcat.ir, etc.) fail silently.
    // Setting ipv4first ensures reliable outbound connectivity on the server.
    const dns = await import('dns')
    if (typeof dns.setDefaultResultOrder === 'function') {
      dns.setDefaultResultOrder('ipv4first')
    }
  }
}
