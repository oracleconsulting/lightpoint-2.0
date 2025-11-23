# 🎥 Cloudflare Stream Integration Guide for Live Webinars

**Status:** ✅ Platform Ready - Awaiting Cloudflare Account Setup  
**Last Updated:** November 22, 2025

---

## 📋 OVERVIEW

Your webinar system is **100% ready** for Cloudflare Stream integration. All the necessary fields and infrastructure are in place. You just need to:

1. Set up your Cloudflare Stream account
2. Get your RTMP credentials
3. Configure OBS or streaming software
4. Test a live stream

---

## ✅ WHAT'S ALREADY BUILT

### **Webinar Form Fields:**
- ✅ `webinar_type` - Select "live" or "recorded"
- ✅ `status` - Set to "live" when streaming
- ✅ `video_url` - For recorded webinar playback
- ✅ `stream_url` - RTMP stream URL from Cloudflare
- ✅ `stream_key` - Secret stream key from Cloudflare
- ✅ `thumbnail_url` - Webinar preview image
- ✅ `scheduled_date` - When webinar goes live
- ✅ `duration_minutes` - Expected length
- ✅ `max_attendees` - Capacity limit

### **Database Schema:**
```sql
-- webinars table already has all fields needed
webinar_type: 'live' | 'recorded'
status: 'upcoming' | 'live' | 'completed' | 'cancelled'
stream_url: text (RTMP URL)
stream_key: text (secure key)
video_url: text (playback URL after stream)
```

### **Admin Interface:**
- ✅ Webinar creation/editing form
- ✅ Stream URL and key input fields
- ✅ Status selector (upcoming/live/completed)
- ✅ Type selector (live/recorded)
- ✅ Speaker info and scheduling

---

## 🚀 SETUP STEPS

### **Step 1: Create Cloudflare Stream Account**

