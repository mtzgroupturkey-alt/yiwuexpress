# How to Upload Breadcrumb Background Images

## ✅ COMPLETE! The system is now ready to use.

## Step-by-Step Guide

### 1. Go to Breadcrumb Settings
Open: `http://localhost:3005/admin/settings/breadcrumb`

### 2. Click "Add New" Button
Top right corner of the page

### 3. Fill in the Form

#### **Page Type**
Choose one:
- **Static Page** - For pages like About, Contact, Blog
- **Shop Default** - Fallback for all product pages
- **Category** - Specific category background

#### **Select Page/Category**
- If Static: Choose from dropdown (About, Contact, etc.)
- If Category: Choose category from list

#### **Upload Background Image**
1. Click the **"Upload Image"** button
2. Select your image file (JPG, PNG, WebP, or GIF)
3. Max size: 5MB
4. Recommended: 1920×400px
5. Wait for upload to complete
6. You'll see a preview below

#### **Upload Mobile Image (Optional)**
- Same process as desktop image
- This will show on mobile devices
- If not uploaded, desktop image will be used

#### **Overlay Color**
- Default: `rgba(26,58,92,0.6)`
- Format: `rgba(red, green, blue, opacity)`
- Makes text readable over image

#### **Custom Title (Optional)**
- Override the default page title
- Example: "Premium Cookware Collection"

#### **Custom Subtitle (Optional)**
- Add a subtitle
- Example: "Professional-grade kitchenware from Yiwu"

#### **Active Toggle**
- Turn ON to activate
- Turn OFF to disable without deleting

### 4. Click "Save Setting"

### 5. Visit Your Page
Go to the page you configured (e.g., `/about`) and see your custom background!

## Upload Locations

Images are saved to:
- **Desktop**: `/public/uploads/breadcrumb/`
- **Mobile**: `/public/uploads/breadcrumb/mobile/`

## Example: Adding Background for About Page

1. Click "Add New"
2. Page Type: **Static Page**
3. Static Page: **About Us**
4. Click "Upload Image" under "Background Image"
5. Select your `about-hero.jpg` file
6. Wait for upload
7. (Optional) Add overlay color: `rgba(26,58,92,0.7)`
8. (Optional) Title: "About YIWU EXPRESS"
9. (Optional) Subtitle: "Connecting China to the World"
10. Toggle "Active": **ON**
11. Click "Save Setting"
12. Visit: `http://localhost:3005/about`

## Troubleshooting

### "Authentication required" error
- Make sure you're logged in as admin
- Check if your session expired (log out and log back in)

### Upload button not working
- Check browser console for errors
- Verify file size is under 5MB
- Make sure file is an image (JPG, PNG, WebP, GIF)

### Image not showing after upload
- Wait a moment for upload to complete
- Check the preview appears below upload button
- Verify the image URL is saved (should start with `/uploads/`)

### Background not appearing on page
- Check the page slug matches exactly (e.g., "about" not "About")
- Verify "Active" toggle is ON
- Make sure there's only one setting per page
- Try refreshing the page (Ctrl+F5)

## Image Tips

### Best Practices
✅ Use high-quality images (1920×400px or larger)
✅ Keep file size under 2MB for faster loading
✅ Use landscape/wide images
✅ Ensure text is readable with overlay
✅ Test on mobile devices

### Avoid
❌ Portrait/tall images
❌ Very large files (5MB+)
❌ Images with important details at edges (may be cropped)
❌ Low contrast images (hard to read text)

## File Size Guide
- **Optimal**: 500KB - 1MB
- **Good**: 1MB - 2MB
- **OK**: 2MB - 3MB
- **Too Large**: 3MB+ (compress first)

## Recommended Tools
- **Image Compression**: TinyPNG.com, Squoosh.app
- **Image Editing**: Photoshop, GIMP, Canva
- **Free Stock Photos**: Unsplash, Pexels

## Support
If you encounter issues:
1. Check browser console (F12) for errors
2. Check server terminal for upload errors
3. Verify `/public/uploads/breadcrumb/` directory exists
4. Ensure you're logged in as admin
