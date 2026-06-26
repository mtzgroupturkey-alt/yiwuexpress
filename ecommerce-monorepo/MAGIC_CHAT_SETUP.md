# 21st.dev Magic Chat - Installation & Setup Guide

## 🎯 Overview

21st.dev offers **two ways** to generate UI components with AI:

1. **Magic Chat (Web)** - Browser-based UI builder at https://21st.dev/magic-chat
2. **Magic MCP Server** - IDE integration for Kiro, Cursor, Windsurf, VS Code

Both tools generate production-ready React components using modern best practices and community components.

---

## 📋 Table of Contents

1. [Magic Chat (Web) - Quickstart](#magic-chat-web)
2. [Magic MCP Server - IDE Integration](#magic-mcp-server)
3. [First Use Examples](#first-use-examples)
4. [Integration with UI/UX Pro Max Skill](#integration-with-ui-ux-skill)
5. [Combined Workflow](#combined-workflow)

---

## 🌐 Magic Chat (Web)

### What It Is

Magic Chat is a web-based AI interface that generates React + Tailwind components in a live sandbox. You describe what you want, and it generates multiple variations for you to choose from.

### Features

- ✅ **No installation required** - Works in your browser
- ✅ **Live preview** - See components render in real-time
- ✅ **Multiple variants** - Generate 3-5 variations at once
- ✅ **Community components** - Uses pre-built components from 21st.dev library
- ✅ **Image uploads** - Attach mockups or screenshots
- ✅ **Site cloning** - Recreate designs from URLs (Pro plans)
- ✅ **Copy code** - Export to your project

### Quick Start

#### Step 1: Sign Up & Access

1. Go to https://21st.dev/magic-chat
2. Sign in with your account (create one if needed)
3. You'll see the Magic Chat interface

#### Step 2: Describe Your Component

Type a natural language prompt describing what you need:

```
"Create a product card for a kitchenware e-commerce store with:
- Product image at the top
- Product name and short description
- Price (regular and sale price)
- Add to Cart button
- Wholesale Inquiry button
- Stock indicator
- Use Tailwind CSS and make it mobile-responsive"
```

#### Step 3: Add Context (Optional)

Before sending, enrich your prompt:

- **@ Context** - Attach community components (click `@` icon)
- **Images** - Upload mockups or reference designs (max 5 images, 5MB each)
- **URLs** - Reference existing websites

#### Step 4: Review Preview

Magic Chat will:
1. Create a sandboxed React project
2. Generate the component in real-time
3. Show live preview on the right
4. Display code edits on the left

#### Step 5: Generate Variants

To get multiple variations:

```
"Generate 3 variants of this product card:
Variant A: Image-heavy (large image, minimal text)
Variant B: Text-heavy (detailed description, smaller image)
Variant C: Compact mobile-first (stacked layout)"
```

Use `Tab` and `Shift+Tab` to cycle through variants.

#### Step 6: Iterate & Refine

Send follow-up messages to adjust:

```
"Make the corners more rounded"
"Add a heart icon for wishlist"
"Use the primary color #1a3a5c for buttons"
"Add hover effects with scale and shadow"
```

#### Step 7: Export Code

When satisfied:
- Click **Copy Code** button in preview header
- Or press `⌘X` (Mac) / `Ctrl+X` (Windows) to copy prompt for other AI tools
- Paste the code into your YIWU EXPRESS project

### Pricing

- **Free Tier**: Limited generations per month
- **Pro Plans**: Unlimited generations, site cloning, priority support
- Visit https://21st.dev/pricing for current plans

---

## 🔧 Magic MCP Server (IDE Integration)

### What It Is

An MCP (Model Context Protocol) server that brings Magic AI directly into your IDE. Works with Kiro, Cursor, Windsurf, VS Code, and Claude Desktop.

### Features

- ✅ **In-IDE generation** - Generate components without leaving your editor
- ✅ **Project-aware** - Follows your code style automatically
- ✅ **Type `/ui` commands** - Simple slash commands
- ✅ **Direct file creation** - Writes components directly to your project
- ✅ **21st.dev library** - Access to community components
- ✅ **SVGL integration** - Professional brand logos and assets

### Installation for Kiro IDE

#### Prerequisites

- Node.js (Latest LTS version)
- Kiro IDE installed

#### Step 1: Get API Key

1. Visit https://21st.dev/magic/console
2. Sign up or log in
3. Click **"Generate API Key"**
4. Copy your API key (keep it secure!)

#### Step 2: Install MCP Server

**Option A: Automated CLI Installation (Recommended)**

```bash
# Install and configure for Kiro/Claude
npx @21st-dev/cli@latest install claude --api-key YOUR_API_KEY
```

Replace `YOUR_API_KEY` with the actual key from Step 1.

**Option B: Manual Configuration**

1. Locate your Kiro MCP configuration file:
   - Windows: `C:\Users\<YourUsername>\.kiro\settings\mcp.json`
   - macOS/Linux: `~/.kiro/settings/mcp.json`

2. Add this configuration:

```json
{
  "mcpServers": {
    "@21st-dev/magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest"],
      "env": {
        "API_KEY": "your-api-key-here"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

3. Save the file

#### Step 3: Restart Kiro

Close and reopen Kiro IDE for the MCP server to load.

#### Step 4: Verify Installation

In Kiro chat, ask:

```
"Can you see the @21st-dev/magic MCP server?"
```

If installed correctly, Kiro will confirm the server is available.

---

## 🎨 First Use Examples

### Example 1: Product Card Variants (Your Request)

**In Magic Chat (Web):**

Go to https://21st.dev/magic-chat and enter:

```
Generate 3 different design variants for a product card component for a 
kitchenware e-commerce store. Each variant should be production-ready React 
with Tailwind CSS.

Requirements:
- Brand colors: Primary #1a3a5c, Secondary #c9a84c, Accent #e74c3c
- Touch-friendly buttons (min 44px height)
- Mobile-first responsive design
- Accessibility compliant (ARIA labels, contrast)

Variant A - Image-Heavy Focus:
- Large product image (400x400px)
- Minimal text (product name only)
- Price prominently displayed
- Single "Add to Cart" CTA
- Quick view on hover (desktop only)

Variant B - Text-Heavy with Details:
- Smaller product image (200x200px)
- Product name, description (2 lines)
- Full pricing (regular + sale)
- Specifications preview (material, size)
- Two CTAs: "Add to Cart" + "Wholesale Inquiry"
- Stock indicator badge

Variant C - Compact Mobile-First:
- Square aspect ratio
- Stacked vertical layout
- Product image fills width
- Compact info section
- Icon-based quick actions
- Optimized for 375px viewport
```

Magic Chat will generate 3 separate implementations. Use Tab to switch between them.

**In Kiro with MCP Server:**

```
/ui Create a product card component for YIWU EXPRESS kitchenware store.
Use these design tokens:
- Colors: primary=#1a3a5c, secondary=#c9a84c, accent=#e74c3c
- Font: Inter (body), Poppins (headings)
- Spacing: 8px increments
- Shadows: sm, md, lg
- Rounded corners: 8px

Component requirements:
- TypeScript + React + Tailwind CSS
- Props: product (object with name, price, image, description, stock)
- Responsive: mobile-first, breakpoint at 768px
- Features: Add to Cart button, Wholesale Inquiry link, stock badge
- Accessibility: ARIA labels, keyboard navigation, 4.5:1 contrast

File location: web/components/products/ProductCardVariant.tsx
```

Kiro will invoke the Magic MCP server, generate the component, and create the file in your project.

### Example 2: Checkout Form

**Magic Chat prompt:**

```
Create a multi-step checkout form for B2B e-commerce:

Step 1: Shipping Information
- Company name, contact person
- Address fields with country dropdown
- Phone with country code

Step 2: Shipping Method
- Calculate rates based on weight and country
- Display: Standard, Express, Sea Freight options
- Show estimated delivery dates

Step 3: Payment
- Payment method selection (Bank Transfer, Crypto, PayPal, Stripe)
- Terms acceptance checkbox
- Order summary sidebar

Requirements:
- Next.js 14 App Router
- React Hook Form + Zod validation
- Inline error messages
- Progress indicator
- Mobile responsive
- Save draft functionality
```

### Example 3: Dashboard Sidebar

**Kiro MCP prompt:**

```
/ui Generate a collapsible dashboard sidebar for YIWU EXPRESS admin panel.

Features:
- Logo at top
- Navigation groups: Dashboard, Orders, Products, Shipping, Customers, Settings
- Each group has icons + labels
- Collapse to icon-only mode
- Active state highlighting
- Mobile: drawer overlay
- Dark mode support

Stack: Next.js 14, Tailwind, Lucide icons
Location: web/components/admin/Sidebar.tsx
```

---

## 🔗 Integration with UI/UX Pro Max Skill

You've already installed the `ui-ux-pro-max` skill. Here's how to use it with Magic Chat:

### Workflow: Design System → Component Generation

#### Step 1: Generate Design System with UI/UX Pro Max

Reference `.kiro/skills/ui-ux-pro-max/SKILL.md` to extract your design system:

**Your YIWU EXPRESS Design System:**

```yaml
Product Type: B2B E-Commerce (Kitchenware)
Style: Professional Minimalism
Colors:
  Primary: #1a3a5c (Deep Navy Blue)
  Secondary: #c9a84c (Gold)
  Accent: #e74c3c (Red)
  Background: #f8f9fa (Light Gray)
  Text: #1a1a2e (Dark)
Typography:
  Primary: Inter (body text)
  Secondary: Poppins (headings)
  Base Size: 16px
  Scale: 12/14/16/18/24/30/36px
Spacing: 4/8/12/16/24/32/48/64px (8px base)
Shadows:
  sm: 0 1px 2px rgba(0,0,0,0.05)
  md: 0 4px 6px rgba(0,0,0,0.1)
  lg: 0 10px 15px rgba(0,0,0,0.1)
Rounded: 8px (cards), 6px (buttons), 4px (inputs)
Icons: Lucide (24px standard)
```

#### Step 2: Create a Design Token Prompt

Combine the skill guidelines with Magic Chat:

```
I'm building components for YIWU EXPRESS, a B2B kitchenware e-commerce platform.
Follow this design system:

[Paste design system from Step 1]

Additional Requirements from ui-ux-pro-max skill:
✅ Accessibility: Contrast 4.5:1, ARIA labels, keyboard nav
✅ Touch Targets: Min 44×44px for all interactive elements
✅ Performance: Lazy load images, WebP format, reserve space (CLS < 0.1)
✅ Responsive: Mobile-first (375px base), breakpoints at 768/1024/1440px
✅ E-Commerce: Clear CTAs, pricing visibility, trust badges

Now generate: [Your component request]
```

#### Step 3: Use Magic Chat with Context

1. Open https://21st.dev/magic-chat
2. Paste your design system prompt
3. Add specific component request
4. Attach reference images if available
5. Generate variants

#### Step 4: Validate Against Skill Checklist

After Magic Chat generates the component, validate it against the UI/UX Pro Max skill checklist:

**Quick Reference Validation:**

- [ ] **P1 Accessibility**: Check contrast, alt text, ARIA labels
- [ ] **P2 Touch**: Verify 44×44px touch targets, 8px spacing
- [ ] **P3 Performance**: Image optimization, lazy loading
- [ ] **P4 E-Commerce**: Clear CTAs, pricing, product info
- [ ] **P5 Responsive**: Test 375px, 768px, 1024px

Use this Kiro prompt:

```
Review this component against the ui-ux-pro-max skill guidelines.
Check Priority 1-5 categories and report any violations.

[Paste generated component code]
```

---

## 🚀 Combined Workflow: UI/UX Skill + Magic Chat

### Complete Process for YIWU EXPRESS

#### Phase 1: Design System Definition

1. **Open UI/UX Pro Max Skill**
   ```
   File: .kiro/skills/ui-ux-pro-max/SKILL.md
   ```

2. **Review E-Commerce Guidelines**
   - Product Display patterns
   - Checkout Flow requirements
   - Navigation structures
   - Trust elements

3. **Extract Design Tokens**
   - Colors, typography, spacing (already defined)
   - Component patterns
   - Interaction states

#### Phase 2: Component Generation

**Option A: Magic Chat (Web) - For Exploration**

Best for:
- Generating multiple variants
- Visual comparison
- Rapid prototyping
- Design exploration

Workflow:
```
1. Go to https://21st.dev/magic-chat
2. Paste design system prompt
3. Request specific component
4. Generate 3-5 variants
5. Tab through options
6. Copy best variant
7. Paste into project
```

**Option B: Magic MCP (Kiro) - For Production**

Best for:
- Direct file creation
- Project integration
- Iterative refinement
- Following existing code style

Workflow:
```
1. In Kiro chat, use /ui command
2. Provide design system context
3. Specify file location
4. Review generated code
5. Iterate with follow-up prompts
6. Validate with skill checklist
```

#### Phase 3: Validation & Refinement

1. **Automated Checks**
   ```
   Ask Kiro: "Review this component against ui-ux-pro-max skill P1-P5 checklist"
   ```

2. **Manual Testing**
   - [ ] Test on mobile device (375px)
   - [ ] Check touch targets (≥44px)
   - [ ] Verify contrast ratios (≥4.5:1)
   - [ ] Test keyboard navigation
   - [ ] Check responsive breakpoints

3. **Performance Audit**
   ```bash
   npm run dev
   # Open Chrome DevTools → Lighthouse
   # Target: Accessibility ≥90, Performance ≥90
   ```

#### Phase 4: Implementation

1. **Copy code to project**
   ```bash
   web/components/products/ProductCardEnhanced.tsx
   ```

2. **Import design tokens**
   ```typescript
   import { colors, spacing, fontSize } from '@/lib/design-tokens'
   ```

3. **Add to page**
   ```typescript
   import ProductCardEnhanced from '@/components/products/ProductCardEnhanced'
   ```

---

## 📝 Example: Complete Workflow

### Task: Create Enhanced Product Card

#### Step 1: Define Requirements (UI/UX Skill)

```
Component: Product Card for YIWU EXPRESS
Purpose: Display kitchenware products on category pages
Context: B2B e-commerce, international buyers

Requirements from ui-ux-pro-max skill:
- Touch targets ≥44px (P2)
- Contrast ≥4.5:1 (P1)
- Lazy load images (P3)
- Responsive grid layout (P5)
- Clear pricing and CTAs (P4)
```

#### Step 2: Generate with Magic Chat

```
Create a production-ready React product card component for YIWU EXPRESS kitchenware store.

Design System:
- Colors: primary=#1a3a5c, secondary=#c9a84c, accent=#e74c3c
- Font: Inter (base 16px)
- Spacing: 8px increments
- Shadows: md for cards
- Rounded: 8px

Component Props (TypeScript):
interface ProductCardProps {
  product: {
    id: string
    name: string
    slug: string
    price: number
    comparePrice?: number
    image: string
    images?: string[]
    stock: number
    hsCode?: string
    category: string
    isFeatured?: boolean
  }
  onAddToCart?: (productId: string) => void
  onWholesaleInquiry?: (productId: string) => void
}

Features:
✅ Image with lazy loading (WebP, aspect-ratio 1:1)
✅ Product name (truncate 2 lines)
✅ Price display (show comparePrice if exists)
✅ Stock indicator badge (low stock warning <10)
✅ Add to Cart button (primary color, 44px height)
✅ Wholesale Inquiry link (secondary action)
✅ Quick view on hover (desktop only)
✅ Wishlist heart icon (top-right corner)
✅ ARIA labels for accessibility
✅ Keyboard navigation support
✅ Mobile-responsive (375px+)

Styling:
- Card: white background, shadow-md, rounded-lg, border border-gray-200
- Hover: shadow-lg, scale-102, transition 200ms
- Image: object-cover, grayscale on out-of-stock
- Buttons: Tailwind CSS with custom colors

Stack: Next.js 14, TypeScript, Tailwind CSS, Lucide icons
```

#### Step 3: Review Generated Code

Magic Chat generates the component. Review for:

- [ ] TypeScript types correct
- [ ] Props match interface
- [ ] Image uses Next.js Image component
- [ ] Colors match brand (not hardcoded hex)
- [ ] Touch targets ≥44px
- [ ] ARIA labels present

#### Step 4: Validate with Skill

Ask Kiro:

```
Review this ProductCardEnhanced component against .kiro/skills/ui-ux-pro-max/SKILL.md

Check:
- P1: Accessibility (contrast, ARIA, keyboard)
- P2: Touch targets (44×44px minimum)
- P3: Performance (image optimization, lazy load)
- P4: E-Commerce UX (clear CTAs, pricing)
- P5: Responsive (mobile-first)

[Paste component code]

Report any violations and suggest fixes.
```

#### Step 5: Iterate & Fix

If issues found:

```
Fix these issues in the ProductCardEnhanced component:
1. Increase button height from 40px to 44px (P2 requirement)
2. Add loading="lazy" to Image component (P3 requirement)
3. Improve color contrast on stock badge (P1 requirement)
```

#### Step 6: Deploy to Project

```bash
# Create file
web/components/products/ProductCardEnhanced.tsx

# Test
npm run dev

# View at http://localhost:3001
```

---

## 🎯 Best Practices

### When to Use Magic Chat (Web)

- **Exploration phase**: Trying different design directions
- **Visual comparison**: Need to see 3-5 options side-by-side
- **No project setup**: Just need quick component code
- **Client demos**: Show variations to stakeholders

### When to Use Magic MCP (Kiro)

- **Production work**: Building actual features
- **Project integration**: Need to follow existing code style
- **Iterative refinement**: Multiple rounds of adjustments
- **Bulk generation**: Creating many related components

### Combining Both

1. **Explore in Magic Chat Web**: Generate 3-5 variants
2. **Pick best option**: Select the variant you like
3. **Refine in Kiro MCP**: Integrate into project, adjust to match code style
4. **Validate with Skill**: Check against ui-ux-pro-max guidelines

---

## 📚 Resources

### Magic Chat
- **Web App**: https://21st.dev/magic-chat
- **Docs**: https://help.21st.dev/magic-chat
- **Pricing**: https://21st.dev/pricing

### Magic MCP Server
- **GitHub**: https://github.com/21st-dev/magic-mcp
- **Console**: https://21st.dev/magic/console
- **API Docs**: https://help.21st.dev/magic-mcp

### Community
- **Discord**: https://discord.gg/Qx4rFunHfm
- **Twitter**: https://x.com/21st_dev
- **Component Library**: https://21st.dev

### UI/UX Pro Max Skill
- **Skill File**: `.kiro/skills/ui-ux-pro-max/SKILL.md`
- **Setup Guide**: `UI_UX_SKILL_SETUP.md`

---

## 🆘 Troubleshooting

### Magic Chat (Web)

**Issue**: "Generation limit reached"
- **Solution**: Upgrade to Pro plan or wait for monthly reset

**Issue**: "Variants look too similar"
- **Solution**: Be more specific in your prompt about differences

**Issue**: "Component doesn't match my design system"
- **Solution**: Include full design token list in prompt

### Magic MCP Server

**Issue**: "MCP server not found"
- **Solution**: Check mcp.json configuration, restart Kiro

**Issue**: "API key invalid"
- **Solution**: Generate new key at https://21st.dev/magic/console

**Issue**: "Component not created in project"
- **Solution**: Verify file path is valid, check permissions

**Issue**: Kiro can't see Magic MCP
- **Solution**: 
  ```bash
  # Verify installation
  npx @21st-dev/cli@latest install claude --api-key YOUR_KEY
  
  # Check config file exists
  # Windows: C:\Users\<You>\.kiro\settings\mcp.json
  # Mac/Linux: ~/.kiro/settings/mcp.json
  ```

---

## ✨ Summary

**21st.dev Magic** provides two complementary tools:

### Magic Chat (Web) ✅
- **Access**: https://21st.dev/magic-chat
- **Best For**: Exploration, variants, visual comparison
- **Setup**: Sign up, no installation
- **Output**: Copy/paste code

### Magic MCP Server ✅
- **Access**: Kiro IDE integration
- **Best For**: Production, project integration
- **Setup**: API key + mcp.json config
- **Output**: Direct file creation

### Combined with UI/UX Pro Max Skill ✅
1. **Define** design system (ui-ux-pro-max skill)
2. **Generate** components (Magic Chat/MCP)
3. **Validate** against guidelines (skill checklist)
4. **Refine** and deploy

You now have a complete workflow for generating professional, accessible, high-performance UI components for YIWU EXPRESS!

---

**Last Updated:** June 24, 2026  
**Status:** ✅ Ready to Use  
**Next**: Generate your first product card variants!
