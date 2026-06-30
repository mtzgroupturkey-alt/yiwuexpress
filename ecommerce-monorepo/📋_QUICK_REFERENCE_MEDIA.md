# 📋 Quick Reference - Product Media Upload

## 🚀 30-Second Start

```
1. Admin → Products → Add/Edit Product
2. Scroll to "Product Images & Videos"
3. Click button → Upload or paste URL
4. Save product
```

---

## 🎯 Three Upload Buttons

| Button | What It Does | File Types | Max Size |
|--------|-------------|------------|----------|
| **📷 Upload Images** | Select image files | JPEG, PNG, WebP, GIF | 5MB |
| **🎥 Upload Videos** | Select video files | MP4, WebM, MOV, AVI, MKV | 100MB |
| **🔗 Add from URL** | Paste any URL | Auto-detects type | - |

---

## ✨ Quick Tips

### Images
- **Max**: 5MB per file
- **Formats**: JPEG, PNG, WebP, GIF
- **First = Thumbnail**: First image shows in listings

### Videos
- **Max**: 100MB per file
- **Formats**: MP4, WebM, MOV, AVI, MKV
- **YouTube**: Just paste the URL!
- **Vimeo**: Just paste the URL!

### Combined
- **Max Total**: 15 items (images + videos)
- **Mix Freely**: Any combination works
- **Reorder**: Use ↑/↓ buttons
- **Remove**: Click × button

---

## 🎬 Video URLs

### YouTube
```
✅ https://youtube.com/watch?v=abc123
✅ https://youtu.be/abc123
```

### Vimeo
```
✅ https://vimeo.com/123456789
```

### Direct URLs
```
✅ https://example.com/video.mp4
```

---

## 🎨 Visual Indicators

| Icon/Badge | Meaning |
|------------|---------|
| **[IMAGE]** 🟢 | Image file |
| **[VIDEO]** 🔴 | Video file |
| **▶️** | Video (play icon) |
| **[Thumbnail]** 🔵 | First image (thumbnail) |
| **📁 Uploaded** | Local file uploaded |
| **🔗 URL** | Added from URL |

---

## ⚡ Keyboard Shortcuts

- **Tab**: Navigate buttons
- **Enter**: Confirm URL
- **Escape**: Cancel URL input
- **Click**: Select files

---

## 🔧 Setup (One Time)

```bash
cd web
npx prisma generate
npx prisma db push
```

Or just run: `SETUP-VIDEO-SUPPORT.bat`

---

## 📚 Full Documentation

- **Quick Start**: `🚀_START_HERE_PRODUCT_IMAGES.md`
- **Image Guide**: `PRODUCT_IMAGE_UPLOAD_GUIDE.md`
- **Video Guide**: `🎥_VIDEO_UPLOAD_COMPLETE.md`
- **Complete Summary**: `🎬_FINAL_MEDIA_SYSTEM_COMPLETE.md`

---

## ⚠️ Troubleshooting

### Upload Failed
- Check file size
- Check file format
- Check internet connection
- Try URL method instead

### Video Not Playing
- Use MP4 format (best compatibility)
- Check URL is publicly accessible
- Try YouTube/Vimeo instead

### Can't Add More
- Maximum 15 items reached
- Remove some items first
- Split into multiple products

---

## 💡 Best Practices

1. **First Image**: Use best product photo (it's the thumbnail)
2. **Videos**: Keep under 2-3 minutes
3. **Quality**: 720p or 1080p for videos
4. **Format**: MP4 for best browser support
5. **Mix**: Combine images and videos for best results

---

## 🎯 Common Workflows

### Basic Product
```
1. Upload 3-5 product images
2. First image = main photo
3. Done!
```

### Product with Demo
```
1. Upload product images
2. Upload demo video (MP4)
3. Reorder as needed
4. Done!
```

### YouTube Product
```
1. Upload product images
2. Click "Add from URL"
3. Paste YouTube video URL
4. Auto-detected as video
5. Done!
```

---

## 📞 Quick Help

**Need help?** Check these in order:

1. This quick reference (you are here)
2. Video guide: `🎥_VIDEO_UPLOAD_COMPLETE.md`
3. Complete guide: `PRODUCT_IMAGE_UPLOAD_GUIDE.md`
4. Visual reference: `PRODUCT_IMAGES_VISUAL_GUIDE.md`

---

## ✅ Checklist

Before you start:
- [ ] Ran database setup (one time)
- [ ] Server is running
- [ ] Logged in as admin
- [ ] Have media files ready

To upload:
- [ ] Go to Products section
- [ ] Click Add/Edit product
- [ ] Find "Product Images & Videos"
- [ ] Click upload button
- [ ] Select files or paste URL
- [ ] Save product

---

**That's it! You're ready to upload! 🚀**

*Print or bookmark this page for quick reference!*
