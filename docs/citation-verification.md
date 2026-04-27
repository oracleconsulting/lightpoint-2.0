# Citation Verification

Citation verification is handled by:

- `lib/citationVerification/parser.ts`
- `lib/citationVerification/bailiiClient.ts`
- `lib/citationVerification/verifier.ts`
- `lib/trpc/routers/citationVerification.ts`

Supported citation shapes include:

- `[2019] EWHC 1327 (Admin)`
- `[2016] EWCA Civ 15`
- `[2015] UKFTT 8 (TC)`
- `[2024] UKFTT 564 (TC)`
- `[2021] UKUT 245 (TCC)`

Verification flow:

1. Parse the neutral citation.
2. Check `citation_verification_cache`.
3. Fetch the expected BAILII URL if cache is absent or expired.
4. Compare fetched case name with any claimed case name.
5. Cache the result for 90 days.

Generated outputs call verification before saving. If any citation is not verified, output generation is blocked.
