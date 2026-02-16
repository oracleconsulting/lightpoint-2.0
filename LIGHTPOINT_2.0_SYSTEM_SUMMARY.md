# Lightpoint 2.0 — System Summary

**Last updated:** 2026-02-16  
**Purpose:** Comprehensive reference for every file, migration, edge function, and system architecture in Lightpoint 2.0. For creating a Claude project for further detailed analysis. lightpoint-complaint-system is the OLD system; this document covers lightpoint-2.0.

**Read-only:** Do not edit unless explicitly requested. See `.cursor/rules/lightpoint-2.0-summary-readonly.mdc`.

**Summary folder:** `lightpoint-2.0/lightpoint-2.0-analysis` — flat copies of all pertinent files for Claude project analysis. Sync with `./scripts/sync-lightpoint-2.0-analysis-copies.sh`. Do not edit copies; see `.cursor/rules/lightpoint-2.0-analysis-readonly.mdc`.

---

## Summary

| Area | Role |
|------|------|
| **Platform** | AI-powered HMRC complaint management for UK accountancy practices |
| **Stack** | Next.js 14, tRPC, Supabase, OpenRouter, pgvector |
| **Core** | Complaints, letters (3-stage AI), documents, knowledge base, time tracking |
| **Content** | Blog, CPD, webinars, examples, social content, SEO |
| **Admin** | Super admin, pilots, customers, analytics, support tickets |
| **Infra** | Stripe, Resend, Upstash Redis, Supabase Edge Functions |

---

## System Architecture

```
Frontend: Next.js 14 (App Router) + React 18 + TypeScript
    ↓ tRPC (type-safe)
API: lib/trpc/router.ts + modular routers (complaints, letters, blog, cms, etc.)
    ↓
Supabase: PostgreSQL + pgvector + Auth + Storage
OpenRouter: Claude Opus/Sonnet/Haiku, OpenAI Ada-002, Cohere Rerank
Upstash: Redis (rate limiting, caching)
Stripe: Subscriptions, checkout
Resend: Transactional email
```

---

## Migrations (root migrations/)

| Path | Summary |
|------|---------|
| migrations/001_subscription_system.sql | Subscription tables |
| migrations/002_subscription_helpers.sql | Subscription helpers |
| migrations/003_rbac_and_admin_system.sql | RBAC, admin |
| migrations/004_cms_and_page_content.sql | CMS, page content |
| migrations/005_seed_homepage_content.sql | Homepage seed |
| migrations/006_waitlist_system.sql | Waitlist |
| migrations/007_stripe_integration.sql | Stripe |
| migrations/008_update_roi_section.sql | ROI section |
| migrations/009_update_trust_indicators.sql | Trust indicators |
| migrations/010_update_ctas_to_waitlist.sql | CTAs |
| migrations/011_delete_duplicate_trust_section.sql | Trust section fix |
| migrations/012_seed_sample_content_part1.sql | Sample content 1 |
| migrations/012_seed_sample_content_part2.sql | Sample content 2 |
| migrations/012_seed_sample_content_part3.sql | Sample content 3 |
| migrations/013_content_system_foundation.sql | Content foundation |
| migrations/014_storage_setup.sql | Storage |
| migrations/015_analytics_system.sql | Analytics |
| migrations/016_update_case_precedents_feature.sql | Case precedents |
| migrations/017_seed_resource_placeholders.sql | Resource placeholders |
| migrations/018_add_scheduled_publishing.sql | Scheduled publishing |
| migrations/019_social_content_system.sql | Social content |
| migrations/019_social_content_system_FIXED.sql | Social content fix |
| migrations/019_social_content_system_COMPLETE_FIX.sql | Social content complete fix |
| migrations/020_add_author_id_to_blog_posts.sql | Blog author |
| migrations/021_blog_templates.sql | Blog templates |
| migrations/022_structured_layout_storage.sql | Structured layout |
| migrations/check_homepage_data.sql | Homepage check |

