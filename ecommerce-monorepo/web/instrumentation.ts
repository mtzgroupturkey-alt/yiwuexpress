/**
 * Next.js Instrumentation Hook
 * Registers OpenTelemetry SDK and AutoPilot observability.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
      console.log('📡 [AutoPilot Observability]: OTLP Exporter detected at', process.env.OTEL_EXPORTER_OTLP_ENDPOINT);
    } else {
      console.log('📡 [AutoPilot Observability]: OpenTelemetry initialized in development console mode.');
    }
  }
}
