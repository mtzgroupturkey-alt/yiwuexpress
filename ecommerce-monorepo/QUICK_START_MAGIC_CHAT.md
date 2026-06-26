# Magic Chat - Quick Start Card

## 🚀 Two Ways to Use Magic Chat

### Option 1: Web Interface (No Setup Required)

```
1. Go to: https://21st.dev/magic-chat
2. Sign in
3. Paste your prompt
4. Review 3-5 variants (use Tab to switch)
5. Copy code
```

**Best For:** Exploring designs, comparing variants, quick prototypes

---

### Option 2: Kiro IDE Integration (MCP Server)

```
1. Get API key: https://21st.dev/magic/console
2. Update: .kiro/settings/mcp.json
3. Restart Kiro
4. In chat: "/ui create [component description]"
5. Components created in your project
```

**Best For:** Production work, project integration, iterative development

---

## ⚡ Quick Commands

### Generate Product Card

**Web Prompt:**
```
Create a product card for YIWU EXPRESS kitchenware store.
Design: Navy #1a3a5c, Gold #c9a84c, Red #e74c3c
Features: Image, name, price, Add to Cart, Wholesale Inquiry
Stack: Next.js 14, TypeScript, Tailwind CSS
Make it responsive and accessible.
```

**Kiro MCP:**
```
/ui Create a product card component for YIWU EXPRESS.
Colors: primary=#1a3a5c, secondary=#c9a84c, accent=#e74c3c
Props: product (name, price, image, stock)
Features: Add to Cart button, Wholesale link, stock badge
Stack: Next.js 14 + TypeScript + Tailwind
Location: web/components/products/ProductCard.tsx
```

---

## 📋 Essential Prompt Template

```
Create a [COMPONENT TYPE] for YIWU EXPRESS.

DESIGN SYSTEM:
- Colors: primary=#1a3a5c, secondary=#c9a84c, accent=#e74c3c
- Typography: Inter (body), Poppins (headings), 16px base
- Spacing: 8px increments
- Shadows: Tailwind (sm/md/lg)
- Rounded: 8px (cards), 6px (buttons)

FEATURES:
- [List key features]
- [Interactions needed]
- [Data to display]

REQUIREMENTS:
- Next.js 14 + TypeScript
- Tailwind CSS (custom colors)
- Responsive (375px+)
- Accessible (ARIA, keyboard, 4.5:1 contrast)
- Touch targets ≥44px
- Lazy load images

[OPTIONAL: Add reference images or component URLs]
```

---

## 🎯 Your First Task: Product Card Variants

### Copy This Prompt (Magic Chat Web)

```
Generate 3 product card variants for YIWU EXPRESS kitchenware store.

Design System:
- Colors: #1a3a5c (Navy), #c9a84c (Gold), #e74c3c (Red)
- Fonts: Inter/Poppins, 16px base
- Spacing: 8px increments

Variant A - Image-Heavy:
- Large image (400×400px)
- Minimal text overlay
- Quick add on hover
- Best for: Visual browsing

Variant B - Text-Heavy:
- Balanced image + specs
- Two CTAs: Add to Cart + Wholesale
- Stock indicator
- Best for: B2B buyers

Variant C - Compact Mobile:
- Square (280×280px)
- Icon-based actions
- Touch-optimized
- Best for: Mobile grid

Stack: Next.js 14, TypeScript, Tailwind CSS
Make all variants accessible and responsive.
```

**Paste this at:** https://21st.dev/magic-chat

---

## 🔧 Setup MCP Server (5 Minutes)

### Step 1: Get API Key

```
https://21st.dev/magic/console
→ Sign in
→ Generate API Key
→ Copy key
```

### Step 2: Configure Kiro

Edit: `.kiro/settings/mcp.json`