---

## Migrations (supabase/migrations/)

| Path | Summary |
|------|---------|
| supabase/migrations/001_initial_schema.sql | Base schema (organizations, complaints, documents, KB, precedents, time_logs) |
| supabase/migrations/001_initial_schema_safe.sql | Safe variant |
| supabase/migrations/002_enhance_documents_and_timeline.sql | Documents: embeddings, document_type, match_complaint_documents |
| supabase/migrations/003_add_missing_complaint_columns.sql | complaint_type, hmrc_department |
| supabase/migrations/004_add_generated_letters_table.sql | generated_letters |
| supabase/migrations/005_add_analysis_storage.sql | complaints.analysis, complaint_context, analysis_completed_at |
| supabase/migrations/006_knowledge_base_expansion.sql | KB expansion |
| supabase/migrations/20241203_audit_logs.sql | Audit logs |
| supabase/migrations/20241203_mfa.sql | MFA |
| supabase/migrations/20241203_job_queue.sql | Job queue |

---

## Supabase Setup SQL (supabase/*.sql)

| Path | Summary |
|------|---------|
| supabase/COMPLETE_SETUP.sql | Full setup |
| supabase/SETUP_USER_MANAGEMENT.sql | User management |
| supabase/SETUP_COMPLAINT_ASSIGNMENTS.sql | complaint_assignments |
| supabase/SETUP_TIME_TRACKING.sql | Time tracking |
| supabase/SETUP_TIME_TRACKING_SIMPLE.sql | Simple time tracking |
| supabase/SETUP_TIME_TRACKING_ULTRA_SIMPLE.sql | Ultra-simple |
| supabase/SETUP_TIME_TRACKING_FINAL.sql | Final time tracking |
| supabase/SETUP_KNOWLEDGE_BASE_MANAGEMENT.sql | KB staging, updates |
| supabase/SETUP_AI_PROMPT_MANAGEMENT.sql | ai_prompts |
| supabase/SETUP_KB_CHAT.sql | KB chat |
| supabase/SETUP_BLOG_ENGAGEMENT.sql | Blog engagement |
| supabase/SETUP_PILOT_INVITE_SYSTEM.sql | Pilot invites |
| supabase/SETUP_SUPERADMIN_ROLES.sql | Superadmin |
| supabase/UPDATE_BLOG_WITH_CORRECT_LAYOUT.sql | Blog layout |
| supabase/CREATE_SEO_METADATA.sql | SEO metadata |
| supabase/ADD_BLOG_IMAGES.sql | Blog images |
| supabase/ADD_CASE_OUTCOMES.sql | Case outcomes |
| supabase/ADD_PILOT_STATUS.sql | Pilot status |
| supabase/ADD_SUPPORT_TICKETS.sql | Support tickets |
| supabase/ADD_GAMMA_COLUMNS.sql | Gamma columns |
| supabase/ADD_REAL_METRICS_FIELDS.sql | Metrics |
| supabase/ADD_BILLABLE_TIME_TRACKING.sql | Billable time |
| supabase/FIX_TIME_LOGS_TABLE.sql | Time logs fix |
| supabase/FIX_VECTOR_DIMENSIONS.sql | Vector dimensions |
| supabase/FIX_PLATFORM_STATISTICS_NULL.sql | Platform stats |
| supabase/FIX_LIGHTPOINT_SUPERADMIN.sql | Superadmin fix |
| supabase/FIX_JHOWARD_ONBOARDING.sql | Onboarding fix |
| supabase/FIX_CTA_LINKS.sql | CTA links |
| supabase/APPLY_V2_LAYOUT.sql | V2 layout |
| supabase/PROPER_V2_LAYOUT.sql | Proper V2 layout |
| supabase/COMPLETE_V2_LAYOUT.sql | Complete V2 layout |
| supabase/RESTORE_FULL_CONTENT.sql | Content restore |
| supabase/DEBUG_BLOG_STATUS.sql | Blog debug |
| supabase/APPLY_V2_LAYOUT_NOW.sql | Apply V2 layout |
| supabase/ADD_MISSING_TIME_LOGS.sql | Time logs |
| supabase/SAFE_TIME_ADJUSTMENT.sql | Safe adjustment |
| supabase/CLEAN_DUPLICATE_TIME_LOGS.sql | Duplicate cleanup |
| supabase/RUN_ANALYSIS_LOCK_MIGRATION.sql | Analysis lock |
| supabase/RUN_THIS_IN_SUPABASE.sql | Run utility |
| supabase/RESET_ONBOARDING_STATUS.sql | Onboarding reset |
| supabase/KNOWLEDGE_BASE_HEALTH_CHECK.sql | KB health |
| supabase/UNDO_DELIVERY_MANAGEMENT.sql | Delivery undo |
| supabase/CREATE_ADMIN_USER.sql | Admin user |
| supabase/CHECK_KB_TIMELINE.sql | KB timeline |

