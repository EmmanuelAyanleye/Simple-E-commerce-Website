# Chlyn’s Fragrance (Frontend)

A responsive, luxury-themed perfume storefront built with **HTML**, **CSS (Bootstrap 5 + custom styles)** and **Vanilla JavaScript**.

## Project Structure

- `index.html`
  - Homepage (hero, featured picks, categories, testimonials, etc.)
- `pages/`
  - `shop.html` (catalog + filters + pagination)
  - `product-details.html` (product details + related + reviews)
  - `cart.html` (cart + WhatsApp checkout)
  - `about.html`
  - `contact.html`
- `css/style.css`
  - Global styles, light/dark theme rules, section glow effects, floating buttons
- `js/script.js`
  - Product data, rendering, cart logic, quick view modal, pagination, theme toggle

## How To Run

### Option 1: Open directly (quickest)

You can open `index.html` directly in your browser.

### Option 2: Run with a local server (recommended)

Some browsers restrict certain behaviors when opening HTML files directly. Use a local server instead.

#### Using PowerShell (Python)

If Python is installed:

```powershell
python -m http.server 5500
```

Then open:

- `http://localhost:5500/`

#### Using VS Code Live Server

- Install the **Live Server** extension
- Right click `index.html` → **Open with Live Server**

## Features

- **Luxury UI** with gold accents and premium card styling
- **Responsive design** for mobile/tablet/desktop
- **Shop page filtering** (search, category, sort, price range)
- **Scalable pagination** with ellipses for large page counts
- **Product details** page with gallery thumbnails and related products
- **Cart** with quantity controls and WhatsApp checkout message
- **Quick View modal**
- **Light/Dark mode toggle** (floating button) with persistence via `localStorage`
- **Floating buttons**: theme toggle, WhatsApp chat, back-to-top
- **Homepage testimonials navigation** (Prev/Next)
- **Subtle gold glow section backgrounds** (selected sections)

## Notes

- WhatsApp number used throughout: `+2349046908664`
- Location: Porto-Novo, Benin Republic

## Customization

- Product data is stored in `js/script.js` in the `PRODUCTS` array.
- Theme colors and major styling variables are in `css/style.css` under `:root`.