```json
{
  "mcpServers": {
    "@21st-dev/magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest"],
      "env": {
        "API_KEY": "paste-your-key-here"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### Step 3: Restart Kiro

Close and reopen Kiro IDE.

### Step 4: Test

In Kiro chat:
```
Can you see the @21st-dev/magic MCP server?
```

Should reply: "Yes, Magic MCP server is available."

---

## ✅ Validation Checklist

After generating components, validate:

### Accessibility (P1)
- [ ] Contrast ≥4.5:1
- [ ] Alt text on images
- [ ] ARIA labels on buttons
- [ ] Keyboard navigation works

### Touch & Interaction (P2)
- [ ] Buttons ≥44×44px
- [ ] Spacing ≥8px between elements
- [ ] Loading states on clicks
- [ ] Clear hover effects

### Performance (P3)
- [ ] Next.js Image component used
- [ ] Lazy loading enabled
- [ ] Width/height specified
- [ ] No layout shift

### E-Commerce (P4)
- [ ] Clear pricing
- [ ] Stock indicator
- [ ] Primary CTA visible
- [ ] Secondary actions available

### Responsive (P5)
- [ ] Mobile-first design
- [ ] Works on 375px
- [ ] Breakpoints at 768/1024/1440px
- [ ] No horizontal scroll

**Use Kiro:** "Validate this component against .kiro/skills/ui-ux-pro-max/SKILL.md checklist"

---

## 🎨 Common Requests

### Modal Dialog
```
Create a modal for wholesale inquiry form.
Fields: Name, Company, Email, Phone, Country, Product, Quantity, Message
Actions: Submit, Cancel
Include: Backdrop overlay, close button, responsive
```

### Navigation Menu
```
Create a responsive mega menu for product categories.
Categories: Cookware, Bakeware, Utensils, Appliances, Tableware
Desktop: Dropdown with subcategories
Mobile: Drawer with accordion
```

### Cart Drawer
```
Create a slide-out cart drawer.
Shows: Product list, quantities, subtotal
Actions: Update quantity, remove item, checkout
Slides from right on desktop, bottom sheet on mobile
```

### Checkout Form
```
Create a multi-step checkout form.
Steps: Shipping → Payment → Review
Features: Progress indicator, validation, save draft
Mobile: Single column, large touch targets
```

---

## 📚 Full Documentation

- **Detailed Setup**: `MAGIC_CHAT_SETUP.md`
- **First Use Guide**: `MAGIC_CHAT_FIRST_USE.md`
- **UI/UX Skill**: `.kiro/skills/ui-ux-pro-max/SKILL.md`
- **Design System**: `UI_UX_SKILL_SETUP.md`

---

## 🆘 Troubleshooting

### Web: "Generation limit reached"
→ Upgrade to Pro or wait for monthly reset

### MCP: "Server not found"
→ Check mcp.json, verify API key, restart Kiro

### "Code doesn't match design system"
→ Include full design token list in prompt

### "Components look similar"
→ Be more specific about differences in prompt

---

## ✨ Pro Tips

1. **Include Context**: Reference existing components with `@` in Magic Chat Web
2. **Upload Images**: Attach mockups to guide design (max 5 images, 5MB each)
3. **Iterate**: Send follow-up messages to refine ("Make buttons larger", "Add dark mode")
4. **Use Variants**: Generate 3-5 options and pick the best
5. **Validate**: Always check against ui-ux-pro-max skill before deploying

---

## 🎯 Next Steps

1. **Try Magic Chat Web** → https://21st.dev/magic-chat
2. **Generate Product Cards** → Use the prompt above
3. **Setup MCP Server** → Follow 5-minute guide
4. **Build Your Components** → Start with most-needed UI

**Ready to generate beautiful components? Start now!** 🚀

---

**Quick Links:**
- Magic Chat: https://21st.dev/magic-chat
- API Console: https://21st.dev/magic/console
- Documentation: https://help.21st.dev/magic-chat
- Community: https://discord.gg/Qx4rFunHfm