---

## Edge Functions (Supabase)

| Path | Summary |
|------|---------|
| supabase/functions/auto-publish-posts/index.ts | Cron: publish scheduled blog posts when scheduled_for arrives |
| supabase/functions/publish-social-content/index.ts | Cron: publish scheduled social media (Buffer, Twitter, LinkedIn, Facebook) |

---

## tRPC Routers (lib/trpc/)

| Router | Path | Summary |
|--------|------|---------|
| Main | lib/trpc/router.ts | App router; mounts all sub-routers + inline complaints, analysis, letters, documents, time, knowledge, aiSettings, kbChat, users, tickets |
| pilot | lib/trpc/routers/pilot.ts | Pilot onboarding, activation |
| subscription | lib/trpc/routers/subscription.ts | Subscription management |
| analytics | lib/trpc/routers/analytics.ts | Analytics, statistics |
| admin | lib/trpc/routers/admin.ts | Superadmin, customers |
| cms | lib/trpc/routers/cms.ts | CMS content |
| blog | lib/trpc/routers/blog.ts | Blog CRUD |
| cpd | lib/trpc/routers/cpd.ts | CPD articles |
| webinars | lib/trpc/routers/webinars.ts | Webinars |
| examples | lib/trpc/routers/examples.ts | Worked examples |
| socialContent | lib/trpc/routers/socialContent.ts | Social content generation |
| complaints | lib/trpc/routers/complaints.ts | Complaints (extracted) |
| documents | lib/trpc/routers/documents.ts | Documents |
| time | lib/trpc/routers/time.ts | Time tracking |
| tickets | lib/trpc/routers/tickets.ts | Support tickets |
| dashboard | lib/trpc/routers/dashboard.ts | dashboardRouter, managementRouter |
| letters | lib/trpc/routers/letters.ts | Letter generation |
| knowledge | lib/trpc/routers/knowledge.ts | Knowledge base |
| users | lib/trpc/routers/users.ts | Users |

---

## API Routes (app/api/)

