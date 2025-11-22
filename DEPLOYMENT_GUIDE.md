# 🚀 Deployment Guide - Lightpoint 2.0

**Ready to deploy!** ✅ All features complete and tested.

---

## Quick Deploy Options

### Option 1: Vercel (Recommended - 5 minutes)

**Why Vercel?**
- Built for Next.js (created by the Next.js team)
- Zero configuration
- Automatic HTTPS
- Global CDN
- Free tier available

**Steps:**

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy from your project:**
```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/lightpoint-2.0
vercel
```

3. **Follow prompts:**
   - Link to existing project or create new
   - Set project name: `lightpoint-2.0`
   - Accept defaults
   - ✅ Done! You'll get a URL like `lightpoint-2-0.vercel.app`

4. **Set Environment Variables in Vercel Dashboard:**
   - Go to vercel.com → Your Project → Settings → Environment Variables
   - Add these:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
     ```

5. **Redeploy:**
```bash
vercel --prod
```

**Custom Domain:**
- Go to Vercel Dashboard → Settings → Domains
- Add `lightpoint.uk` or any domain
- Follow DNS instructions

---

### Option 2: Netlify (Alternative - 5 minutes)

**Steps:**

1. **Install Netlify CLI:**
```bash
npm i -g netlify-cli
```

2. **Build the project:**
```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/lightpoint-2.0
npm run build
```

3. **Deploy:**
```bash
netlify deploy --prod
```

4. **Set Environment Variables:**
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Add same variables as Vercel above

---

### Option 3: Self-Hosted (VPS/Cloud)

**Requirements:**
- Node.js 18+
- PM2 or similar process manager
- Nginx (reverse proxy)
- SSL certificate (Let's Encrypt)

**Steps:**

1. **Build the project:**
```bash
npm run build
```

2. **Start production server:**
```bash
npm start
```

3. **Use PM2 for process management:**
```bash
npm i -g pm2
pm2 start npm --name "lightpoint" -- start
pm2 save
pm2 startup
```

4. **Configure Nginx:**
```nginx
server {
    listen 80;
    server_name lightpoint.uk;
    
    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **SSL with Let's Encrypt:**
```bash
sudo certbot --nginx -d lightpoint.uk
```

---

## Environment Variables Needed

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App Configuration
NEXT_PUBLIC_APP_URL=https://lightpoint.uk
NODE_ENV=production

# Optional - Redis (for caching)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Optional - Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## Pre-Deployment Checklist

✅ **Code Quality:**
- [x] All TypeScript errors resolved
- [x] All tests passing
- [x] SonarQube issues fixed (3/3)
- [x] Pre-commit hooks working

✅ **Database:**
- [x] All migrations run
- [x] RLS policies in place
- [x] Test data created (optional)

✅ **Features:**
- [x] CMS system working
- [x] Blog, CPD, Webinars, Examples pages
- [x] Navigation bar
- [x] SEO optimization
- [x] Mobile responsive
- [x] Tier-based access control

✅ **Configuration:**
- [ ] Environment variables set
- [ ] Custom domain configured
- [ ] SSL certificate installed
- [ ] Error monitoring (optional - Sentry)
- [ ] Analytics (optional - GA4)

---

## Post-Deployment Testing

### 1. Check All Pages Load:
```
✓ https://your-domain.com/
✓ https://your-domain.com/pricing
✓ https://your-domain.com/blog
✓ https://your-domain.com/cpd
✓ https://your-domain.com/webinars
✓ https://your-domain.com/examples
✓ https://your-domain.com/user/dashboard
```

### 2. Test SEO:
```
✓ https://your-domain.com/sitemap.xml
✓ https://your-domain.com/robots.txt
✓ Open Graph meta tags (share on social)
✓ Google Search Console
```

### 3. Test Functionality:
- [ ] Navigation works
- [ ] Login/signup flow
- [ ] Content loads from database
- [ ] Tier-based access control
- [ ] Mobile responsiveness

### 4. Performance:
```bash
# Test with Lighthouse
# Should score 90+ on all metrics
```

---

## Monitoring (Optional but Recommended)

### Error Tracking - Sentry
```bash
npm install @sentry/nextjs
```

Add to `next.config.js`:
```javascript
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig({
  // existing config
}, {
  silent: true,
  org: 'your-org',
  project: 'lightpoint',
});
```

### Analytics - Google Analytics 4
Add to `app/layout.tsx`:
```tsx
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
  strategy="afterInteractive"
/>
```

### Uptime Monitoring
- UptimeRobot (free)
- Pingdom
- StatusCake

---

## Troubleshooting

### Build Errors:
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Environment Variable Issues:
- Prefix public vars with `NEXT_PUBLIC_`
- Restart server after changes
- Check Vercel/Netlify dashboard

### Database Connection:
- Verify Supabase URL and keys
- Check RLS policies
- Test with Supabase dashboard

### Performance Issues:
- Enable caching (Upstash Redis)
- Optimize images (Next.js Image)
- Use CDN for static assets

---

## Rollback Plan

If something goes wrong:

**Vercel:**
```bash
# Deploy previous version
vercel --prod --force
```

**Git:**
```bash
# Revert to previous commit
git log  # find previous commit hash
git revert <commit-hash>
git push
```

---

## Success Metrics

**What to monitor:**
- Page load times (< 3s)
- Error rates (< 1%)
- User signups
- Content views
- Search rankings

**Tools:**
- Google Analytics
- Google Search Console
- Vercel Analytics
- Sentry (errors)

---

## 🎉 You're Ready!

**Everything is built and tested. Just:**
1. Choose a deployment platform (Vercel recommended)
2. Set environment variables
3. Deploy!

**Your platform is production-ready!** 🚀

---

## Quick Deploy Command (Vercel)

```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/lightpoint-2.0
vercel --prod
```

**That's it!** Your site will be live in < 2 minutes! 🎊

