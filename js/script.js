(() => {
  let WHATSAPP_NUMBER = "2349046908664";
  const STORAGE_KEY = "chlyns_cart_v1";
  const ADMIN_KEYS = {
    products: "chlyns_admin_products_v1",
    testimonials: "chlyns_admin_testimonials_v1",
    reviews: "chlyns_admin_reviews_v1",
    settings: "chlyns_admin_settings_v1",
    homepage: "chlyns_admin_homepage_v1",
    categories: "chlyns_admin_categories_v1",
    gallery: "chlyns_admin_gallery_v1",
  };
  let MEMORY_CART = [];

  const money = (n) => {
    const value = Number(n || 0);
    return `₦${value.toLocaleString("en-NG")}`;
  };

  const safeJsonParse = (raw, fallback) => {
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  };

  const readLsJson = (key, fallback) => {
    try {
      return safeJsonParse(localStorage.getItem(key), fallback);
    } catch {
      return fallback;
    }
  };

  const normalizeWhatsappNumber = (raw) => {
    const s = String(raw || "").trim();
    const digits = s.replace(/[^0-9]/g, "");
    return digits || "";
  };

  const applySettingsOverrides = () => {
    const s = readLsJson(ADMIN_KEYS.settings, null);
    if (!s || typeof s !== "object" || Array.isArray(s)) return;

    const name = String(s.platformName || "").trim();
    if (name) {
      document.querySelectorAll(".brand-mark").forEach((el) => (el.textContent = name));
      document.querySelectorAll(".footer-brand").forEach((el) => (el.textContent = name));
    }

    const logoUrl = String(s.logoUrl || "").trim();
    if (logoUrl) {
      const applyLogoToEl = (el, { size = 34 } = {}) => {
        if (!el || el.getAttribute("data-logo-applied") === "1") return;

        const label = name || String(el.textContent || "").trim() || "Logo";
        const span = document.createElement("span");
        span.textContent = label;

        const img = document.createElement("img");
        img.src = logoUrl;
        img.alt = label;
        img.loading = "lazy";
        img.decoding = "async";
        img.style.height = `${size}px`;
        img.style.width = `${size}px`;
        img.style.objectFit = "contain";
        img.style.borderRadius = "10px";
        img.style.marginRight = "10px";
        img.style.display = "inline-block";
        img.style.verticalAlign = "middle";

        el.textContent = "";
        el.appendChild(img);
        el.appendChild(span);
        el.setAttribute("data-logo-applied", "1");
      };

      document.querySelectorAll(".brand-mark").forEach((el) => applyLogoToEl(el, { size: 34 }));
      document.querySelectorAll(".footer-brand").forEach((el) => applyLogoToEl(el, { size: 42 }));

      const ensureIcon = (rel) => {
        const existing = document.querySelector(`link[rel='${rel}']`) || document.querySelector(`link[rel=\"${rel}\"]`);
        if (existing) return existing;
        const link = document.createElement("link");
        link.rel = rel;
        document.head.appendChild(link);
        return link;
      };

      const ico = ensureIcon("icon");
      ico.href = logoUrl;
      const apple = ensureIcon("apple-touch-icon");
      apple.href = logoUrl;
    }

    const wa = normalizeWhatsappNumber(s.whatsappNumber);
    if (wa) {
      WHATSAPP_NUMBER = wa;
      document
        .querySelectorAll('a[href*="wa.me/"]')
        .forEach((a) => (a.href = a.href.replace(/wa\.me\/[0-9]+/i, `wa.me/${wa}`)));
    }

    const email = String(s.contactEmail || "").trim();
    if (email) {
      document
        .querySelectorAll('a[href^="mailto:"]')
        .forEach((a) => {
          a.href = `mailto:${email}`;
          if (a.textContent && a.textContent.includes("@")) a.textContent = email;
        });
    }

    const address = String(s.address || "").trim();
    if (address) {
      document.querySelectorAll(".footer-text").forEach((el) => {
        if (String(el.textContent || "").toLowerCase().includes("porto-novo")) el.textContent = address;
      });
    }

    const ig = String(s.instagramUrl || "").trim();
    if (ig) document.querySelectorAll('a.social[aria-label="Instagram"]').forEach((a) => (a.href = ig));
    const fb = String(s.facebookUrl || "").trim();
    if (fb) document.querySelectorAll('a.social[aria-label="Facebook"]').forEach((a) => (a.href = fb));
    const tt = String(s.tiktokUrl || "").trim();
    if (tt) document.querySelectorAll('a.social[aria-label="TikTok"]').forEach((a) => (a.href = tt));
  };

  const getCart = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = safeJsonParse(raw, null);
      if (Array.isArray(parsed)) return parsed;
      return MEMORY_CART;
    } catch {
      return MEMORY_CART;
    }
  };

  const setCart = (cart) => {
    MEMORY_CART = Array.isArray(cart) ? cart : [];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MEMORY_CART));
    } catch {
      // ignore storage errors; keep in-memory cart
    }
    updateCartCount();
  };

  const getToastContainer = () => {
    const id = "cartToastContainer";
    let el = document.getElementById(id);
    if (el) return el;

    el = document.createElement("div");
    el.id = id;
    el.className = "cart-toast-container toast-container position-fixed";
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-atomic", "true");
    document.body.appendChild(el);
    return el;
  };

  const showAddToCartToast = (product, qtyAdded = 1) => {
    if (!product) return;
    if (!document || !document.body) return;

    const bs = window.bootstrap;
    if (!bs || !bs.Toast) return;

    const container = getToastContainer();
    const toastEl = document.createElement("div");
    toastEl.className = "toast cart-toast";
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");
    toastEl.setAttribute("aria-atomic", "true");

    const img = String(product.image || "");
    const name = String(product.name || "Product");
    const qtyText = Number(qtyAdded || 1) > 1 ? `x${Number(qtyAdded || 1)}` : "";

    toastEl.innerHTML = `
      <div class="toast-body d-flex gap-3 align-items-center">
        <img class="cart-toast-img" src="${img}" alt="${name}">
        <div class="flex-grow-1">
          <div class="cart-toast-title">Added to cart</div>
          <div class="cart-toast-sub">${name} ${qtyText}</div>
        </div>
        <button type="button" class="btn-close ms-2" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `.trim();

    container.appendChild(toastEl);
    const toast = bs.Toast.getOrCreateInstance(toastEl, { delay: 3000, autohide: true });
    toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
    toast.show();
  };

  const addToCart = (product, qty = 1) => {
    const addQty = Math.max(1, Number(qty || 1));
    const cart = getCart();
    const idx = cart.findIndex((x) => x.id === product.id);
    if (idx >= 0) {
      cart[idx].qty = Math.max(1, Number(cart[idx].qty || 1) + addQty);
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        brand: product.brand,
        price: product.price,
        image: product.image,
        qty: addQty,
      });
    }
    setCart(cart);
    showAddToCartToast(product, addQty);
  };

  const removeFromCart = (id) => {
    const cart = getCart().filter((x) => x.id !== id);
    setCart(cart);
  };

  const updateQty = (id, nextQty) => {
    const qty = Math.max(1, Number(nextQty || 1));
    const cart = getCart().map((x) => (x.id === id ? { ...x, qty } : x));
    setCart(cart);
  };

  const cartSubtotal = () => {
    return getCart().reduce((sum, x) => sum + Number(x.price || 0) * Number(x.qty || 1), 0);
  };

  const updateCartCount = () => {
    const count = getCart().reduce((sum, x) => sum + Number(x.qty || 0), 0);
    const el = document.getElementById("cartCount");
    if (el) el.textContent = String(count);
  };

  let PRODUCTS = [
    {
      id: "sauvage",
      name: "Dior Sauvage",
      brand: "Dior",
      category: "men",
      price: 85000,
      oldPrice: 98000,
      badge: "-13%",
      rating: 4.8,
      notes: "Bergamot • Ambroxan • Pepper",
      longevity: "8-10 hours",
      gender: "Men",
      image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A bold, fresh fragrance with a refined trail — designed for modern confidence and lasting impression.",
    },
    {
      id: "bleu",
      name: "Bleu De Chanel",
      brand: "Chanel",
      category: "men",
      price: 92000,
      oldPrice: 105000,
      badge: "-12%",
      rating: 4.9,
      notes: "Citrus • Incense • Woods",
      longevity: "7-9 hours",
      gender: "Men",
      image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1615485925600-97237f8133ab?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A timeless aromatic-woody signature — clean, elegant, and effortlessly premium.",
    },
    {
      id: "asad",
      name: "Lattafa Asad",
      brand: "Lattafa",
      category: "arabian",
      price: 35000,
      oldPrice: 42000,
      badge: "Deal",
      rating: 4.7,
      notes: "Vanilla • Amber • Spices",
      longevity: "10-12 hours",
      gender: "Unisex",
      image: "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1615485925600-97237f8133ab?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "Opulent and warm with a confident spice — a bold Arabian-inspired scent profile.",
    },
    {
      id: "br540",
      name: "Baccarat Rouge 540",
      brand: "Maison Francis Kurkdjian",
      category: "luxury",
      price: 170000,
      oldPrice: 190000,
      badge: "Luxury",
      rating: 4.9,
      notes: "Saffron • Ambergris • Cedar",
      longevity: "10-12 hours",
      gender: "Unisex",
      image: "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "Radiant, addictive and unmistakably premium — an iconic signature for statement-making presence.",
    },
    {
      id: "libre",
      name: "YSL Libre",
      brand: "Yves Saint Laurent",
      category: "women",
      price: 78000,
      oldPrice: 89000,
      badge: "-12%",
      rating: 4.8,
      notes: "Lavender • Orange Blossom • Vanilla",
      longevity: "7-9 hours",
      gender: "Women",
      image: "https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A modern floral with a warm vanilla base — confident, elegant, and effortlessly chic.",
    },
    {
      id: "cdn-intense",
      name: "Club De Nuit Intense",
      brand: "Armaf",
      category: "men",
      price: 42000,
      oldPrice: 50000,
      badge: "Bestseller",
      rating: 4.6,
      notes: "Citrus • Birch • Musk",
      longevity: "8-10 hours",
      gender: "Men",
      image: "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A bold, smoky-fresh profile with undeniable presence — designed for compliments.",
    },
    {
      id: "oud-wood",
      name: "Tom Ford Oud Wood",
      brand: "Tom Ford",
      category: "luxury",
      price: 155000,
      oldPrice: 175000,
      badge: "Luxury",
      rating: 4.9,
      notes: "Oud • Sandalwood • Tonka",
      longevity: "8-10 hours",
      gender: "Unisex",
      image: "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1615485925600-97237f8133ab?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A refined oud blend with soft woods — smooth, elevated, and unmistakably premium.",
    },
    {
      id: "eros",
      name: "Versace Eros",
      brand: "Versace",
      category: "men",
      price: 60000,
      oldPrice: 72000,
      badge: "-17%",
      rating: 4.7,
      notes: "Mint • Vanilla • Tonka",
      longevity: "7-9 hours",
      gender: "Men",
      image: "https://images.unsplash.com/photo-1615485925600-97237f8133ab?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1615485925600-97237f8133ab?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "Fresh and seductive with a warm gourmand finish — a signature night-out staple.",
    },
    {
      id: "black-opium",
      name: "YSL Black Opium",
      brand: "Yves Saint Laurent",
      category: "women",
      price: 83000,
      oldPrice: 95000,
      badge: "-13%",
      rating: 4.8,
      notes: "Coffee • Vanilla • White Flowers",
      longevity: "8-10 hours",
      gender: "Women",
      image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A glamorous, addictive gourmand floral — deep, sensual, and unforgettable.",
    },
    {
      id: "good-girl",
      name: "Carolina Herrera Good Girl",
      brand: "Carolina Herrera",
      category: "women",
      price: 88000,
      oldPrice: 102000,
      badge: "-14%",
      rating: 4.8,
      notes: "Cocoa • Tuberose • Tonka",
      longevity: "8-10 hours",
      gender: "Women",
      image: "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A daring contrast of light and dark — elegant florals balanced by warm tonka.",
    },
    {
      id: "aventus",
      name: "Creed Aventus",
      brand: "Creed",
      category: "luxury",
      price: 210000,
      oldPrice: 235000,
      badge: "Iconic",
      rating: 4.9,
      notes: "Pineapple • Birch • Musk",
      longevity: "9-12 hours",
      gender: "Men",
      image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A legendary fruity-smoky signature — bold projection with refined sophistication.",
    },
    {
      id: "neroli-portofino",
      name: "Tom Ford Neroli Portofino",
      brand: "Tom Ford",
      category: "unisex",
      price: 145000,
      oldPrice: 165000,
      badge: "Luxury",
      rating: 4.7,
      notes: "Neroli • Citrus • Amber",
      longevity: "6-8 hours",
      gender: "Unisex",
      image: "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1615485925600-97237f8133ab?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A sparkling Mediterranean citrus — clean, luminous, and effortlessly upscale.",
    },
    {
      id: "lost-cherry",
      name: "Tom Ford Lost Cherry",
      brand: "Tom Ford",
      category: "luxury",
      price: 168000,
      oldPrice: 186000,
      badge: "Iconic",
      rating: 4.8,
      notes: "Cherry • Almond • Tonka",
      longevity: "7-9 hours",
      gender: "Unisex",
      image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A playful-yet-luxurious cherry accord with a warm, seductive finish — bold and unforgettable.",
    },
    {
      id: "delina",
      name: "Parfums de Marly Delina",
      brand: "Parfums de Marly",
      category: "women",
      price: 150000,
      oldPrice: 169000,
      badge: "Top Pick",
      rating: 4.9,
      notes: "Rose • Lychee • Vanilla",
      longevity: "9-11 hours",
      gender: "Women",
      image: "https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "An airy rose signature with modern sweetness — elegant, feminine, and premium in every spray.",
    },
    {
      id: "la-vie-est-belle",
      name: "La Vie Est Belle",
      brand: "Lancôme",
      category: "women",
      price: 65000,
      oldPrice: 76000,
      badge: "Gift",
      rating: 4.7,
      notes: "Iris • Praline • Vanilla",
      longevity: "7-9 hours",
      gender: "Women",
      image: "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A joyful gourmand floral — smooth sweetness with a polished, upscale aura.",
    },
    {
      id: "coco-mademoiselle",
      name: "Coco Mademoiselle",
      brand: "Chanel",
      category: "women",
      price: 110000,
      oldPrice: 126000,
      badge: "Classic",
      rating: 4.8,
      notes: "Orange • Jasmine • Patchouli",
      longevity: "8-10 hours",
      gender: "Women",
      image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A refined citrus-floral with elegant depth — luxurious, clean, and always compliment-worthy.",
    },
    {
      id: "my-way",
      name: "Giorgio Armani My Way",
      brand: "Giorgio Armani",
      category: "women",
      price: 73000,
      oldPrice: 84000,
      badge: "New",
      rating: 4.6,
      notes: "Tuberose • Jasmine • Vanilla",
      longevity: "6-8 hours",
      gender: "Women",
      image: "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A luminous white-floral signature with a creamy vanilla trail — modern, elegant, and easy to love.",
    },
    {
      id: "acqua-di-gio",
      name: "Acqua di Giò Profumo",
      brand: "Giorgio Armani",
      category: "men",
      price: 86000,
      oldPrice: 98000,
      badge: "Fresh",
      rating: 4.7,
      notes: "Marine • Bergamot • Incense",
      longevity: "7-9 hours",
      gender: "Men",
      image: "https://images.unsplash.com/photo-1615485925600-97237f8133ab?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1615485925600-97237f8133ab?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A deep aquatic signature with smoky incense — fresh, mature, and undeniably premium.",
    },
    {
      id: "one-million",
      name: "Paco Rabanne 1 Million",
      brand: "Paco Rabanne",
      category: "men",
      price: 58000,
      oldPrice: 69000,
      badge: "Party",
      rating: 4.6,
      notes: "Cinnamon • Leather • Amber",
      longevity: "8-10 hours",
      gender: "Men",
      image: "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A bold, sweet-spicy crowd-pleaser — strong projection for standout nights.",
    },
    {
      id: "invictus",
      name: "Paco Rabanne Invictus",
      brand: "Paco Rabanne",
      category: "men",
      price: 56000,
      oldPrice: 65000,
      badge: "Sport",
      rating: 4.5,
      notes: "Grapefruit • Marine • Amber",
      longevity: "6-8 hours",
      gender: "Men",
      image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1615485925600-97237f8133ab?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "Crisp marine freshness with warm amber — energetic, clean, and modern.",
    },
    {
      id: "le-male",
      name: "Jean Paul Gaultier Le Male",
      brand: "JPG",
      category: "men",
      price: 61000,
      oldPrice: 74000,
      badge: "Classic",
      rating: 4.6,
      notes: "Mint • Lavender • Vanilla",
      longevity: "7-9 hours",
      gender: "Men",
      image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1615485925600-97237f8133ab?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A timeless aromatic vanilla with a fresh mint opening — charming, warm, and signature-worthy.",
    },
    {
      id: "spicebomb",
      name: "Viktor&Rolf Spicebomb",
      brand: "Viktor&Rolf",
      category: "men",
      price: 76000,
      oldPrice: 88000,
      badge: "Bold",
      rating: 4.7,
      notes: "Spices • Tobacco • Woods",
      longevity: "8-10 hours",
      gender: "Men",
      image: "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A warm spicy explosion with refined depth — perfect for nights, events, and statement wear.",
    },
    {
      id: "nine-pm",
      name: "Afnan 9PM",
      brand: "Afnan",
      category: "arabian",
      price: 38000,
      oldPrice: 45000,
      badge: "Deal",
      rating: 4.6,
      notes: "Apple • Vanilla • Amber",
      longevity: "9-11 hours",
      gender: "Men",
      image: "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A sweet, confident night scent with strong longevity — premium vibe at an accessible price.",
    },
    {
      id: "khamrah",
      name: "Lattafa Khamrah",
      brand: "Lattafa",
      category: "arabian",
      price: 40000,
      oldPrice: 48000,
      badge: "Viral",
      rating: 4.7,
      notes: "Cinnamon • Dates • Vanilla",
      longevity: "10-12 hours",
      gender: "Unisex",
      image: "https://images.unsplash.com/photo-1615485925600-97237f8133ab?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1615485925600-97237f8133ab?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A rich gourmand-spice with a luxurious sweetness — warm, opulent, and attention-grabbing.",
    },
    {
      id: "oud-for-glory",
      name: "Lattafa Oud for Glory",
      brand: "Lattafa",
      category: "arabian",
      price: 42000,
      oldPrice: 50000,
      badge: "Oud",
      rating: 4.6,
      notes: "Oud • Patchouli • Amber",
      longevity: "10-12 hours",
      gender: "Unisex",
      image: "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A bold oud-forward scent with deep amber warmth — strong projection and premium feel.",
    },
    {
      id: "yara",
      name: "Lattafa Yara",
      brand: "Lattafa",
      category: "arabian",
      price: 32000,
      oldPrice: 38000,
      badge: "Sweet",
      rating: 4.5,
      notes: "Tropical • Vanilla • Musk",
      longevity: "7-9 hours",
      gender: "Women",
      image: "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "Soft, sweet and creamy with a modern musk base — an easy everyday favorite.",
    },
    {
      id: "musk-rave",
      name: "Musk Rave",
      brand: "Maison Alhambra",
      category: "unisex",
      price: 29000,
      oldPrice: 34000,
      badge: "Clean",
      rating: 4.4,
      notes: "Musk • Powder • Woods",
      longevity: "6-8 hours",
      gender: "Unisex",
      image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A clean, smooth musk with a soft powdery aura — minimal, premium, and versatile.",
    },
    {
      id: "intense-cafe",
      name: "Intense Café",
      brand: "Montale",
      category: "unisex",
      price: 98000,
      oldPrice: 112000,
      badge: "Gourmand",
      rating: 4.6,
      notes: "Coffee • Rose • Vanilla",
      longevity: "9-11 hours",
      gender: "Unisex",
      image: "https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A rich coffee-rose blend with creamy sweetness — luxurious gourmand with strong presence.",
    },
    {
      id: "cloud",
      name: "Ariana Grande Cloud",
      brand: "Ariana Grande",
      category: "women",
      price: 52000,
      oldPrice: 62000,
      badge: "Soft",
      rating: 4.5,
      notes: "Coconut • Whipped Cream • Musk",
      longevity: "6-8 hours",
      gender: "Women",
      image: "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A soft, airy sweetness with a creamy musky base — cozy, modern, and easy to wear.",
    },
    {
      id: "si",
      name: "Armani Sì",
      brand: "Giorgio Armani",
      category: "women",
      price: 82000,
      oldPrice: 96000,
      badge: "Elegant",
      rating: 4.7,
      notes: "Blackcurrant • Rose • Vanilla",
      longevity: "7-9 hours",
      gender: "Women",
      image: "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "Chic blackcurrant sweetness with a refined floral heart — sophisticated, feminine, and premium.",
    },
    {
      id: "eclat-d-arpege",
      name: "Lanvin Éclat d'Arpège",
      brand: "Lanvin",
      category: "women",
      price: 36000,
      oldPrice: 42000,
      badge: "Daily",
      rating: 4.4,
      notes: "Lilac • Green Tea • Musk",
      longevity: "5-7 hours",
      gender: "Women",
      image: "https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A light, clean floral with soft musk — perfect for everyday elegance.",
    },
    {
      id: "instant-crush",
      name: "Mancera Instant Crush",
      brand: "Mancera",
      category: "luxury",
      price: 125000,
      oldPrice: 139000,
      badge: "Luxury",
      rating: 4.7,
      notes: "Saffron • Amber • Vanilla",
      longevity: "10-12 hours",
      gender: "Unisex",
      image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A modern amber with saffron sparkle — high impact, long lasting, and deeply luxurious.",
    },
    {
      id: "ombre-nomade",
      name: "Louis Vuitton Ombre Nomade",
      brand: "Louis Vuitton",
      category: "luxury",
      price: 260000,
      oldPrice: 285000,
      badge: "Elite",
      rating: 4.9,
      notes: "Oud • Rose • Incense",
      longevity: "12+ hours",
      gender: "Unisex",
      image: "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A luxurious oud-rose incense profile with monumental projection — pure statement fragrance.",
    },
    {
      id: "black-afgano",
      name: "Nasomatto Black Afgano",
      brand: "Nasomatto",
      category: "luxury",
      price: 190000,
      oldPrice: 210000,
      badge: "Niche",
      rating: 4.8,
      notes: "Resins • Woods • Incense",
      longevity: "10-12 hours",
      gender: "Unisex",
      image: "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "Dark, resinous and artistic — a niche signature for bold fragrance lovers.",
    },
    {
      id: "alien",
      name: "Mugler Alien",
      brand: "Mugler",
      category: "women",
      price: 72000,
      oldPrice: 86000,
      badge: "Power",
      rating: 4.6,
      notes: "Jasmine • Amber • Woods",
      longevity: "8-10 hours",
      gender: "Women",
      image: "https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1585386959984-a41552231693?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1523292562811-8fa7962a78c8?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A powerful jasmine-amber signature with an iconic trail — confident, radiant, and unforgettable.",
    },
    {
      id: "light-blue",
      name: "Dolce & Gabbana Light Blue",
      brand: "D&G",
      category: "women",
      price: 54000,
      oldPrice: 64000,
      badge: "Fresh",
      rating: 4.4,
      notes: "Lemon • Apple • Cedar",
      longevity: "5-7 hours",
      gender: "Women",
      image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1563170351-be82bc888aa4?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A crisp citrus-fruity summer classic — clean, bright and effortlessly stylish.",
    },
    {
      id: "ck-one",
      name: "Calvin Klein CK One",
      brand: "Calvin Klein",
      category: "unisex",
      price: 32000,
      oldPrice: 38000,
      badge: "Everyday",
      rating: 4.3,
      notes: "Citrus • Green • Musk",
      longevity: "4-6 hours",
      gender: "Unisex",
      image: "https://images.unsplash.com/photo-1615485925600-97237f8133ab?auto=format&fit=crop&w=1200&q=80",
      gallery: [
        "https://images.unsplash.com/photo-1615485925600-97237f8133ab?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=80",
      ],
      description:
        "A clean, minimal citrus-musk classic — easy, fresh, and universally wearable.",
    },
  ];

  const applyProductOverrides = () => {
    const override = readLsJson(ADMIN_KEYS.products, null);
    if (!Array.isArray(override) || override.length === 0) return;
    const ok = override.every((p) => p && typeof p === "object" && p.id && p.name && p.image);
    if (!ok) return;
    PRODUCTS = override;
  };

  const findProduct = (id) => PRODUCTS.find((p) => p.id === id);

  const pagesPrefix = () => {
    const path = String(window.location && window.location.pathname ? window.location.pathname : "");
    return path.includes("/pages/") ? "" : "pages/";
  };

  const getParam = (name) => {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  };

  const setYear = () => {
    const y = document.getElementById("year");
    if (y) y.textContent = String(new Date().getFullYear());
  };

  const initNavEffects = () => {
    const nav = document.getElementById("mainNav");
    const backToTop = document.getElementById("backToTop");
    const onScroll = () => {
      const scrolled = window.scrollY > 30;
      if (nav) nav.classList.toggle("nav-scrolled", scrolled);
      if (backToTop) backToTop.style.display = window.scrollY > 500 ? "flex" : "none";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (backToTop) {
      backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }
  };

  const initThemeToggle = () => {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;

    const root = document.documentElement;
    const key = "chlyns_theme_v1";
    const getTheme = () => {
      const t = localStorage.getItem(key);
      return t === "light" ? "light" : "dark";
    };
    const setTheme = (theme) => {
      root.setAttribute("data-theme", theme);
      document.body && document.body.setAttribute("data-theme", theme);
      localStorage.setItem(key, theme);

      const isLight = theme === "light";
      btn.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
      btn.innerHTML = isLight ? '<i class="bi bi-moon-stars"></i>' : '<i class="bi bi-sun"></i>';
    };

    setTheme(getTheme());
    btn.addEventListener("click", () => {
      const next = getTheme() === "light" ? "dark" : "light";
      setTheme(next);
    });
  };

  const hideLoader = () => {
    const loader = document.getElementById("pageLoader");
    if (!loader) return;
    window.setTimeout(() => loader.classList.add("hidden"), 400);
  };

  const initAOS = () => {
    const reveal = () => {
      document.querySelectorAll("[data-aos]").forEach((el) => {
        el.classList.add("aos-animate");
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    };

    if (window.AOS) {
      window.AOS.init({
        duration: 850,
        once: true,
        offset: 90,
        easing: "ease-out-cubic",
      });
    } else {
      reveal();
    }
  };

  const productCardHtml = (p, { compact = false } = {}) => {
    const desc = compact ? "" : `<div class="text-muted small mt-2">${p.description}</div>`;
    const badge = p.badge ? `<span class="badge bg-warning text-dark ms-2">${p.badge}</span>` : "";
    const old = p.oldPrice ? `<span class="text-decoration-line-through text-muted small ms-2">${money(p.oldPrice)}</span>` : "";
    const pref = pagesPrefix();

    return `
      <div class="col-sm-6 col-lg-4">
        <div class="card bg-transparent border-0 h-100">
          <div class="p-3" style="border-radius:18px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);box-shadow:0 14px 40px rgba(0,0,0,.35);">
            <div class="ratio ratio-4x3" style="border-radius:16px; overflow:hidden;">
              <img src="${p.image}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover; transform:scale(1); transition:transform .5s ease;" class="product-img"/>
            </div>
            <div class="mt-3">
              <div class="d-flex align-items-start justify-content-between gap-2">
                <div>
                  <div class="fw-semibold">${p.name}</div>
                  <div class="text-muted small">${p.brand} • ${p.gender}</div>
                </div>
                <div class="text-end">
                  <div class="fw-semibold" style="color:rgba(212,175,55,.95)">${money(p.price)}${badge}</div>
                  ${old}
                </div>
              </div>
              ${desc}
              <div class="d-flex gap-2 flex-wrap mt-3">
                <button class="btn btn-gold btn-sm" data-add-to-cart="${p.id}"><i class="bi bi-bag-plus"></i> Add to Cart</button>
                <button class="btn btn-outline-gold btn-sm" data-quick-view="${p.id}"><i class="bi bi-eye"></i> Quick View</button>
                <a class="btn btn-outline-light btn-sm" href="${pref}product-details.html?id=${encodeURIComponent(p.id)}"><i class="bi bi-box-arrow-up-right"></i> Details</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const bindGlobalProductActions = () => {
    document.addEventListener("click", (e) => {
      const addBtn = e.target.closest("[data-add-to-cart]");
      const quickBtn = e.target.closest("[data-quick-view]");

      if (addBtn) {
        const id = addBtn.getAttribute("data-add-to-cart");
        const p = findProduct(id);
        if (p) addToCart(p, 1);
      }

      if (quickBtn) {
        const id = quickBtn.getAttribute("data-quick-view");
        const p = findProduct(id);
        if (p) openQuickView(p);
      }
    });
  };

  const openQuickView = (p) => {
    const title = document.getElementById("quickViewTitle");
    const body = document.getElementById("quickViewBody");
    if (!body) return;

    const pref = pagesPrefix();

    if (title) title.textContent = p.name;

    body.innerHTML = `
      <div class="row g-4 align-items-center">
        <div class="col-md-6">
          <div class="ratio ratio-1x1" style="border-radius:16px; overflow:hidden; border:1px solid rgba(255,255,255,.12)">
            <img src="${p.image}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover;" />
          </div>
        </div>
        <div class="col-md-6">
          <div class="text-muted small">${p.brand} • ${p.gender}</div>
          <div class="d-flex align-items-center gap-2 mt-2">
            <div class="fs-4 fw-semibold" style="color:rgba(212,175,55,.95)">${money(p.price)}</div>
            ${p.oldPrice ? `<div class="text-decoration-line-through text-muted">${money(p.oldPrice)}</div>` : ""}
          </div>
          <div class="mt-3" style="color:rgba(255,255,255,.78)">${p.description}</div>
          <div class="mt-3">
            <div class="small text-muted">Notes</div>
            <div>${p.notes}</div>
          </div>
          <div class="d-flex gap-2 flex-wrap mt-4">
            <button class="btn btn-gold" data-add-to-cart="${p.id}"><i class="bi bi-bag-plus"></i> Add to Cart</button>
            <a class="btn btn-outline-gold" href="${pref}product-details.html?id=${encodeURIComponent(p.id)}">View Details</a>
          </div>
        </div>
      </div>
    `;

    const modalEl = document.getElementById("quickViewModal");
    if (!modalEl || !window.bootstrap) return;
    const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  };

  const initHome = () => {
    const featured = document.getElementById("featuredGrid");
    if (featured) {
      const home = readLsJson(ADMIN_KEYS.homepage, null);
      const ids = home && Array.isArray(home.featuredIds) ? home.featuredIds.filter(Boolean) : [];
      const selected = ids
        .map((id) => PRODUCTS.find((p) => String(p.id) === String(id)))
        .filter(Boolean)
        .slice(0, 6);
      const picks =
        selected.length > 0
          ? selected
          : [...PRODUCTS].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6);
      featured.innerHTML = picks.map((p) => productCardHtml(p, { compact: true })).join("");
    }

    const bestWrapper = document.getElementById("bestSellersWrapper");
    if (bestWrapper) {
      const home = readLsJson(ADMIN_KEYS.homepage, null);
      const ids = home && Array.isArray(home.bestSellerIds) ? home.bestSellerIds.filter(Boolean) : [];
      const selected = ids
        .map((id) => PRODUCTS.find((p) => String(p.id) === String(id)))
        .filter(Boolean)
        .slice(0, 12);
      const best =
        selected.length > 0
          ? selected
          : [...PRODUCTS].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 12);

      bestWrapper.innerHTML = best
        .map(
          (p) => `
          <div class="swiper-slide">
            <div style="border-radius:18px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);padding:14px;">
              <div class="ratio ratio-4x3" style="border-radius:16px; overflow:hidden;">
                <img src="${p.image}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover;" />
              </div>
              <div class="mt-3">
                <div class="fw-semibold">${p.name}</div>
                <div class="text-muted small">${p.brand} • ${p.gender}</div>
                <div class="d-flex align-items-center justify-content-between mt-2">
                  <div class="fw-semibold" style="color:rgba(212,175,55,.95)">${money(p.price)}</div>
                  <button class="btn btn-gold btn-sm" data-add-to-cart="${p.id}">Add</button>
                </div>
              </div>
            </div>
          </div>
        `
        )
        .join("");

      if (window.Swiper) {
        new window.Swiper("#bestSellersSwiper", {
          slidesPerView: 1.15,
          spaceBetween: 16,
          speed: 700,
          navigation: {
            prevEl: "#bestPrev",
            nextEl: "#bestNext",
          },
          breakpoints: {
            576: { slidesPerView: 2.1 },
            992: { slidesPerView: 3 },
            1200: { slidesPerView: 3.25 },
          },
        });
      } else {
        const swiperEl = document.getElementById("bestSellersSwiper");
        if (swiperEl) {
          swiperEl.style.overflowX = "auto";
          swiperEl.style.paddingBottom = "8px";
        }
      }
    }

    const renderHomeCategories = () => {
      const cats = readLsJson(ADMIN_KEYS.categories, null);
      if (!Array.isArray(cats) || cats.length === 0) return;

      const row = Array.from(document.querySelectorAll(".section-eyebrow"))
        .find((el) => String(el.textContent || "").trim().toLowerCase() === "categories")
        ?.closest(".container")
        ?.querySelector(".row.g-4");

      if (!row) return;

      row.innerHTML = cats
        .filter((c) => c && typeof c === "object" && c.key && c.title && c.image)
        .map((c, idx) => {
          const key = String(c.key || "").trim();
          const title = String(c.title || "").trim();
          const subtitle = String(c.subtitle || "").trim();
          const img = String(c.image || "").trim();
          const linkCat = String(c.linkCategory || "").trim() || key;
          const col = idx < 3 ? "col-md-6 col-lg-4" : "col-md-6 col-lg-6";
          return `
            <div class="${col}" data-aos="fade-up" data-aos-delay="${60 + (idx % 3) * 50}">
              <a class="cat-tile" href="pages/shop.html?category=${encodeURIComponent(linkCat)}">
                <div class="cat-tile-bg" style="background-image:url('${img}');"></div>
                <div class="cat-tile-ov"></div>
                <div class="cat-tile-body">
                  <div class="cat-tile-title">${title}</div>
                  <div class="cat-tile-sub">${subtitle}</div>
                </div>
              </a>
            </div>
          `.trim();
        })
        .join("");
    };

    const renderHomeGallery = () => {
      const imgs = readLsJson(ADMIN_KEYS.gallery, null);
      if (!Array.isArray(imgs) || imgs.length === 0) return;

      const row = Array.from(document.querySelectorAll(".section-eyebrow"))
        .find((el) => String(el.textContent || "").trim().toLowerCase() === "gallery")
        ?.closest(".container")
        ?.querySelector(".row.g-3");

      if (!row) return;

      row.innerHTML = imgs
        .filter(Boolean)
        .slice(0, 12)
        .map(
          (src) =>
            `<div class="col-6 col-md-4 col-lg-3"><div class="ig-tile" style="background-image:url('${String(src)}');"></div></div>`
        )
        .join("");
    };

    renderHomeCategories();
    renderHomeGallery();

    const testiRow = document.getElementById("testimonialRow");
    if (testiRow) {
      const prev = document.getElementById("testiPrev");
      const next = document.getElementById("testiNext");
      const count = document.getElementById("testiCount");

      const DEFAULT_TESTIMONIALS = [
        {
          stars: "★★★★★",
          quote: "“The scent is premium and long-lasting. Great recommendation.”",
          author: "— Aïcha, Porto-Novo",
        },
        {
          stars: "★★★★★",
          quote: "“Fast WhatsApp response, luxury packaging. I’ll order again.”",
          author: "— Junior, Cotonou",
        },
        {
          stars: "★★★★★",
          quote: "“Arabian fragrances are top-tier. Projection is strong.”",
          author: "— Mariam, Porto-Novo",
        },
        {
          stars: "★★★★★",
          quote: "“Quality is exactly as described. The packaging is beautiful.”",
          author: "— Fati, Porto-Novo",
        },
        {
          stars: "★★★★★",
          quote: "“I got compliments the same day. This shop is legit.”",
          author: "— David, Cotonou",
        },
        {
          stars: "★★★★★",
          quote: "“Great guidance for choosing a scent. Fast delivery too.”",
          author: "— Sarah, Porto-Novo",
        },
      ];

      const tOverride = readLsJson(ADMIN_KEYS.testimonials, null);
      const overrideOk =
        Array.isArray(tOverride) &&
        tOverride.length > 0 &&
        tOverride.every((x) => x && typeof x === "object" && x.quote && x.author);
      const TESTIMONIALS = overrideOk ? tOverride : DEFAULT_TESTIMONIALS;

      const PAGE_SIZE = 3;
      let page = 0;
      const totalPages = Math.max(1, Math.ceil(TESTIMONIALS.length / PAGE_SIZE));

      const render = () => {
        const start = page * PAGE_SIZE;
        const slice = TESTIMONIALS.slice(start, start + PAGE_SIZE);

        testiRow.innerHTML = slice
          .map(
            (t, idx) => `
            <div class="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="${60 + idx * 50}">
              <div class="testimonial">
                <div class="stars">${t.stars}</div>
                <div class="quote">${t.quote}</div>
                <div class="author">${t.author}</div>
              </div>
            </div>
          `
          )
          .join("");

        const from = TESTIMONIALS.length === 0 ? 0 : start + 1;
        const to = TESTIMONIALS.length === 0 ? 0 : Math.min(TESTIMONIALS.length, start + PAGE_SIZE);
        if (count) count.textContent = `Showing ${from}-${to} of ${TESTIMONIALS.length}`;

        if (prev) prev.disabled = page <= 0;
        if (next) next.disabled = page >= totalPages - 1;
      };

      if (prev) {
        prev.addEventListener("click", () => {
          page = Math.max(0, page - 1);
          render();
        });
      }
      if (next) {
        next.addEventListener("click", () => {
          page = Math.min(totalPages - 1, page + 1);
          render();
        });
      }

      render();
    }
  };

  const initProductDetails = () => {
    const id = getParam("id") || "br540";
    const p = findProduct(id);
    if (!p) return;

    const title = document.getElementById("pdTitle");
    const price = document.getElementById("pdPrice");
    const old = document.getElementById("pdOldPrice");
    const desc = document.getElementById("pdDesc");
    const notes = document.getElementById("pdNotes");
    const longevity = document.getElementById("pdLongevity");
    const gender = document.getElementById("pdGender");
    const mainImg = document.getElementById("pdMainImg");
    const thumbs = document.getElementById("pdThumbs");

    if (title) title.textContent = p.name;
    if (price) price.textContent = money(p.price);
    if (old) old.textContent = p.oldPrice ? money(p.oldPrice) : "";
    if (desc) desc.textContent = p.description;
    if (notes) notes.textContent = p.notes;
    if (longevity) longevity.textContent = p.longevity;
    if (gender) gender.textContent = p.gender;

    if (mainImg) mainImg.src = p.gallery?.[0] || p.image;
    if (thumbs && Array.isArray(p.gallery)) {
      thumbs.innerHTML = p.gallery
        .map(
          (src, idx) => `
        <button class="btn p-0 border-0" type="button" data-thumb-src="${src}" aria-label="Thumbnail ${idx + 1}">
          <img src="${src}" alt="${p.name} thumbnail" style="width:74px;height:74px;object-fit:cover;border-radius:14px;border:1px solid rgba(255,255,255,.14);" />
        </button>
      `
        )
        .join("");

      thumbs.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-thumb-src]");
        if (!btn || !mainImg) return;
        mainImg.src = btn.getAttribute("data-thumb-src");
      });
    }

    const qtyInput = document.getElementById("pdQty");
    const qtyMinus = document.getElementById("pdQtyMinus");
    const qtyPlus = document.getElementById("pdQtyPlus");

    const clampQty = (n) => Math.max(1, Number(n || 1));

    if (qtyInput) {
      qtyInput.addEventListener("input", () => {
        qtyInput.value = String(clampQty(qtyInput.value));
      });
    }

    if (qtyMinus && qtyInput) {
      qtyMinus.addEventListener("click", () => {
        qtyInput.value = String(clampQty(Number(qtyInput.value || 1) - 1));
      });
    }

    if (qtyPlus && qtyInput) {
      qtyPlus.addEventListener("click", () => {
        qtyInput.value = String(clampQty(Number(qtyInput.value || 1) + 1));
      });
    }

    const addBtn = document.getElementById("pdAddToCart");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        const qty = qtyInput ? clampQty(qtyInput.value) : 1;
        addToCart(p, qty);
      });
    }

    const related = document.getElementById("relatedGrid");
    if (related) {
      const picks = PRODUCTS.filter((x) => x.id !== p.id).slice(0, 6);
      if (picks.length > 0) {
        related.innerHTML = picks.map((x) => productCardHtml(x, { compact: true })).join("");
      } else {
        const tpl = document.getElementById("relatedFallbackTpl");
        if (tpl) related.innerHTML = tpl.innerHTML + tpl.innerHTML + tpl.innerHTML;
      }
    }

    const reviewsRoot = document.getElementById("pdReviews");
    const rPrev = document.getElementById("pdReviewPrev");
    const rNext = document.getElementById("pdReviewNext");
    const rFrom = document.getElementById("pdReviewFrom");
    const rTo = document.getElementById("pdReviewTo");
    const rTotal = document.getElementById("pdReviewTotal");

    if (reviewsRoot) {
      const DEFAULT_REVIEWS = [
        { stars: 5, text: "Lasts long and smells expensive.", who: "Verified Customer" },
        { stars: 5, text: "Fast response and premium packaging.", who: "Verified Customer" },
        { stars: 5, text: "Perfect for compliments — strong but not choking.", who: "Verified Buyer" },
        { stars: 4, text: "Original scent and delivery was smooth.", who: "Verified Customer" },
        { stars: 5, text: "Smells like luxury. Will order again.", who: "Verified Buyer" },
        { stars: 4, text: "Good projection and long lasting.", who: "Verified Customer" },
        { stars: 5, text: "Exactly what I wanted. Great recommendation.", who: "Verified Buyer" },
      ];

      const all = readLsJson(ADMIN_KEYS.reviews, null);
      const candidate = all && p && p.id ? all[String(p.id)] : null;
      const overrideOk =
        Array.isArray(candidate) &&
        candidate.length > 0 &&
        candidate.every((r) => r && typeof r === "object" && r.text);
      const REVIEWS = overrideOk ? candidate : DEFAULT_REVIEWS;

      const PAGE = 3;
      let page = 1;
      const render = () => {
        const total = REVIEWS.length;
        const pages = Math.max(1, Math.ceil(total / PAGE));
        page = Math.min(page, pages);
        const start = (page - 1) * PAGE;
        const items = REVIEWS.slice(start, start + PAGE);

        reviewsRoot.innerHTML = items
          .map((r) => {
            const stars = "★★★★★".slice(0, r.stars);
            return `<div class="col-md-4"><div style="border-radius:18px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);padding:14px;">${stars}<div class="mt-2">“${r.text}”</div><div class="text-muted small mt-2">— ${r.who}</div></div></div>`;
          })
          .join("");

        if (rTotal) rTotal.textContent = String(total);
        const from = total === 0 ? 0 : start + 1;
        const to = total === 0 ? 0 : Math.min(total, start + PAGE);
        if (rFrom) rFrom.textContent = String(from);
        if (rTo) rTo.textContent = String(to);

        if (rPrev) rPrev.disabled = page <= 1;
        if (rNext) rNext.disabled = page >= pages;
      };

      if (rPrev) rPrev.addEventListener("click", () => {
        page -= 1;
        render();
      });
      if (rNext) rNext.addEventListener("click", () => {
        page += 1;
        render();
      });

      render();
    }
  };

  const initShop = () => {
    const grid = document.getElementById("shopGrid");
    if (!grid) return;

    const resultsEl = document.getElementById("shopResults");
    const pager = document.getElementById("shopPagination");
    const pagerTop = document.getElementById("shopPaginationTop");

    const search = document.getElementById("shopSearch");
    const category = document.getElementById("shopCategory");
    const sort = document.getElementById("shopSort");
    const priceMin = document.getElementById("priceMin");
    const priceMax = document.getElementById("priceMax");

    const PAGE_SIZE = 12;
    let currentPage = 1;

    const seedCategory = getParam("category");
    if (seedCategory && category) category.value = seedCategory;

    const buildPager = (target, page, totalPages) => {
      if (!target) return;
      if (totalPages <= 1) {
        target.innerHTML = "";
        return;
      }

      const btn = (label, nextPage, { disabled = false, active = false, aria = "" } = {}) => {
        const dis = disabled ? "disabled" : "";
        const act = active ? "active" : "";
        const a = aria ? `aria-label="${aria}"` : "";
        return `<button type="button" class="shop-page-btn ${act}" data-shop-page="${nextPage}" ${dis} ${a}>${label}</button>`;
      };

      const maxButtons = window.matchMedia && window.matchMedia("(max-width: 575.98px)").matches ? 5 : 7;
      const half = Math.floor(maxButtons / 2);
      let start = Math.max(1, page - half);
      let end = Math.min(totalPages, start + maxButtons - 1);
      start = Math.max(1, end - maxButtons + 1);

      const parts = [];
      parts.push(btn("<", page - 1, { disabled: page <= 1, aria: "Previous page" }));
      if (start > 1) {
        parts.push(btn("1", 1, { active: page === 1 }));
        if (start > 2) parts.push(`<span class="shop-page-ellipsis">…</span>`);
      }
      for (let p = start; p <= end; p += 1) {
        parts.push(btn(String(p), p, { active: p === page }));
      }
      if (end < totalPages) {
        if (end < totalPages - 1) parts.push(`<span class="shop-page-ellipsis">…</span>`);
        parts.push(btn(String(totalPages), totalPages, { active: page === totalPages }));
      }
      parts.push(btn(">", page + 1, { disabled: page >= totalPages, aria: "Next page" }));
      target.innerHTML = `<div class="shop-page-group">${parts.join("")}</div>`;
    };

    const apply = () => {
      const q = (search ? search.value : "").trim().toLowerCase();
      const cat = category ? category.value : "all";
      const min = priceMin ? Number(priceMin.value || 0) : 0;
      const max = priceMax ? Number(priceMax.value || 999999999) : 999999999;

      let items = PRODUCTS.filter((p) => {
        const matchesQuery = !q || `${p.name} ${p.brand} ${p.notes}`.toLowerCase().includes(q);
        const matchesCat = cat === "all" || p.category === cat;
        const matchesPrice = p.price >= min && p.price <= max;
        return matchesQuery && matchesCat && matchesPrice;
      });

      const s = sort ? sort.value : "featured";
      if (s === "price-asc") items.sort((a, b) => a.price - b.price);
      if (s === "price-desc") items.sort((a, b) => b.price - a.price);
      if (s === "rating-desc") items.sort((a, b) => (b.rating || 0) - (a.rating || 0));

      const total = items.length;
      const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      currentPage = Math.min(currentPage, totalPages);

      const startIdx = (currentPage - 1) * PAGE_SIZE;
      const pageItems = items.slice(startIdx, startIdx + PAGE_SIZE);

      grid.innerHTML = pageItems.map((p) => productCardHtml(p)).join("");

      const from = total === 0 ? 0 : startIdx + 1;
      const to = total === 0 ? 0 : Math.min(total, startIdx + PAGE_SIZE);
      if (resultsEl) resultsEl.textContent = `Showing ${from}-${to} of ${total} products`;

      buildPager(pager, currentPage, totalPages);

      const isMobile = window.matchMedia && window.matchMedia("(max-width: 575.98px)").matches;
      if (pagerTop) {
        pagerTop.style.display = isMobile ? "none" : "";
        if (!isMobile) buildPager(pagerTop, currentPage, totalPages);
        else pagerTop.innerHTML = "";
      }

      grid.querySelectorAll(".product-img").forEach((img) => {
        img.addEventListener("mouseenter", () => (img.style.transform = "scale(1.06)"));
        img.addEventListener("mouseleave", () => (img.style.transform = "scale(1)"));
      });
    };

    const resetAndApply = () => {
      currentPage = 1;
      apply();
    };

    [search, category, sort, priceMin, priceMax].forEach((el) => {
      if (!el) return;
      el.addEventListener("input", resetAndApply);
      el.addEventListener("change", resetAndApply);
    });

    const onPageClick = (e) => {
      const b = e.target.closest("[data-shop-page]");
      if (!b) return;
      const next = Number(b.getAttribute("data-shop-page"));
      if (!Number.isFinite(next) || next < 1) return;
      currentPage = next;
      apply();
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    if (pager) pager.addEventListener("click", onPageClick);
    if (pagerTop) pagerTop.addEventListener("click", onPageClick);

    apply();
  };

  const initCartPage = () => {
    const root = document.getElementById("cartRoot");
    if (!root) return;

    const form = {
      name: document.getElementById("coName"),
      phone: document.getElementById("coPhone"),
      location: document.getElementById("coLocation"),
      note: document.getElementById("coNote"),
    };

    const persistFields = () => {
      const payload = {
        name: form.name ? form.name.value : "",
        phone: form.phone ? form.phone.value : "",
        location: form.location ? form.location.value : "",
        note: form.note ? form.note.value : "",
      };
      sessionStorage.setItem("chlyns_checkout_fields_v1", JSON.stringify(payload));
    };

    const restoreFields = () => {
      const raw = sessionStorage.getItem("chlyns_checkout_fields_v1");
      const payload = safeJsonParse(raw, null);
      if (!payload) return;
      if (form.name) form.name.value = payload.name || "";
      if (form.phone) form.phone.value = payload.phone || "";
      if (form.location) form.location.value = payload.location || "";
      if (form.note) form.note.value = payload.note || "";
    };

    if (form.phone) {
      const sanitize = () => {
        form.phone.value = String(form.phone.value || "").replace(/[^0-9+ ]/g, "");
      };
      form.phone.addEventListener("input", sanitize);
      form.phone.addEventListener("blur", sanitize);
      sanitize();
    }

    Object.values(form).forEach((el) => el && el.addEventListener("input", persistFields));
    restoreFields();

    const deliveryFeeEl = document.getElementById("deliveryFee");
    const subtotalEl = document.getElementById("cartSubtotal");
    const totalEl = document.getElementById("cartTotal");
    const placeOrderBtn = document.getElementById("placeOrderWhatsapp");

    const deliveryFee = () => {
      const base = 2500;
      const empty = getCart().length === 0;
      return empty ? 0 : base;
    };

    const render = () => {
      const cart = getCart();
      if (cart.length === 0) {
        root.innerHTML = `
          <div class="text-center py-5" style="color:rgba(255,255,255,.7)">
            <div class="mb-3" style="font-size:3rem; color:rgba(212,175,55,.85)"><i class="bi bi-bag"></i></div>
            <h3 class="mb-2" style="font-family: 'Playfair Display', serif;">Your cart is empty</h3>
            <div class="mb-4">Browse our premium collection and add your favourites.</div>
            <a href="${pagesPrefix()}shop.html" class="btn btn-gold">Go to Shop</a>
          </div>
        `;
      } else {
        root.innerHTML = cart
          .map(
            (x) => `
          <div class="cart-item-row d-flex gap-3 align-items-center py-3" style="border-bottom:1px solid rgba(255,255,255,.08)">
            <div class="cart-item-img" style="width:86px; height:86px; border-radius:16px; overflow:hidden; border:1px solid rgba(255,255,255,.12)">
              <img src="${x.image}" alt="${x.name}" style="width:100%; height:100%; object-fit:cover" />
            </div>
            <div class="cart-item-info flex-grow-1">
              <div class="fw-semibold">${x.name}</div>
              <div class="text-muted small">${x.brand || ""}</div>
              <div class="mt-1" style="color:rgba(212,175,55,.95)">${money(x.price)}</div>
            </div>
            <div class="cart-item-qty d-flex align-items-center gap-2">
              <button class="btn btn-sm btn-outline-light" data-qty-minus="${x.id}" aria-label="Decrease">-</button>
              <div style="min-width:34px; text-align:center">${x.qty}</div>
              <button class="btn btn-sm btn-outline-light" data-qty-plus="${x.id}" aria-label="Increase">+</button>
            </div>
            <div class="cart-item-totals text-end">
              <div class="fw-semibold">${money(Number(x.price) * Number(x.qty))}</div>
              <button class="btn btn-sm btn-outline-gold mt-2" data-remove-item="${x.id}"><i class="bi bi-trash"></i> Remove</button>
            </div>
          </div>
        `
          )
          .join("");
      }

      const sub = cartSubtotal();
      const del = deliveryFee();
      const tot = sub + del;

      if (deliveryFeeEl) deliveryFeeEl.textContent = money(del);
      if (subtotalEl) subtotalEl.textContent = money(sub);
      if (totalEl) totalEl.textContent = money(tot);

      if (placeOrderBtn) placeOrderBtn.disabled = cart.length === 0;
    };

    document.addEventListener("click", (e) => {
      const minus = e.target.closest("[data-qty-minus]");
      const plus = e.target.closest("[data-qty-plus]");
      const remove = e.target.closest("[data-remove-item]");

      if (minus) {
        const id = minus.getAttribute("data-qty-minus");
        const item = getCart().find((x) => x.id === id);
        if (item) updateQty(id, Math.max(1, Number(item.qty) - 1));
        render();
      }
      if (plus) {
        const id = plus.getAttribute("data-qty-plus");
        const item = getCart().find((x) => x.id === id);
        if (item) updateQty(id, Number(item.qty) + 1);
        render();
      }
      if (remove) {
        const id = remove.getAttribute("data-remove-item");
        removeFromCart(id);
        render();
      }
    });

    if (placeOrderBtn) {
      placeOrderBtn.addEventListener("click", () => {
        const cart = getCart();
        const sub = cartSubtotal();
        const del = deliveryFee();
        const tot = sub + del;

        const name = (form.name ? form.name.value : "").trim();
        const phone = (form.phone ? form.phone.value : "").trim();
        const location = (form.location ? form.location.value : "").trim();
        const note = (form.note ? form.note.value : "").trim();

        const lines = cart.map((x, i) => {
          const lineTotal = Number(x.price) * Number(x.qty);
          return `${i + 1}. ${x.name} x${x.qty} - ${money(lineTotal)}`;
        });

        const safe = (v) => String(v || "-").trim() || "-";
        const safeNote = (v) => {
          const t = String(v || "").trim();
          return t || "-";
        };

        const msg = [
          "Hello Chlyn’s Fragrance, I would like to place an order.",
          "",
          "*CUSTOMER DETAILS*",
          `Name: ${safe(name)}`,
          `Phone: ${safe(phone)}`,
          `Location: ${safe(location)}`,
          "",
          "*ORDER DETAILS*",
          ...lines,
          "",
          `Subtotal: ${money(sub)}`,
          `Delivery Fee: ${money(del)}`,
          "",
          `*TOTAL: ${money(tot)}*`,
          "",
          "*Additional Note:*",
          `_${safeNote(note)}_`,
        ].join("\n");

        const encoded = encodeURIComponent(msg).replace(/%0A/g, "%0D%0A");
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
        window.location.href = url;
      });
    }

    render();
  };

  const initPage = () => {
    setYear();
    updateCartCount();
    applySettingsOverrides();
    applyProductOverrides();
    initNavEffects();
    initThemeToggle();
    hideLoader();
    initAOS();
    bindGlobalProductActions();

    initHome();
    initShop();
    initProductDetails();
    initCartPage();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage);
  } else {
    initPage();
  }

  window.Chlyns = {
    PRODUCTS,
    getCart,
    setCart,
    addToCart,
    removeFromCart,
    updateQty,
    cartSubtotal,
    money,
  };
})();