| Path | Summary |
|------|---------|
| app/api/trpc/[trpc]/route.ts | tRPC handler |
| app/api/health/route.ts | Health check |
| app/api/documents/upload/route.ts | Document upload |
| app/api/complaints/generate-letter-stream/route.ts | Streaming letter generation |
| app/api/blog/generate-layout-v2/route.ts | Blog layout v2 |
| app/api/blog/generate-layout-ai/route.ts | AI layout generation |
| app/api/blog/generate-layout/route.ts | Layout generation |
| app/api/blog/generate-full/route.ts | Full blog generation |
| app/api/blog/generate-images/route.ts | Image generation |
| app/api/blog/generate-gamma/route.ts | Gamma layout |
| app/api/blog/transform-visual/route.ts | Visual transform |
| app/api/blog/transform-visual-v6/route.ts | Visual transform v6 |
| app/api/blog/analyze-image/route.ts | Image analysis |
| app/api/admin/reembed/route.ts | Re-embed content |
| app/api/admin/ingest-hmrc-manuals/route.ts | HMRC ingestion |
| app/api/admin/fix-user-org/route.ts | Fix user org |
| app/api/invites/accept/route.ts | Accept invite |
| app/api/invites/verify/route.ts | Verify invite |
| app/api/stripe/create-checkout/route.ts | Stripe checkout |
| app/api/stripe/create-portal/route.ts | Stripe portal |
| app/api/webhooks/stripe/route.ts | Stripe webhook |
| app/api/openapi/route.ts | OpenAPI spec |
| app/api/docs/route.ts | Docs |

---

## App Pages (app/)

| Path | Summary |
|------|---------|
| app/page.tsx | Home |
| app/layout.tsx | Root layout |
| app/login/page.tsx | Login |
| app/logout/page.tsx | Logout |
| app/auth/callback/route.ts | Auth callback |
| app/dashboard/page.tsx | Dashboard |
| app/dashboard/analytics/page.tsx | User analytics |
| app/complaints/new/page.tsx | New complaint |
| app/complaints/[id]/page.tsx | Complaint detail |
| app/knowledge/page.tsx | Knowledge browser |
| app/knowledge-base/page.tsx | KB management |
| app/management/page.tsx | Management |
| app/settings/page.tsx | Settings |
| app/settings/ai/page.tsx | AI settings |
| app/users/page.tsx | Users |
| app/user/dashboard/page.tsx | User dashboard |
| app/accept-invite/page.tsx | Accept invite |
| app/pricing/page.tsx | Pricing |
| app/blog/page.tsx | Blog listing |
| app/blog/[slug]/page.tsx | Blog post |
| app/blog/[slug]/layout.tsx | Blog layout |
| app/blog/rss.xml/route.ts | RSS |
| app/cpd/page.tsx | CPD |
| app/examples/page.tsx | Examples |
| app/webinars/page.tsx | Webinars |
| app/webinars/[slug]/page.tsx | Webinar detail |
| app/subscription/checkout/page.tsx | Checkout |
| app/subscription/success/page.tsx | Success |
| app/sitemap.xml/route.ts | Sitemap |
| app/robots.txt/route.ts | Robots |
| app/llms.txt/route.ts | LLM crawler guidance |
| app/demo/timeline/page.tsx | Demo timeline |
| app/admin/page.tsx | Admin home |
| app/admin/layout.tsx | Admin layout |
| app/admin/blog/page.tsx | Blog admin |
| app/admin/blog/new/page.tsx | New blog |
| app/admin/blog/edit/[id]/page.tsx | Edit blog |
| app/admin/seo/page.tsx | SEO |
| app/admin/content/page.tsx | Content |
| app/admin/customers/page.tsx | Customers |
| app/admin/pilots/page.tsx | Pilots |
| app/admin/tickets/page.tsx | Tickets |
| app/admin/analytics/page.tsx | Analytics |
| app/admin/social-content/page.tsx | Social content |
| app/admin/examples/page.tsx | Examples |
| app/admin/examples/new/page.tsx | New example |
| app/admin/examples/edit/[id]/page.tsx | Edit example |
| app/admin/webinars/page.tsx | Webinars |
| app/admin/webinars/new/page.tsx | New webinar |
| app/admin/webinars/edit/[id]/page.tsx | Edit webinar |
| app/admin/cpd/page.tsx | CPD |
| app/admin/cpd/new/page.tsx | New CPD |
| app/admin/cpd/edit/[id]/page.tsx | Edit CPD |
| app/admin/waitlist/page.tsx | Waitlist |
| app/admin/tiers/page.tsx | Tiers |
| app/admin/settings/page.tsx | Admin settings |
| app/admin-check/page.tsx | Admin check |
| app/admin-debug/page.tsx | Admin debug |

