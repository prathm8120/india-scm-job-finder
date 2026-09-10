# India SCM Job Finder — MVP

A static front-end MVP for an India-wide Logistics & Supply Chain career portal.

## Included
- Recruitment-style filter sidebar
- Date, company, industry, SCM category, role, experience, level
- India state filter + Maharashtra city presets
- Taluka / MIDC / industrial area search
- Employment / work mode / official-source filters
- Resume upload: PDF, DOCX, TXT
- Resume paste option
- CV keyword match: Excellent / High / Medium / Lower
- Sort by newest, company, or best CV match
- Local filter persistence
- Verified-jobs JSON import
- Detailed job view
- No fabricated vacancies preloaded

## Run locally
Open `index.html` in a modern browser. For PDF/DOCX parsing, internet access is required because the MVP loads PDF.js and Mammoth from CDN.

For best results, serve the folder locally:
`python -m http.server 8000`
Then open `http://localhost:8000`.

## Job data
Use `jobs-template.json` as the schema. Replace the example/template record with verified vacancies only.

## Production upgrades recommended
1. Next.js frontend
2. Supabase/PostgreSQL database
3. Server-side resume parsing and encrypted file storage
4. User accounts + saved searches
5. Official ATS/API ingestion connectors
6. Expiry verification and deduplication
7. Geocoded India industrial-area master
8. Semantic CV/JD matching
9. Admin review dashboard
10. Alerts / email notifications