1. Go to [Cloudflare Stream](https://www.cloudflare.com/products/cloudflare-stream/)
2. Sign up or log in to your Cloudflare account
3. Navigate to **Stream** in the dashboard
4. Enable **Stream Live**

**Pricing:**
- **Storage:** $5/month per 1,000 minutes stored
- **Delivery:** $1 per 1,000 minutes delivered
- **Live Streaming:** $1 per 1,000 minutes streamed

---

### **Step 2: Get Your RTMP Credentials**

1. In Cloudflare dashboard, go to **Stream** → **Live Inputs**
2. Click **Create Live Input**
3. Choose your settings:
   - **Mode:** Live (for real-time streaming)
   - **Recording:** Enable (to save for later playback)
   - **Reconnect Window:** 30 seconds (recommended)
4. Copy your credentials:
   - **RTMP URL:** `rtmp://live.cloudflare.com/live/`
   - **Stream Key:** `[your-unique-stream-key]`

**Example:**
```
RTMP URL: rtmp://live.cloudflare.com/live/
Stream Key: 1a2b3c4d5e6f7g8h9i0j
```

---

### **Step 3: Add RTMP Credentials to Webinar**

1. Log in to your admin panel
2. Go to **Admin** → **Webinars** → **New Webinar**
3. Fill in the form:
   - **Title:** "HMRC Complaints: Live Q&A Session"
   - **Webinar Type:** Live
   - **Status:** Upcoming (change to "Live" when streaming)
   - **Scheduled Date:** [Pick date/time]
   - **Stream URL:** `rtmp://live.cloudflare.com/live/`
   - **Stream Key:** `[your-stream-key]` (keep secret!)
   - **Max Attendees:** 100 (or 0 for unlimited)
4. Save the webinar

---

### **Step 4: Set Up OBS Studio (Streaming Software)**

#### **Download OBS:**
- Free and open-source: [obsproject.com](https://obsproject.com/)
- Available for Mac, Windows, Linux

#### **Configure OBS:**

1. Open OBS Studio
2. Go to **Settings** → **Stream**
3. **Service:** Custom
4. **Server:** `rtmp://live.cloudflare.com/live/`
5. **Stream Key:** `[your-stream-key-from-cloudflare]`
6. Click **OK**

#### **Set Up Your Scene:**

1. **Add Sources:**
   - **Video Capture Device** (your webcam)
   - **Display Capture** (screen share for slides)
   - **Text** (for title, speaker name)
   - **Image** (logo, branding)
2. **Audio:**
   - **Mic/Auxiliary Audio:** Your microphone
   - **Desktop Audio:** System sounds (optional)
3. **Arrange Layout:**
   - Position webcam, slides, overlays
   - Test audio levels

---

### **Step 5: Go Live!**

#### **Pre-Stream Checklist:**
- ✅ RTMP URL and Stream Key configured in OBS
- ✅ Webinar created in admin panel (status: "Upcoming")
- ✅ Test your audio/video
- ✅ Check internet connection (5+ Mbps upload recommended)
- ✅ Close unnecessary apps to reduce CPU load

#### **Start Streaming:**

1. **In OBS:** Click **Start Streaming**
2. **In Admin Panel:** Change webinar status from "Upcoming" to **"Live"**
3. **Share the Link:** Send attendees to `/webinars/[your-slug]`
4. **Monitor:** Watch viewer count, check audio/video quality

#### **During Stream:**
- Keep an eye on CPU usage (OBS shows this)
- Monitor network stability
- Have a backup plan (record locally as backup)

#### **End Stream:**

1. **In OBS:** Click **Stop Streaming**
2. **In Admin Panel:** Change webinar status to **"Completed"**
3. **Get Playback URL:**
   - Cloudflare will provide a playback URL after stream ends
   - Update the webinar's `video_url` field with this URL
4. **Recorded Video:** Attendees can now watch the replay!

---

## 🎬 ALTERNATIVE STREAMING OPTIONS

### **Option 1: Cloudflare Stream (Recommended)**
- ✅ Best for professional quality
- ✅ Global CDN for low latency
- ✅ Auto-recording for replays
- ✅ Adaptive bitrate streaming
- 💰 $1 per 1,000 minutes

### **Option 2: YouTube Live**
- ✅ Free
- ✅ Massive reach
- ✅ Automatic hosting
- ❌ Less control over branding
- **RTMP URL:** `rtmp://a.rtmp.youtube.com/live2/`
- **Stream Key:** Get from YouTube Studio

### **Option 3: Vimeo Live**
- ✅ Professional quality
- ✅ Ad-free
- ✅ Better privacy controls
- 💰 $75/month for Premium
- **RTMP URL:** Provided by Vimeo
- **Stream Key:** Get from Vimeo

### **Option 4: Mux**
- ✅ Developer-friendly API
- ✅ Great analytics
- ✅ Easy embedding
- 💰 Similar pricing to Cloudflare

---

## 🔧 TECHNICAL IMPLEMENTATION

### **Frontend Player (Next Step After Setup)**

Once you have Cloudflare set up, I'll add a video player to the frontend to display the stream:

#### **For Live Streams:**
```tsx
<iframe
  src={`https://customer-${customerCode}.cloudflarestream.com/${videoId}/iframe`}
  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
  allowFullScreen
  className="w-full aspect-video"
/>
```

#### **For Recorded Playback:**
```tsx
<Stream
  controls
  src={videoId}
  poster={thumbnailUrl}
/>
```

#### **Stream Status Indicator:**
```tsx
{webinar.status === 'live' && (
  <div className="flex items-center gap-2 text-red-600 animate-pulse">
    <span className="h-3 w-3 rounded-full bg-red-600" />
    <span className="font-semibold">LIVE NOW</span>
  </div>
)}
```

---

## 📊 WORKFLOW DIAGRAM

```
1. CREATE WEBINAR IN ADMIN PANEL
   ↓
2. SET TYPE = "LIVE", STATUS = "UPCOMING"
   ↓
3. ADD RTMP URL & STREAM KEY FROM CLOUDFLARE
   ↓
4. CONFIGURE OBS WITH RTMP CREDENTIALS
   ↓
5. START STREAMING IN OBS
   ↓
6. CHANGE STATUS TO "LIVE" IN ADMIN PANEL
   ↓
7. USERS WATCH ON /webinars/[slug]
   ↓
8. STOP STREAMING IN OBS
   ↓
9. CHANGE STATUS TO "COMPLETED"
   ↓
10. ADD CLOUDFLARE PLAYBACK URL TO video_url
   ↓
11. REPLAY AVAILABLE FOREVER
```

---

## 🎯 NEXT STEPS FOR YOU

### **Immediate Actions:**

1. **Set up Cloudflare Stream account** (15 min)
   - Sign up at [cloudflare.com/products/cloudflare-stream](https://www.cloudflare.com/products/cloudflare-stream/)
   - Enable Stream Live
   - Create your first Live Input

2. **Download OBS Studio** (5 min)
   - [obsproject.com](https://obsproject.com/)
   - Install and open

3. **Configure OBS with Cloudflare credentials** (5 min)
   - Settings → Stream
   - Add RTMP URL and Stream Key

4. **Test Stream** (10 min)
   - Create a test webinar in admin panel
   - Start streaming in OBS
   - Verify it works

5. **Let me know your Cloudflare Customer Code** (1 min)
   - I'll add the video player to the frontend
   - Users will be able to watch live and recorded webinars

---

## 💡 PRO TIPS

### **For Best Quality:**
- Upload speed: 5+ Mbps recommended
- Wired ethernet better than WiFi
- Close other apps during stream
- Test audio levels before going live

### **For Professional Look:**
- Use OBS overlays (lower thirds, logos)
- Add webcam frame/border
- Use virtual background if needed
- Have backup audio (external mic)

### **For Engagement:**
- Enable Q&A in description
- Announce start time in advance
- Record for replay value
- Share link via email/social

---

## 🆘 TROUBLESHOOTING

### **Stream Won't Connect:**
- ✅ Check RTMP URL is correct
- ✅ Check Stream Key is correct
- ✅ Verify internet connection
- ✅ Try restarting OBS

### **Poor Quality:**
- ✅ Lower bitrate in OBS settings
- ✅ Reduce resolution (1080p → 720p)
- ✅ Close other bandwidth-heavy apps
- ✅ Use wired connection

### **High CPU Usage:**
- ✅ Lower encoding preset (x264 → x264 fast)
- ✅ Reduce resolution
- ✅ Close unnecessary apps
- ✅ Update graphics drivers

---

## 🎉 YOU'RE READY!

Your platform is **100% ready** for live streaming. Once you set up Cloudflare and OBS, you'll be able to:

- ✅ Host live webinars
- ✅ Record for replay
- ✅ Manage all webinars in admin panel
- ✅ Track attendees and registrations
- ✅ Build your CPD content library

**When you're ready, let me know your Cloudflare details and I'll add the video player to the frontend!** 🚀

---

**Questions? Need Help?**

Just ask! I'm here to help you:
- Set up Cloudflare Stream
- Configure OBS
- Test your first stream
- Add the video player to the frontend
- Troubleshoot any issues

**Let's get you streaming!** 🎥✨