---

## Libraries (lib/)

| Path | Summary |
|------|---------|
| lib/trpc/router.ts | Main tRPC router |
| lib/trpc/trpc.ts | tRPC init |
| lib/trpc/Provider.tsx | tRPC provider |
| lib/supabase/client.ts | Supabase client |
| lib/openrouter/client.ts | OpenRouter — analyzeComplaint, generateComplaintLetter, generateResponse |
| lib/openrouter/three-stage-client.ts | 3-stage letter pipeline |
| lib/openrouter/follow-up-client.ts | Follow-up generation |
| lib/documentProcessor.ts | Document processing, OCR |
| lib/documentAnalysis.ts | Document analysis |
| lib/embeddings.ts | Embeddings (Ada-002) |
| lib/vectorSearch.ts | searchKnowledgeBase, searchPrecedents |
| lib/search/hybridSearch.ts | Vector + BM25 hybrid |
| lib/contextManager.ts | prepareAnalysisContext, estimateTokens |
| lib/privacy.ts | sanitizeForLLM |
| lib/timeTracking.ts | logTime |
| lib/timeCalculations.ts | Time calculations |
| lib/practiceSettings.ts | Practice settings |
| lib/modelConfig.ts | AI model config |
| lib/logger.ts | Logging |
| lib/sanitize.ts | Input sanitization |
| lib/outcomeAnalysis.ts | Complaint outcomes |
| lib/knowledgeBaseChat.ts | KB chat |
| lib/knowledgeComparison.ts | Document comparison |
| lib/kbDocumentProcessor.ts | KB processing |
| lib/blog/extractionPipeline.ts | Blog extraction |
| lib/blog/imageGeneration.ts | Image generation |
| lib/blog/themes.ts | Blog themes |
| lib/ai/socialContentGenerator.ts | Social content AI |
| lib/gamma/client.ts | Gamma API |
| lib/ingestion/hmrcIngestionService.ts | HMRC ingestion |
| lib/ingestion/hmrcChunking.ts | Chunking |
| lib/ingestion/hmrcManualCrawler.ts | Manual crawler |
| lib/ingestion/index.ts | Ingestion index |
| lib/ingestion/types.ts | Ingestion types |
| lib/config/embeddingConfig.ts | Embedding config |
| lib/email/service.ts | Resend email |
| lib/audit/auditLog.ts | Audit logging |
| lib/security/encryption.ts | Encryption |
| lib/security/mfa.ts | MFA |
| lib/security/apiKeys.ts | API keys |
| lib/security/apiRateLimit.ts | Rate limiting |
| lib/rateLimit/middleware.ts | Upstash rate limit |
| lib/performance/edgeCaching.ts | Edge caching |
| lib/performance/responseCache.ts | Response cache |
| lib/performance/parallelAI.ts | Parallel AI |
| lib/queue/jobQueue.ts | Job queue |
| lib/scalability/redisQueue.ts | Redis queue |
| lib/scalability/multiRegion.ts | Multi-region |
| lib/cdn/cloudflare.ts | Cloudflare CDN |
| lib/finetuning/dataCollection.ts | Finetuning data |
| lib/docs/openapi.ts | OpenAPI |
| lib/trpc/contentHelpers.ts | Content helpers |
| lib/utils.ts | Utilities |

---

## Components

