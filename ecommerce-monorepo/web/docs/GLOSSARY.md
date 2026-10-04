# AUTO-PILOT Key Terminology Glossary (واژه‌نامه اصطلاحات تخصصی)

This glossary provides definitions, system roles, and architectural significance for core terms in Auto-Pilot.

---

### Core Terms (واژگان پایه)

#### 1. Council of Rivals (شورای ناظر سه‌گانه)
- **English:** A multi-perspective LLM reasoning framework comprised of three distinct agents: The Optimist (growth and expansion), The Pessimist (risk, security, and downside mitigation), and The Analyst (neutral, objective data synthesis). They debate complex situations to reach high-conviction arbitration.
- **فارسی:** یک ساختار استدلال چنددیدگاهی شامل سه هوش مصنوعی متمایز: خوش‌بین (رشد و فروش)، بدبین (ریسک و امنیت)، و تحلیل‌گر (سنتز بی‌طرف داده‌ها) که برای تصمیم‌گیری‌های پیچیده مباحثه و اجماع برقرار می‌کنند.

#### 2. Probe (پروب کاوشگر داده)
- **English:** A lightweight, non-blocking telemetry query that extracts operational anomalies and health metrics from a specific operational department (e.g., finance, logistics, security) during each cycle.
- **فارسی:** کوئری‌های سبک و غیرمسدودکننده که در هر چرخه، شاخص‌های سلامت و ناهنجاری‌های دپارتمان‌ها را پایش و استخراج می‌کنند.

#### 3. Action (اقدام عملیاتی)
- **English:** An atomic, idempotent operational task registered in the action registry. Actions execute side-effects (e.g., blocking an IP, pausing ad campaigns, issuing notifications) with risk gating (`auto`, `approve`, `block`).
- **فارسی:** عملیات اتمیک و بازگشت‌پذیر که در رجیستری سیستم ثبت شده و تغییراتی مانند مسدودسازی آی‌پی مخرب یا توقف کمپین تبلیغاتی را اعمال می‌کند.

#### 4. DAG (Directed Acyclic Graph / گراف بدون دور جهت‌دار)
- **English:** The topological graph determining safe execution order and dependencies among action tasks during a cycle run, preventing circular dependencies and deadlocks.
- **فارسی:** مدل گراف جهت‌دار بدون چرخه برای تعیین ترتیب امن اجرای اقدامات اجرایی و رعایت وابستگی‌ها بین آن‌ها.

#### 5. SLA Gate (دروازه توافق‌نامه سطح خدمات)
- **English:** A policy-driven boundary condition that triggers proactive intervention when time-to-fulfillment, customer reply time, or logistics milestones violate acceptable operational thresholds.
- **فارسی:** شرایط آستانه‌ای خط‌مشی که در صورت تاخیر تحویل یا پاسخ‌دهی به مشتریان فراتر از حد مجاز، هشدار و اقدامات تسریع‌کننده صادر می‌کند.

#### 6. Kill Switch (کلید قطع اضطراری)
- **English:** A double-guarded emergency circuit breaker that immediately halts all or department-scoped autonomous action execution across the entire platform.
- **فارسی:** مدار قطع اضطراری که فوراً تمام یا بخشی از عملیات‌های خودکار سیستم را در صورت بروز شرایط غیرعادی متوقف می‌کند.

#### 7. Action Storm Prevention (جلوگیری از طوفان عملیاتی)
- **English:** Frequency and burst throttling safeguards (per-action rate limits, sliding windows, and cooldown periods) that prevent duplicate or cascading action execution within short timeframes.
- **فارسی:** مکانیزم پیشگیری از تکرار انبوه اقدامات خودکار در پنجره‌های زمانی کوتاه با کنترل نرخ، سقف تعداد و دوره‌های آرام‌سازی.

#### 8. Compensating Transaction / Rollback (تراکنش جبرانی / بازگردانی)
- **English:** An inverse action executed to cleanly undo changes made by an executed action (e.g., unblocking an IP, releasing a stock reservation) in case of false alarm or manual rollback.
- **فارسی:** اقدام معکوس جهت خنثی‌سازی و بازگردانی تمیز تغییرات اعمال‌شده توسط یک عملیات در صورت هشدار اشتباه یا درخواست مدیر.

#### 9. Self-Improvement Loop (حلقه یادگیری و بهبود خودکار)
- **English:** The memory and retrospective feedback subsystem that records action outcomes, evaluates success/failure vectors, and adjusts future policy weights dynamically.
- **فارسی:** زیرسیستم حافظه و بازنگری که نتایج اقدامات را ذخیره کرده و وزن سیاست‌ها و ضرایب ریسک را برای چرخه‌های آینده بهینه‌سازی می‌کند.

#### 10. Cost Guard (نگهبان هزینه و بودجه)
- **English:** A 3-tier financial gatekeeper that meters daily LLM token expenditures, selects cost-efficient models (e.g., Gemini 2.5 Flash), and gracefully degrades to lightweight heuristic models if budget limits are reached.
- **فارسی:** سیستم سه سطحی پایش و سقف‌گذاری هزینه‌های مدل‌های هوش مصنوعی که بر اساس مصرف بودجه، به صورت هوشمند مدل‌های ارزان‌تر و سریع‌تر را انتخاب می‌کند.
