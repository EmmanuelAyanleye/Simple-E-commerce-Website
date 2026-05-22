(() => {
  const KEYS = {
    authed: "chlyns_admin_authed_v1",
    pass: "chlyns_admin_pass_v1",
    products: "chlyns_admin_products_v1",
    testimonials: "chlyns_admin_testimonials_v1",
    reviews: "chlyns_admin_reviews_v1",
    settings: "chlyns_admin_settings_v1",
    homepage: "chlyns_admin_homepage_v1",
    categories: "chlyns_admin_categories_v1",
    gallery: "chlyns_admin_gallery_v1",
  };

  const safeJsonParse = (raw, fallback) => {
    try {
      const v = JSON.parse(raw);
      return v ?? fallback;
    } catch {
      return fallback;
    }
  };

  const get = (k, fallback) => safeJsonParse(localStorage.getItem(k), fallback);
  const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const ensureDefaults = () => {
    if (!localStorage.getItem(KEYS.pass)) localStorage.setItem(KEYS.pass, "admin");
    if (!localStorage.getItem(KEYS.products)) set(KEYS.products, []);
    if (!localStorage.getItem(KEYS.testimonials)) set(KEYS.testimonials, []);
    if (!localStorage.getItem(KEYS.reviews)) set(KEYS.reviews, {});
    if (!localStorage.getItem(KEYS.settings)) {
      set(KEYS.settings, {
        platformName: "Chlyn’s Fragrance",
        logoUrl: "",
        contactEmail: "ayanleyeemmanuel5@gmail.com",
        whatsappNumber: "+2349046908664",
        address: "Porto-Novo, Benin Republic",
      });
    }
  };

  const inPagesFolder = () => {
    const p = String(window.location.pathname || "").replace(/\\/g, "/").toLowerCase();
    return p.includes("/admin/pages/");
  };

  const adminIndexHref = () => (inPagesFolder() ? "../index.html" : "index.html");
  const adminPagesHref = (pageFile) => (inPagesFolder() ? pageFile : `pages/${pageFile}`);

  const isAuthed = () => localStorage.getItem(KEYS.authed) === "1";
  const requireAuth = () => {
    if (!isAuthed()) window.location.href = adminIndexHref();
  };

  const formatMoney = (n) => {
    const v = Number(n || 0);
    return `₦${v.toLocaleString("en-NG")}`;
  };

  const page = () => document.body.getAttribute("data-admin-page") || "";

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const applyBranding = () => {
    const s = get(KEYS.settings, null);
    if (!s || typeof s !== "object" || Array.isArray(s)) return;

    const name = String(s.platformName || "").trim();
    const logoUrl = String(s.logoUrl || "").trim();

    if (name) {
      qsa(".admin-brand").forEach((el) => {
        if (el.getAttribute("data-brand-applied") === "1") return;
        el.textContent = name;
        el.setAttribute("data-brand-applied", "1");
      });
    }

    if (logoUrl) {
      qsa(".admin-brand").forEach((el) => {
        if (el.getAttribute("data-logo-applied") === "1") return;
        const label = name || String(el.textContent || "").trim() || "Admin";

        const img = document.createElement("img");
        img.src = logoUrl;
        img.alt = label;
        img.loading = "lazy";
        img.decoding = "async";
        img.style.height = "34px";
        img.style.width = "34px";
        img.style.objectFit = "contain";
        img.style.borderRadius = "10px";
        img.style.marginRight = "10px";
        img.style.display = "inline-block";
        img.style.verticalAlign = "middle";

        const span = document.createElement("span");
        span.textContent = label;

        el.textContent = "";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.gap = "10px";
        el.appendChild(img);
        el.appendChild(span);
        el.setAttribute("data-logo-applied", "1");
      });

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
  };

  const setActiveNav = () => {
    const p = page();
    qsa("[data-admin-nav]").forEach((a) => {
      a.classList.toggle("active", a.getAttribute("data-admin-nav") === p);
    });
  };

  const initShell = () => {
    const shell = qs(".admin-shell");
    if (!shell) return;

    const btn = qs("#adminMobileToggle");
    if (btn) {
      btn.addEventListener("click", () => shell.classList.toggle("sidebar-open"));
    }

    shell.addEventListener("click", (e) => {
      if (e.target === shell && shell.classList.contains("sidebar-open")) shell.classList.remove("sidebar-open");
    });

    const logout = qs("#adminLogout");
    if (logout) {
      logout.addEventListener("click", () => {
        localStorage.removeItem(KEYS.authed);
        window.location.href = adminIndexHref();
      });
    }

    applyBranding();
    setActiveNav();
  };

  const toast = (message, type = "success") => {
    const rootId = "adminToastRoot";
    let root = document.getElementById(rootId);
    if (!root) {
      root = document.createElement("div");
      root.id = rootId;
      root.className = "toast-container position-fixed top-0 end-0 p-3";
      root.style.zIndex = "9999";
      document.body.appendChild(root);
    }

    const el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-atomic", "true");

    const bg = type === "danger" ? "rgba(220,53,69,.92)" : "rgba(25,135,84,.92)";

    el.innerHTML = `
      <div class="toast-body" style="background:${bg}; color:#fff; border-radius:14px; border:1px solid rgba(255,255,255,.18)">
        <div class="d-flex align-items-center justify-content-between gap-2">
          <div style="font-weight:600">${message}</div>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `.trim();

    root.appendChild(el);
    const bs = window.bootstrap;
    if (!bs || !bs.Toast) return;
    const t = bs.Toast.getOrCreateInstance(el, { delay: 2400, autohide: true });
    el.addEventListener("hidden.bs.toast", () => el.remove());
    t.show();
  };

  const initLogin = () => {
    ensureDefaults();
    applyBranding();
    if (isAuthed()) {
      window.location.href = adminPagesHref("dashboard.html");
      return;
    }

    const form = qs("#adminLoginForm");
    const pass = qs("#adminPassword");
    const err = qs("#adminLoginError");

    if (!form || !pass) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const expected = localStorage.getItem(KEYS.pass) || "admin";
      const got = String(pass.value || "").trim();
      if (got && got === expected) {
        localStorage.setItem(KEYS.authed, "1");
        window.location.href = adminPagesHref("dashboard.html");
      } else {
        if (err) err.textContent = "Incorrect password.";
      }
    });
  };

  const importJson = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";

    const file = await new Promise((resolve) => {
      input.addEventListener("change", () => resolve(input.files && input.files[0] ? input.files[0] : null));
      input.click();
    });

    if (!file) return null;
    const raw = await file.text();
    return safeJsonParse(raw, null);
  };

  const downloadJson = (filename, data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const fileToDataUrl = (file) => {
    return new Promise((resolve) => {
      if (!file) {
        resolve("");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  const slugify = (text) => {
    return String(text || "")
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
  };

  const initDashboard = () => {
    requireAuth();
    ensureDefaults();
    initShell();

    const products = get(KEYS.products, []);
    const testimonials = get(KEYS.testimonials, []);
    const reviews = get(KEYS.reviews, {});

    const productsCount = qs("#kpiProducts");
    const testiCount = qs("#kpiTestimonials");
    const reviewCount = qs("#kpiReviews");

    const totalReviews = Object.values(reviews || {}).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

    if (productsCount) productsCount.textContent = String(products.length);
    if (testiCount) testiCount.textContent = String(testimonials.length);
    if (reviewCount) reviewCount.textContent = String(totalReviews);
  };

  const initProducts = () => {
    requireAuth();
    ensureDefaults();
    initShell();

    const table = qs("#productsTableBody");
    const empty = qs("#productsEmpty");

    const openModalBtn = qs("#openProductModal");
    const modalEl = qs("#productModal");
    const bs = window.bootstrap;
    const modal = modalEl && bs && bs.Modal ? bs.Modal.getOrCreateInstance(modalEl) : null;

    const filter = {
      q: qs("#productSearch"),
      cat: qs("#productFilterCategory"),
      min: qs("#productMinPrice"),
      max: qs("#productMaxPrice"),
      clear: qs("#productClearFilters"),
    };

    const form = qs("#productForm");
    const f = {
      id: qs("#pId"),
      name: qs("#pName"),
      brand: qs("#pBrand"),
      category: qs("#pCategory"),
      gender: qs("#pGender"),
      price: qs("#pPrice"),
      oldPrice: qs("#pOldPrice"),
      badge: qs("#pBadge"),
      rating: qs("#pRating"),
      notes: qs("#pNotes"),
      longevity: qs("#pLongevity"),
      imageFile: qs("#pImageFile"),
      imagePreview: qs("#pImagePreview"),
      galleryFiles: qs("#pGalleryFiles"),
      description: qs("#pDescription"),
    };

    const state = { editingId: null, currentImage: "", currentGallery: [] };

    const load = () => get(KEYS.products, []);
    const save = (items) => set(KEYS.products, items);

    const resetForm = () => {
      state.editingId = null;
      state.currentImage = "";
      state.currentGallery = [];
      if (form) form.reset();
      if (f.id) f.id.value = "";
      if (f.id) f.id.readOnly = false;
      const title = qs("#productFormTitle");
      if (title) title.textContent = "Add Product";
      const btn = qs("#productSaveBtn");
      if (btn) btn.textContent = "Save Product";

      if (f.imagePreview) {
        f.imagePreview.style.display = "none";
        f.imagePreview.src = "";
      }
    };

    const ensureId = () => {
      if (!f.id || state.editingId) return;
      const current = String(f.id.value || "").trim();
      if (current) return;
      const base = `${String(f.brand && f.brand.value ? f.brand.value : "").trim()} ${String(
        f.name && f.name.value ? f.name.value : ""
      ).trim()}`.trim();
      const slug = slugify(base);
      if (slug) f.id.value = slug;
    };

    const updateDiscountBadge = () => {
      if (!f.badge) return;
      const price = Number(f.price && f.price.value ? f.price.value : 0);
      const oldPrice = Number(f.oldPrice && f.oldPrice.value ? f.oldPrice.value : 0);
      if (!oldPrice || oldPrice <= 0 || !price || price <= 0 || oldPrice <= price) {
        if (!state.editingId) f.badge.value = "";
        return;
      }
      const pct = Math.round(((oldPrice - price) / oldPrice) * 100);
      if (!Number.isFinite(pct) || pct <= 0) return;
      f.badge.value = `-${pct}%`;
    };

    const toProductBase = () => {
      const id = String(f.id && f.id.value ? f.id.value : "").trim();
      return {
        id,
        name: String(f.name && f.name.value ? f.name.value : "").trim(),
        brand: String(f.brand && f.brand.value ? f.brand.value : "").trim(),
        category: String(f.category && f.category.value ? f.category.value : "").trim() || "all",
        price: Number(f.price && f.price.value ? f.price.value : 0),
        oldPrice: Number(f.oldPrice && f.oldPrice.value ? f.oldPrice.value : 0) || undefined,
        badge: String(f.badge && f.badge.value ? f.badge.value : "").trim() || undefined,
        rating: Number(f.rating && f.rating.value ? f.rating.value : 0) || undefined,
        notes: String(f.notes && f.notes.value ? f.notes.value : "").trim(),
        longevity: String(f.longevity && f.longevity.value ? f.longevity.value : "").trim(),
        gender: String(f.gender && f.gender.value ? f.gender.value : "").trim(),
        description: String(f.description && f.description.value ? f.description.value : "").trim(),
      };
    };

    const validate = (p) => {
      if (!p.id) return "Product ID is required.";
      if (!/^[a-z0-9-]+$/i.test(p.id)) return "Product ID should be letters/numbers/dashes only.";
      if (!p.name) return "Product name is required.";
      if (!p.price || p.price < 0) return "Price must be a valid number.";
      if (!p.image) return "Product image is required.";
      return "";
    };

    const applyFilters = (items) => {
      const q = String(filter.q && filter.q.value ? filter.q.value : "")
        .trim()
        .toLowerCase();
      const cat = String(filter.cat && filter.cat.value ? filter.cat.value : "all").trim();
      const min = Number(filter.min && filter.min.value ? filter.min.value : 0);
      const maxRaw = filter.max && filter.max.value ? Number(filter.max.value) : 999999999;
      const max = Number.isFinite(maxRaw) ? maxRaw : 999999999;

      return items.filter((p) => {
        const matchesQ =
          !q ||
          `${p.name || ""} ${p.brand || ""} ${p.notes || ""}`.toLowerCase().includes(q);
        const matchesCat = cat === "all" || String(p.category || "all") === cat;
        const price = Number(p.price || 0);
        const matchesPrice = price >= min && price <= max;
        return matchesQ && matchesCat && matchesPrice;
      });
    };

    const render = () => {
      const items = load();
      const filtered = applyFilters(items);
      if (empty) empty.classList.toggle("d-none", filtered.length !== 0);
      if (!table) return;
      table.innerHTML = filtered
        .map((p) => {
          const rating = p.rating ? String(p.rating) : "-";
          const cat = p.category || "-";
          return `
            <tr>
              <td><img class="admin-img" src="${p.image || ""}" alt="${p.name || ""}"></td>
              <td>
                <div style="font-weight:700">${p.name || "-"}</div>
                <div class="admin-muted" style="font-size:.9rem">${p.brand || ""}</div>
                <div class="admin-muted" style="font-size:.85rem">ID: <span style="color:rgba(255,255,255,.9)">${p.id}</span></div>
              </td>
              <td>${cat}</td>
              <td>${formatMoney(p.price)}</td>
              <td>${rating}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-gold" data-edit-product="${p.id}"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" data-del-product="${p.id}"><i class="bi bi-trash"></i></button>
              </td>
            </tr>
          `.trim();
        })
        .join("");
    };

    const fillForm = (p) => {
      state.editingId = p.id;
      state.currentImage = p.image || "";
      state.currentGallery = Array.isArray(p.gallery) ? p.gallery : [];
      if (f.id) f.id.value = p.id || "";
      if (f.id) f.id.readOnly = true;
      if (f.name) f.name.value = p.name || "";
      if (f.brand) f.brand.value = p.brand || "";
      if (f.category) f.category.value = p.category || "all";
      if (f.gender) f.gender.value = p.gender || "";
      if (f.price) f.price.value = p.price || 0;
      if (f.oldPrice) f.oldPrice.value = p.oldPrice || "";
      if (f.badge) f.badge.value = p.badge || "";
      if (f.rating) f.rating.value = p.rating || "";
      if (f.notes) f.notes.value = p.notes || "";
      if (f.longevity) f.longevity.value = p.longevity || "";
      if (f.description) f.description.value = p.description || "";

      if (f.imagePreview && state.currentImage) {
        f.imagePreview.src = state.currentImage;
        f.imagePreview.style.display = "block";
      }

      const title = qs("#productFormTitle");
      if (title) title.textContent = "Edit Product";
      const btn = qs("#productSaveBtn");
      if (btn) btn.textContent = "Update Product";
      if (modal) modal.show();
    };

    if (openModalBtn) openModalBtn.addEventListener("click", () => {
      resetForm();
      if (modal) modal.show();
    });

    if (f.name) f.name.addEventListener("input", ensureId);
    if (f.brand) f.brand.addEventListener("input", ensureId);
    if (f.price) f.price.addEventListener("input", updateDiscountBadge);
    if (f.oldPrice) f.oldPrice.addEventListener("input", updateDiscountBadge);

    if (f.imageFile && f.imagePreview) {
      f.imageFile.addEventListener("change", async () => {
        const file = f.imageFile.files && f.imageFile.files[0] ? f.imageFile.files[0] : null;
        const url = await fileToDataUrl(file);
        if (url) {
          state.currentImage = url;
          f.imagePreview.src = url;
          f.imagePreview.style.display = "block";
        }
      });
    }

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const items = load();
        const base = toProductBase();

        if (!base.id) ensureId();

        const file = f.imageFile && f.imageFile.files && f.imageFile.files[0] ? f.imageFile.files[0] : null;
        const uploaded = await fileToDataUrl(file);
        const image = uploaded || state.currentImage || "";

        const galleryFiles = f.galleryFiles && f.galleryFiles.files ? Array.from(f.galleryFiles.files) : [];
        const galleryUploaded = galleryFiles.length ? await Promise.all(galleryFiles.map(fileToDataUrl)) : [];
        const gallery = (galleryUploaded && galleryUploaded.filter(Boolean).length ? galleryUploaded : state.currentGallery) || [];

        const p = { ...base, image, gallery };
        const err = validate(p);
        if (err) {
          toast(err, "danger");
          return;
        }

        const existingIdx = items.findIndex((x) => x.id === p.id);
        if (state.editingId && state.editingId !== p.id) {
          toast("You changed the product ID. Please keep it the same while editing.", "danger");
          return;
        }

        if (!state.editingId && existingIdx >= 0) {
          toast("That product ID already exists.", "danger");
          return;
        }

        const next = state.editingId ? items.map((x) => (x.id === p.id ? p : x)) : [...items, p];
        save(next);
        render();
        toast(state.editingId ? "Product updated." : "Product added.");
        resetForm();
        if (modal) modal.hide();
      });
    }

    const resetBtn = qs("#productResetBtn");
    if (resetBtn) resetBtn.addEventListener("click", resetForm);

    [filter.q, filter.cat, filter.min, filter.max].forEach((el) => {
      if (!el) return;
      el.addEventListener("input", render);
      el.addEventListener("change", render);
    });
    if (filter.clear) {
      filter.clear.addEventListener("click", () => {
        if (filter.q) filter.q.value = "";
        if (filter.cat) filter.cat.value = "all";
        if (filter.min) filter.min.value = "";
        if (filter.max) filter.max.value = "";
        render();
      });
    }

    document.addEventListener("click", (e) => {
      const edit = e.target.closest("[data-edit-product]");
      const del = e.target.closest("[data-del-product]");

      if (edit) {
        const id = edit.getAttribute("data-edit-product");
        const items = load();
        const p = items.find((x) => x.id === id);
        if (p) fillForm(p);
      }

      if (del) {
        const id = del.getAttribute("data-del-product");
        const items = load();
        const next = items.filter((x) => x.id !== id);
        save(next);
        render();
        toast("Product deleted.");
      }
    });

    const exportBtn = qs("#exportProducts");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        downloadJson("chlyns-products.json", load());
      });
    }

    const importBtn = qs("#importProducts");
    if (importBtn) {
      importBtn.addEventListener("click", async () => {
        const data = await importJson();
        if (!Array.isArray(data)) {
          toast("Invalid products JSON.", "danger");
          return;
        }
        save(data);
        render();
        resetForm();
        toast("Products imported.");
      });
    }

    render();
  };

  const initHomepage = () => {
    requireAuth();
    ensureDefaults();
    initShell();

    const featuredList = qs("#featuredPickList");
    const bestList = qs("#bestPickList");
    const featuredCount = qs("#featuredCount");
    const bestCount = qs("#bestCount");

    const featuredSearch = qs("#homeFeaturedSearch");
    const featuredCat = qs("#homeFeaturedCategory");
    const bestSearch = qs("#homeBestSearch");
    const bestCat = qs("#homeBestCategory");

    const saveBtn = qs("#homepageSave");
    const resetBtn = qs("#homepageReset");

    const loadProducts = () => get(KEYS.products, []);
    const loadHome = () => get(KEYS.homepage, { featuredIds: [], bestSellerIds: [] });
    const saveHome = (v) => set(KEYS.homepage, v);

    const state = {
      featuredIds: [],
      bestSellerIds: [],
    };

    const fill = () => {
      const v = loadHome();
      state.featuredIds = Array.isArray(v.featuredIds) ? v.featuredIds : [];
      state.bestSellerIds = Array.isArray(v.bestSellerIds) ? v.bestSellerIds : [];
    };

    const matches = (p, q, cat) => {
      const qq = String(q || "").trim().toLowerCase();
      const matchesQ = !qq || `${p.name || ""} ${p.brand || ""}`.toLowerCase().includes(qq);
      const matchesCat = !cat || cat === "all" || String(p.category || "all") === String(cat);
      return matchesQ && matchesCat;
    };

    const renderCounts = () => {
      if (featuredCount) featuredCount.textContent = String(state.featuredIds.length);
      if (bestCount) bestCount.textContent = String(state.bestSellerIds.length);
    };

    const rowHtml = (p, checked, group) => {
      const id = String(p.id || "");
      const name = String(p.name || "-");
      const brand = String(p.brand || "");
      const cat = String(p.category || "-");
      const price = formatMoney(Number(p.price || 0));
      const dis = checked ? "checked" : "";
      return `
        <tr>
          <td>
            <input class="form-check-input" type="checkbox" data-homepick="${group}" data-id="${id}" ${dis} />
          </td>
          <td><img class="admin-img" src="${p.image || ""}" alt="${name}"></td>
          <td>
            <div style="font-weight:700">${name}</div>
            <div class="admin-muted" style="font-size:.9rem">${brand}</div>
            <div class="admin-muted" style="font-size:.85rem">ID: <span style="color:rgba(255,255,255,.9)">${id}</span></div>
          </td>
          <td>${cat}</td>
          <td class="text-end">${price}</td>
        </tr>
      `.trim();
    };

    const render = () => {
      const products = loadProducts();
      const fq = featuredSearch ? featuredSearch.value : "";
      const fc = featuredCat ? featuredCat.value : "all";
      const bq = bestSearch ? bestSearch.value : "";
      const bc = bestCat ? bestCat.value : "all";

      if (featuredList) {
        const rows = products
          .filter((p) => matches(p, fq, fc))
          .map((p) => rowHtml(p, state.featuredIds.includes(p.id), "featured"));
        featuredList.innerHTML = rows.join("");
      }

      if (bestList) {
        const rows = products
          .filter((p) => matches(p, bq, bc))
          .map((p) => rowHtml(p, state.bestSellerIds.includes(p.id), "best"));
        bestList.innerHTML = rows.join("");
      }

      renderCounts();
    };

    const togglePick = (group, id, checked) => {
      if (!id) return;
      if (group === "featured") {
        const next = checked
          ? Array.from(new Set([...state.featuredIds, id])).slice(0, 6)
          : state.featuredIds.filter((x) => x !== id);
        state.featuredIds = next;
      }
      if (group === "best") {
        const next = checked
          ? Array.from(new Set([...state.bestSellerIds, id])).slice(0, 12)
          : state.bestSellerIds.filter((x) => x !== id);
        state.bestSellerIds = next;
      }
    };

    fill();
    render();

    [featuredSearch, featuredCat, bestSearch, bestCat].forEach((el) => {
      if (!el) return;
      el.addEventListener("input", render);
      el.addEventListener("change", render);
    });

    document.addEventListener("change", (e) => {
      const cb = e.target && e.target.matches ? e.target : null;
      if (!cb || !cb.matches("[data-homepick]")) return;
      const group = cb.getAttribute("data-homepick");
      const id = cb.getAttribute("data-id");
      const checked = !!cb.checked;
      togglePick(group, id, checked);
      render();
    });

    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        saveHome({ featuredIds: state.featuredIds, bestSellerIds: state.bestSellerIds });
        toast("Homepage picks saved.");
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        state.featuredIds = [];
        state.bestSellerIds = [];
        render();
        toast("Selections cleared (not saved yet).");
      });
    }
  };

  const initCategories = () => {
    requireAuth();
    ensureDefaults();
    initShell();

    const table = qs("#categoriesTableBody");
    const empty = qs("#categoriesEmpty");
    const form = qs("#categoryForm");

    const f = {
      key: qs("#cKey"),
      title: qs("#cTitle"),
      subtitle: qs("#cSubtitle"),
      imageFile: qs("#cImageFile"),
      imagePreview: qs("#cImagePreview"),
      linkCategory: qs("#cLinkCategory"),
    };

    const titleEl = qs("#catFormTitle");
    const saveBtn = qs("#catSaveBtn");
    const resetBtn = qs("#catResetBtn");

    const load = () => get(KEYS.categories, []);
    const save = (items) => set(KEYS.categories, items);

    const state = { editingKey: null, currentImage: "" };

    const reset = () => {
      state.editingKey = null;
      state.currentImage = "";
      if (form) form.reset();
      if (titleEl) titleEl.textContent = "Add Category";
      if (saveBtn) saveBtn.textContent = "Save";
      if (f.imagePreview) {
        f.imagePreview.style.display = "none";
        f.imagePreview.src = "";
      }
    };

    const fillLinkCategoryOptions = () => {
      if (!f.linkCategory) return;
      const products = get(KEYS.products, []);
      const cats = Array.from(new Set(products.map((p) => String(p.category || "all")))).filter(Boolean);
      const options = ["", ...cats];
      f.linkCategory.innerHTML = options
        .map((c) => {
          const label = c ? c : "(use key)";
          return `<option value="${c}">${label}</option>`;
        })
        .join("");
    };

    const validate = (item, items) => {
      if (!item.key) return "Category key is required.";
      if (!/^[a-z0-9-]+$/i.test(item.key)) return "Category key should be letters/numbers/dashes only.";
      if (!item.title) return "Category title is required.";
      if (!item.image) return "Category image is required.";
      const exists = items.some((x) => x.key === item.key);
      if (!state.editingKey && exists) return "That category key already exists.";
      if (state.editingKey && state.editingKey !== item.key) return "Category key cannot be changed while editing.";
      return "";
    };

    const render = () => {
      const items = load();
      if (empty) empty.style.display = items.length ? "none" : "block";
      if (!table) return;
      table.innerHTML = items
        .map((c) => {
          const key = String(c.key || "");
          const title = String(c.title || "");
          const subtitle = String(c.subtitle || "");
          return `
            <tr>
              <td><img class="admin-img" src="${c.image || ""}" alt="${title}"></td>
              <td>
                <div style="font-weight:700">${title}</div>
                <div class="admin-muted" style="font-size:.9rem">${subtitle}</div>
              </td>
              <td>${key}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-gold" data-edit-cat="${key}"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" data-del-cat="${key}"><i class="bi bi-trash"></i></button>
              </td>
            </tr>
          `.trim();
        })
        .join("");
    };

    const fillForm = (c) => {
      state.editingKey = c.key;
      state.currentImage = c.image || "";
      if (f.key) {
        f.key.value = c.key || "";
        f.key.readOnly = true;
      }
      if (f.title) f.title.value = c.title || "";
      if (f.subtitle) f.subtitle.value = c.subtitle || "";
      if (f.linkCategory) f.linkCategory.value = c.linkCategory || "";
      if (f.imagePreview && state.currentImage) {
        f.imagePreview.src = state.currentImage;
        f.imagePreview.style.display = "block";
      }
      if (titleEl) titleEl.textContent = "Edit Category";
      if (saveBtn) saveBtn.textContent = "Update";
    };

    fillLinkCategoryOptions();
    render();

    if (f.imageFile && f.imagePreview) {
      f.imageFile.addEventListener("change", async () => {
        const file = f.imageFile.files && f.imageFile.files[0] ? f.imageFile.files[0] : null;
        const url = await fileToDataUrl(file);
        if (!url) return;
        state.currentImage = url;
        f.imagePreview.src = url;
        f.imagePreview.style.display = "block";
      });
    }

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const items = load();
        const key = String(f.key && f.key.value ? f.key.value : "").trim();
        const uploaded = await fileToDataUrl(
          f.imageFile && f.imageFile.files && f.imageFile.files[0] ? f.imageFile.files[0] : null
        );
        const image = uploaded || state.currentImage || "";
        const linkCategory = String(f.linkCategory && f.linkCategory.value ? f.linkCategory.value : "").trim();
        const item = {
          key,
          title: String(f.title && f.title.value ? f.title.value : "").trim(),
          subtitle: String(f.subtitle && f.subtitle.value ? f.subtitle.value : "").trim(),
          image,
          linkCategory,
        };
        const err = validate(item, items);
        if (err) {
          toast(err, "danger");
          return;
        }

        const next = state.editingKey
          ? items.map((x) => (x.key === item.key ? item : x))
          : [...items, item];
        save(next);
        toast(state.editingKey ? "Category updated." : "Category added.");
        reset();
        if (f.key) f.key.readOnly = false;
        render();
      });
    }

    if (resetBtn) resetBtn.addEventListener("click", () => {
      reset();
      if (f.key) f.key.readOnly = false;
    });

    document.addEventListener("click", (e) => {
      const edit = e.target.closest("[data-edit-cat]");
      const del = e.target.closest("[data-del-cat]");
      if (edit) {
        const key = edit.getAttribute("data-edit-cat");
        const items = load();
        const item = items.find((x) => x.key === key);
        if (item) fillForm(item);
      }
      if (del) {
        const key = del.getAttribute("data-del-cat");
        const items = load();
        save(items.filter((x) => x.key !== key));
        render();
        toast("Category deleted.");
      }
    });

    const exportBtn = qs("#exportCategories");
    if (exportBtn) exportBtn.addEventListener("click", () => downloadJson("chlyns-categories.json", load()));

    const importBtn = qs("#importCategories");
    if (importBtn) {
      importBtn.addEventListener("click", async () => {
        const data = await importJson();
        if (!Array.isArray(data)) {
          toast("Invalid categories JSON.", "danger");
          return;
        }
        save(data);
        reset();
        if (f.key) f.key.readOnly = false;
        render();
        toast("Categories imported.");
      });
    }
  };

  const initGallery = () => {
    requireAuth();
    ensureDefaults();
    initShell();

    const files = qs("#igFiles");
    const addBtn = qs("#igAddBtn");
    const clearBtn = qs("#igClearBtn");
    const grid = qs("#igGrid");
    const count = qs("#igCount");

    const load = () => get(KEYS.gallery, []);
    const save = (items) => {
      try {
        set(KEYS.gallery, items);
        return true;
      } catch {
        toast(
          "Gallery could not be saved (storage full). Try fewer/smaller images or clear old gallery items.",
          "danger"
        );
        return false;
      }
    };

    const render = () => {
      const items = load();
      if (count) count.textContent = String(items.length);
      if (!grid) return;
      grid.innerHTML = items
        .map(
          (src, idx) => `
          <div class="col-6 col-md-4 col-lg-3">
            <div class="admin-card" style="overflow:hidden;">
              <div class="ratio ratio-1x1">
                <img src="${src}" alt="Gallery image" style="width:100%; height:100%; object-fit:cover;" />
              </div>
              <div class="admin-card-body" style="padding:10px;">
                <button class="btn btn-sm btn-outline-danger w-100" data-del-ig="${idx}"><i class="bi bi-trash"></i> Remove</button>
              </div>
            </div>
          </div>
        `.trim()
        )
        .join("");
    };

    if (addBtn) {
      addBtn.addEventListener("click", async () => {
        const list = files && files.files ? Array.from(files.files) : [];
        if (!list.length) {
          toast("Please choose images to upload.", "danger");
          return;
        }
        const urls = await Promise.all(list.map(fileToDataUrl));
        const items = load();
        const next = [...items, ...urls.filter(Boolean)];
        const ok = save(next);
        if (!ok) return;
        if (files) files.value = "";
        render();
        toast("Gallery updated.");
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        const ok = save([]);
        if (!ok) return;
        render();
        toast("Gallery cleared.");
      });
    }

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-del-ig]");
      if (!btn) return;
      const idx = Number(btn.getAttribute("data-del-ig"));
      const items = load();
      if (!Number.isFinite(idx)) return;
      const ok = save(items.filter((_, i) => i !== idx));
      if (!ok) return;
      render();
      toast("Image removed.");
    });

    const exportBtn = qs("#exportGallery");
    if (exportBtn) exportBtn.addEventListener("click", () => downloadJson("chlyns-gallery.json", load()));

    const importBtn = qs("#importGallery");
    if (importBtn) {
      importBtn.addEventListener("click", async () => {
        const data = await importJson();
        if (!Array.isArray(data)) {
          toast("Invalid gallery JSON.", "danger");
          return;
        }
        const ok = save(data);
        if (!ok) return;
        render();
        toast("Gallery imported.");
      });
    }

    render();
  };

  const initTestimonials = () => {
    requireAuth();
    ensureDefaults();
    initShell();

    const list = qs("#testimonialsList");
    const form = qs("#testimonialForm");
    const stars = qs("#tStars");
    const quote = qs("#tQuote");
    const author = qs("#tAuthor");

    const load = () => get(KEYS.testimonials, []);
    const save = (items) => set(KEYS.testimonials, items);

    const render = () => {
      const items = load();
      if (!list) return;
      list.innerHTML = items
        .map(
          (t, i) => `
        <div class="admin-card" style="margin-bottom:12px;">
          <div class="admin-card-body">
            <div class="d-flex justify-content-between gap-2">
              <div>
                <div style="font-weight:800">${t.stars || "★★★★★"}</div>
                <div style="margin-top:8px;">${t.quote || ""}</div>
                <div class="admin-muted" style="margin-top:10px;">— ${t.author || ""}</div>
              </div>
              <div class="d-flex gap-2" style="height:max-content">
                <button class="btn btn-sm btn-outline-gold" data-edit-testi="${i}"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" data-del-testi="${i}"><i class="bi bi-trash"></i></button>
              </div>
            </div>
          </div>
        </div>
      `.trim()
        )
        .join("");
    };

    const state = { idx: null };

    const reset = () => {
      state.idx = null;
      if (form) form.reset();
      const title = qs("#testiFormTitle");
      if (title) title.textContent = "Add Testimonial";
      const btn = qs("#testiSaveBtn");
      if (btn) btn.textContent = "Save";
    };

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const item = {
          stars: String(stars && stars.value ? stars.value : "★★★★★").trim() || "★★★★★",
          quote: String(quote && quote.value ? quote.value : "").trim(),
          author: String(author && author.value ? author.value : "").trim(),
        };
        if (!item.quote || !item.author) {
          toast("Quote and author are required.", "danger");
          return;
        }

        const items = load();
        const next = state.idx === null ? [...items, item] : items.map((x, i) => (i === state.idx ? item : x));
        save(next);
        render();
        reset();
        toast(state.idx === null ? "Testimonial added." : "Testimonial updated.");
      });
    }

    document.addEventListener("click", (e) => {
      const edit = e.target.closest("[data-edit-testi]");
      const del = e.target.closest("[data-del-testi]");
      if (edit) {
        const idx = Number(edit.getAttribute("data-edit-testi"));
        const items = load();
        const t = items[idx];
        if (!t) return;
        state.idx = idx;
        if (stars) stars.value = t.stars || "★★★★★";
        if (quote) quote.value = t.quote || "";
        if (author) author.value = t.author || "";
        const title = qs("#testiFormTitle");
        if (title) title.textContent = "Edit Testimonial";
        const btn = qs("#testiSaveBtn");
        if (btn) btn.textContent = "Update";
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      if (del) {
        const idx = Number(del.getAttribute("data-del-testi"));
        const items = load();
        save(items.filter((_, i) => i !== idx));
        render();
        reset();
        toast("Testimonial deleted.");
      }
    });

    const resetBtn = qs("#testiResetBtn");
    if (resetBtn) resetBtn.addEventListener("click", reset);

    const exportBtn = qs("#exportTestimonials");
    if (exportBtn) exportBtn.addEventListener("click", () => downloadJson("chlyns-testimonials.json", load()));

    const importBtn = qs("#importTestimonials");
    if (importBtn) {
      importBtn.addEventListener("click", async () => {
        const data = await importJson();
        if (!Array.isArray(data)) {
          toast("Invalid testimonials JSON.", "danger");
          return;
        }
        save(data);
        render();
        reset();
        toast("Testimonials imported.");
      });
    }

    render();
  };

  const initReviews = () => {
    requireAuth();
    ensureDefaults();
    initShell();

    const products = get(KEYS.products, []);
    const reviewsAll = get(KEYS.reviews, {});

    const productSel = qs("#reviewProduct");
    const list = qs("#reviewsList");
    const form = qs("#reviewForm");
    const stars = qs("#rStars");
    const who = qs("#rWho");
    const text = qs("#rText");

    if (productSel) {
      productSel.innerHTML = [
        `<option value="">Select product</option>`,
        ...products.map((p) => `<option value="${p.id}">${p.name}</option>`),
      ].join("");
    }

    const getFor = (pid) => {
      const arr = reviewsAll && pid ? reviewsAll[pid] : [];
      return Array.isArray(arr) ? arr : [];
    };

    const setFor = (pid, arr) => {
      const next = { ...(reviewsAll || {}) };
      next[pid] = arr;
      set(KEYS.reviews, next);
      Object.assign(reviewsAll, next);
    };

    const state = { idx: null };

    const render = () => {
      const pid = productSel ? productSel.value : "";
      const items = pid ? getFor(pid) : [];
      if (!list) return;
      if (!pid) {
        list.innerHTML = `<div class="admin-muted">Select a product to view/edit its reviews.</div>`;
        return;
      }
      list.innerHTML = items
        .map(
          (r, i) => `
          <div class="admin-card" style="margin-bottom:12px;">
            <div class="admin-card-body">
              <div class="d-flex justify-content-between gap-2">
                <div>
                  <div style="font-weight:800">${"★★★★★".slice(0, Number(r.stars || 5))}</div>
                  <div style="margin-top:8px;">${r.text || ""}</div>
                  <div class="admin-muted" style="margin-top:10px;">— ${r.who || ""}</div>
                </div>
                <div class="d-flex gap-2" style="height:max-content">
                  <button class="btn btn-sm btn-outline-gold" data-edit-review="${i}"><i class="bi bi-pencil"></i></button>
                  <button class="btn btn-sm btn-outline-danger" data-del-review="${i}"><i class="bi bi-trash"></i></button>
                </div>
              </div>
            </div>
          </div>
        `.trim()
        )
        .join("");
    };

    const reset = () => {
      state.idx = null;
      if (form) form.reset();
      const title = qs("#reviewFormTitle");
      if (title) title.textContent = "Add Review";
      const btn = qs("#reviewSaveBtn");
      if (btn) btn.textContent = "Save";
    };

    if (productSel) productSel.addEventListener("change", () => {
      reset();
      render();
    });

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const pid = productSel ? productSel.value : "";
        if (!pid) {
          toast("Select a product first.", "danger");
          return;
        }
        const item = {
          stars: Number(stars && stars.value ? stars.value : 5),
          who: String(who && who.value ? who.value : "Verified Customer").trim() || "Verified Customer",
          text: String(text && text.value ? text.value : "").trim(),
        };
        if (!item.text) {
          toast("Review text is required.", "danger");
          return;
        }
        const items = getFor(pid);
        const next = state.idx === null ? [...items, item] : items.map((x, i) => (i === state.idx ? item : x));
        setFor(pid, next);
        render();
        reset();
        toast(state.idx === null ? "Review added." : "Review updated.");
      });
    }

    document.addEventListener("click", (e) => {
      const edit = e.target.closest("[data-edit-review]");
      const del = e.target.closest("[data-del-review]");
      const pid = productSel ? productSel.value : "";
      if (!pid) return;
      if (edit) {
        const idx = Number(edit.getAttribute("data-edit-review"));
        const items = getFor(pid);
        const r = items[idx];
        if (!r) return;
        state.idx = idx;
        if (stars) stars.value = r.stars || 5;
        if (who) who.value = r.who || "Verified Customer";
        if (text) text.value = r.text || "";
        const title = qs("#reviewFormTitle");
        if (title) title.textContent = "Edit Review";
        const btn = qs("#reviewSaveBtn");
        if (btn) btn.textContent = "Update";
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      if (del) {
        const idx = Number(del.getAttribute("data-del-review"));
        const items = getFor(pid);
        setFor(pid, items.filter((_, i) => i !== idx));
        render();
        reset();
        toast("Review deleted.");
      }
    });

    const resetBtn = qs("#reviewResetBtn");
    if (resetBtn) resetBtn.addEventListener("click", reset);

    const exportBtn = qs("#exportReviews");
    if (exportBtn) exportBtn.addEventListener("click", () => downloadJson("chlyns-reviews.json", get(KEYS.reviews, {})));

    const importBtn = qs("#importReviews");
    if (importBtn) {
      importBtn.addEventListener("click", async () => {
        const data = await importJson();
        if (!data || typeof data !== "object" || Array.isArray(data)) {
          toast("Invalid reviews JSON.", "danger");
          return;
        }
        set(KEYS.reviews, data);
        Object.assign(reviewsAll, data);
        render();
        reset();
        toast("Reviews imported.");
      });
    }

    render();
  };

  const initSettings = () => {
    requireAuth();
    ensureDefaults();
    initShell();

    const form = qs("#settingsForm");
    const s = {
      platformName: qs("#sPlatformName"),
      logoFile: qs("#sLogoFile"),
      logoPreview: qs("#sLogoPreview"),
      contactEmail: qs("#sEmail"),
      whatsappNumber: qs("#sWhatsapp"),
      instagramUrl: qs("#sInstagram"),
      facebookUrl: qs("#sFacebook"),
      tiktokUrl: qs("#sTiktok"),
      address: qs("#sAddress"),
      password: qs("#sPassword"),
    };

    let currentLogo = "";

    const load = () => get(KEYS.settings, {});

    const fill = () => {
      const v = load();
      if (s.platformName) s.platformName.value = v.platformName || "";
      currentLogo = v.logoUrl || "";
      if (s.logoPreview && currentLogo) {
        s.logoPreview.src = currentLogo;
        s.logoPreview.style.display = "block";
      }
      if (s.logoPreview && !currentLogo) {
        s.logoPreview.src = "";
        s.logoPreview.style.display = "none";
      }
      if (s.contactEmail) s.contactEmail.value = v.contactEmail || "";
      if (s.whatsappNumber) s.whatsappNumber.value = v.whatsappNumber || "";
      if (s.instagramUrl) s.instagramUrl.value = v.instagramUrl || "";
      if (s.facebookUrl) s.facebookUrl.value = v.facebookUrl || "";
      if (s.tiktokUrl) s.tiktokUrl.value = v.tiktokUrl || "";
      if (s.address) s.address.value = v.address || "";
    };

    fill();

    if (s.logoFile && s.logoPreview) {
      s.logoFile.addEventListener("change", async () => {
        const file = s.logoFile.files && s.logoFile.files[0] ? s.logoFile.files[0] : null;
        const url = await fileToDataUrl(file);
        if (!url) return;
        currentLogo = url;
        s.logoPreview.src = url;
        s.logoPreview.style.display = "block";
      });
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const next = {
          platformName: String(s.platformName && s.platformName.value ? s.platformName.value : "").trim() || "Chlyn’s Fragrance",
          logoUrl: String(currentLogo || "").trim(),
          contactEmail: String(s.contactEmail && s.contactEmail.value ? s.contactEmail.value : "").trim(),
          whatsappNumber: String(s.whatsappNumber && s.whatsappNumber.value ? s.whatsappNumber.value : "").trim(),
          instagramUrl: String(s.instagramUrl && s.instagramUrl.value ? s.instagramUrl.value : "").trim(),
          facebookUrl: String(s.facebookUrl && s.facebookUrl.value ? s.facebookUrl.value : "").trim(),
          tiktokUrl: String(s.tiktokUrl && s.tiktokUrl.value ? s.tiktokUrl.value : "").trim(),
          address: String(s.address && s.address.value ? s.address.value : "").trim(),
        };
        set(KEYS.settings, next);

        const nextPass = String(s.password && s.password.value ? s.password.value : "").trim();
        if (nextPass) localStorage.setItem(KEYS.pass, nextPass);

        toast("Settings saved.");
        fill();
        if (s.password) s.password.value = "";
      });
    }

    const exportBtn = qs("#exportAll");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        downloadJson("chlyns-admin-export.json", {
          settings: get(KEYS.settings, {}),
          products: get(KEYS.products, []),
          testimonials: get(KEYS.testimonials, []),
          reviews: get(KEYS.reviews, {}),
        });
      });
    }

    const importBtn = qs("#importAll");
    if (importBtn) {
      importBtn.addEventListener("click", async () => {
        const data = await importJson();
        if (!data || typeof data !== "object") {
          toast("Invalid export JSON.", "danger");
          return;
        }
        if (data.settings) set(KEYS.settings, data.settings);
        if (data.products) set(KEYS.products, data.products);
        if (data.testimonials) set(KEYS.testimonials, data.testimonials);
        if (data.reviews) set(KEYS.reviews, data.reviews);
        toast("Import completed.");
        fill();
      });
    }

    const clearBtn = qs("#clearAdminData");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        localStorage.removeItem(KEYS.products);
        localStorage.removeItem(KEYS.testimonials);
        localStorage.removeItem(KEYS.reviews);
        localStorage.removeItem(KEYS.settings);
        toast("Admin data cleared. Reloading…");
        setTimeout(() => window.location.reload(), 800);
      });
    }
  };

  const init = () => {
    const p = page();
    if (p === "login") initLogin();
    if (p === "dashboard") initDashboard();
    if (p === "products") initProducts();
    if (p === "homepage") initHomepage();
    if (p === "categories") initCategories();
    if (p === "gallery") initGallery();
    if (p === "testimonials") initTestimonials();
    if (p === "reviews") initReviews();
    if (p === "settings") initSettings();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