| Path | Summary |
|------|---------|
| components/Navigation.tsx | Navigation |
| components/PilotGate.tsx | Pilot gate |
| components/AnimatedElements.tsx | Animations |
| components/AnimatedCounter.tsx | Animated counter |
| components/HeroEffects.tsx | Hero effects |
| components/HeroDashboardPreview.tsx | Hero preview |
| components/SocialProofSection.tsx | Social proof |
| components/LivePlatformStats.tsx | Platform stats |
| components/ResourceShowcase.tsx | Resource showcase |
| components/ResourcePageComponents.tsx | Resource page |
| components/MediaLibrary.tsx | Media library |
| components/RichTextEditor.tsx | Rich text |
| components/CloudflareStreamPlayer.tsx | Video player |
| components/complaint/ComplaintWizard.tsx | Complaint wizard |
| components/complaint/StartComplaint.tsx | Start complaint |
| components/complaint/DocumentUploader.tsx | Document upload |
| components/complaint/DocumentViewer.tsx | Document viewer |
| components/complaint/TimelineView.tsx | Timeline |
| components/complaint/StatusManager.tsx | Status |
| components/complaint/AssignComplaint.tsx | Assign |
| components/complaint/TimeTracker.tsx | Time tracking |
| components/complaint/LetterManager.tsx | Letter manager |
| components/complaint/LetterPreview.tsx | Letter preview |
| components/complaint/FormattedLetter.tsx | Formatted letter |
| components/complaint/ResponseUploader.tsx | Response upload |
| components/complaint/FollowUpManager.tsx | Follow-up |
| components/complaint/BatchAssessment.tsx | Batch assessment |
| components/complaint/CloseComplaintDialog.tsx | Close dialog |
| components/complaint/OCRFailureCard.tsx | OCR failure |
| components/analysis/PrecedentMatcher.tsx | Precedent matcher |
| components/analysis/ViolationChecker.tsx | Violation checker |
| components/analysis/ReAnalysisPrompt.tsx | Re-analysis |
| components/dashboard/OnboardingBanner.tsx | Onboarding banner |
| components/dashboard/HeroMetrics.tsx | Hero metrics |
| components/blog/VisualTransformer.tsx | Visual transformer |
| components/blog/BlogEngagement.tsx | Engagement |
| components/blog/BlogJsonLd.tsx | JSON-LD SEO |
| components/blog/GammaEmbed.tsx | Gamma embed |
| components/blog/DynamicGammaRenderer.tsx | Gamma renderer |
| components/blog/AILayoutGenerator.tsx | AI layout |
| components/blog/IntelligentLayoutWeaver.tsx | Layout weaver |
| components/blog/OneClickBlogGenerator.tsx | One-click gen |
| components/blog/VisualLayoutEditor.tsx | Layout editor |
| components/blog/DynamicLayoutRenderer.tsx | Layout renderer |
| components/blog/AIImageImport.tsx | AI image import |
| components/blog/ChartComponents.tsx | Charts |
| components/blog/TemplateBlocks.tsx | Template blocks |
| components/blog/SocialShare.tsx | Social share |
| components/blog/RelatedPosts.tsx | Related posts |
| components/blog-v2/BlogRenderer.tsx | Blog renderer v2 |
| components/blog-v2/index.ts | Index |
| components/blog-v2/hmrcComplaintsLayout.ts | HMRC layout |
| components/blog-v2/exampleLayout.ts | Example layout |
| components/blog-v2/themeTokens.ts | Theme tokens |
| components/blog-v2/components/HeroSection.tsx | Hero |
| components/blog-v2/components/StatsRow.tsx | Stats |
| components/blog-v2/components/DonutChart.tsx | Donut |
| components/blog-v2/components/Timeline.tsx | Timeline |
| components/blog-v2/components/CalloutBox.tsx | Callout |
| components/blog-v2/components/QuoteBlock.tsx | Quote |
| components/blog-v2/components/ComparisonCards.tsx | Comparison |
| components/blog-v2/components/ThreeColumnCards.tsx | Three column |
| components/blog-v2/components/NumberedSteps.tsx | Numbered steps |
| components/blog-v2/components/TextWithImage.tsx | Text + image |
| components/blog-v2/components/SectionWrapper.tsx | Section wrapper |
| components/blog-v2/components/HorizontalBars.tsx | Horizontal bars |
| components/blog-v2/components/LetterTemplate.tsx | Letter template |
| components/blog-v2/components/UtilityComponents.tsx | Utilities |
| components/blog-v2/components/index.ts | Index |
| components/blog-v2/utils/layoutGenerator.ts | Layout generator |
| components/blog-v2/utils/sectionDetector.ts | Section detector |
| components/blog-v2/utils/sectionGrouper.ts | Section grouper |
| components/blog-v2/utils/aiLayoutGenerator.ts | AI layout |
| components/blog-v2/utils/autoImageGenerator.ts | Auto images |
| components/blog-v2/utils/index.ts | Utils index |
| components/blog-v2/types.ts | Types |
| components/blog/gamma/* | Gamma visual components |
| components/admin/BlogPostForm.tsx | Blog form |
| components/admin/CPDForm.tsx | CPD form |
| components/admin/ExampleForm.tsx | Example form |
| components/admin/WebinarForm.tsx | Webinar form |
| components/ui/* | shadcn (button, input, card, dialog, etc.) |

---

## Contexts, Hooks, Scripts, Tests

| Path | Summary |
|------|---------|
| contexts/AuthContext.tsx | Auth |
| contexts/UserContext.tsx | User |
| hooks/useLetterGenerationStream.ts | Letter streaming |
| scripts/generate-blog-images.ts | Blog images |
| scripts/regenerate-blog-v2-layout.ts | Regenerate layout |
| scripts/test-knowledge-base.ts | KB test |
| scripts/test-ingestion.ts | Ingestion test |
| scripts/reembed-existing-content.ts | Re-embed |
| scripts/get-gamma-themes.ts | Gamma themes |
| __tests__/setup.ts | Test setup |
| __tests__/lib/*.test.ts | Unit tests |
| __tests__/integration/*.test.ts | Integration tests |
| e2e/auth.spec.ts | E2E auth |
| e2e/public-pages.spec.ts | E2E public |

---

## Key Documentation

| Path | Summary |
|------|---------|
| SYSTEM_OVERVIEW.md | Full system overview |
| BLOG_V2_SYSTEM_OVERVIEW.md | Blog v2 layout system |
| docs/MULTI_TENANT_SAAS_ARCHITECTURE.md | Multi-tenant SaaS |
| docs/KNOWLEDGE_BASE_ARCHITECTURE.md | KB architecture |
| AI_PROMPTS_DOCUMENTATION.md | AI prompts |
| LLM_MODELS_DOCUMENTATION.md | LLM models |
| GAMMA_VISUAL_SYSTEM_OVERVIEW.md | Gamma system |
| PRODUCTION_SETUP.md | Production |
| HOW_TO_SEE_LOGS.md | Logging |

---

## Database Tables (Key)

organizations, user_profiles, lightpoint_users, complaints, documents, generated_letters, time_logs, complaint_assignments, knowledge_base, knowledge_base_staging, precedents, support_tickets, blog_posts, blog_comments, blog_likes, seo_metadata, organization_invites, subscription_tiers, social_content_posts, analytics_events, cpd_articles, webinars, worked_examples, ai_prompts, audit_logs, job_queue.

---

## AI Pipeline (Complaint Letters)

Stage 0: Claude Sonnet 4.5 — Initial analysis. Stage 1: Claude Haiku — Fact extraction. Stage 2: Claude Sonnet — Letter structure. Stage 3: Claude Opus — Professional tone. Supporting: searchKnowledgeBaseMultiAngle, searchPrecedents, sanitizeForLLM.

---

## Env Variables

NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, OPENROUTER_API_KEY, OPENAI_API_KEY, NEXT_PUBLIC_APP_URL, STRIPE_*, RESEND_*, UPSTASH_*, BUFFER_* (for social), etc.

---

*Read-only reference. Edit live code in lightpoint-2.0/. Update only when explicitly requested.*
