// ═══════════════════════════════════════════════════
// FULLPAGE SCROLL SYSTEM
// ═══════════════════════════════════════════════════
const container = document.getElementById('scrollContainer');
const pages = document.querySelectorAll('.page');
const dots = document.querySelectorAll('.side-dot');
const navLinks = document.querySelectorAll('.nav-link');
const mobileLinks = document.querySelectorAll('.mobile-menu-link');
const topNav = document.getElementById('topNav');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
let currentPage = 0;
let isScrolling = false;
const totalPages = pages.length;
const isMobile = () => window.innerWidth <= 768;
let previousFocus = null;

function scrollToPage(index) {
  if (index < 0 || index >= totalPages) return;

  const menuWasOpen = mobileMenu.classList.contains('open');
  closeMobileMenu();

  const doScroll = () => {
    currentPage = index;
    if (isMobile()) {
      // On mobile, use container.scrollTo() — scrollIntoView conflicts with scroll-snap
      container.scrollTo({
        top: pages[index].offsetTop,
        behavior: 'smooth'
      });
    } else {
      pages[currentPage].scrollIntoView({ behavior: 'smooth' });
    }
    updateNav();
  };

  if (menuWasOpen) {
    setTimeout(doScroll, 250);
  } else {
    doScroll();
  }
}

function updateNav() {
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentPage);
    dot.setAttribute('aria-current', i === currentPage ? 'page' : 'false');
  });
  navLinks.forEach((link, i) => {
    link.classList.toggle('active', i === currentPage);
    link.setAttribute('aria-current', i === currentPage ? 'page' : 'false');
  });
  mobileLinks.forEach((link, i) => {
    link.classList.toggle('active', i === currentPage);
    link.setAttribute('aria-current', i === currentPage ? 'page' : 'false');
  });
  topNav.classList.toggle('scrolled', currentPage > 0);
}

// ═══════════════════════════════════════════════════
// HAMBURGER MENU
// ═══════════════════════════════════════════════════
function toggleMobileMenu() {
  const isOpen = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
  hamburger.classList.remove('open');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', toggleMobileMenu);
mobileLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    scrollToPage(parseInt(link.dataset.page));
  });
});

// ═══════════════════════════════════════════════════
// SCROLL HANDLING
// ═══════════════════════════════════════════════════

// Wheel handler with debounce (desktop only)
let wheelAccum = 0;
let wheelTimeout = null;

container.addEventListener('wheel', (e) => {
  // On mobile, don't intercept — let natural scroll + proximity snap handle it
  if (isMobile()) return;

  e.preventDefault();
  if (isScrolling) return;

  wheelAccum += e.deltaY;
  clearTimeout(wheelTimeout);
  wheelTimeout = setTimeout(() => { wheelAccum = 0; }, 150);

  const threshold = 80;
  if (Math.abs(wheelAccum) >= threshold) {
    const direction = wheelAccum > 0 ? 1 : -1;
    const targetPage = Math.max(0, Math.min(totalPages - 1, currentPage + direction));
    if (targetPage !== currentPage) {
      isScrolling = true;
      currentPage = targetPage;
      pages[currentPage].scrollIntoView({ behavior: 'smooth' });
      updateNav();
      wheelAccum = 0;
      setTimeout(() => { isScrolling = false; }, 800);
    }
  }
}, { passive: false });

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (document.getElementById('modalOverlay').classList.contains('active')) {
    if (e.key === 'Escape') closeModal();
    return;
  }
  if (mobileMenu.classList.contains('open') && e.key === 'Escape') {
    closeMobileMenu();
    return;
  }
  if (e.key === 'ArrowDown' || e.key === 'PageDown') {
    e.preventDefault();
    scrollToPage(Math.min(totalPages - 1, currentPage + 1));
  } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
    e.preventDefault();
    scrollToPage(Math.max(0, currentPage - 1));
  } else if (e.key === 'Home') {
    e.preventDefault();
    scrollToPage(0);
  } else if (e.key === 'End') {
    e.preventDefault();
    scrollToPage(totalPages - 1);
  }
});

// Touch support — improved with swipe tracking
let touchStartY = 0;
let touchStartX = 0;
let touchStartTime = 0;

container.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
  touchStartX = e.touches[0].clientX;
  touchStartTime = Date.now();
}, { passive: true });

container.addEventListener('touchend', (e) => {
  // On mobile, let natural scroll handle it — no forced page jump
  if (isMobile()) return;

  const touchEndY = e.changedTouches[0].clientY;
  const touchEndX = e.changedTouches[0].clientX;
  const diffY = touchStartY - touchEndY;
  const diffX = touchStartX - touchEndX;
  const elapsed = Date.now() - touchStartTime;

  // Only respond to vertical swipes (not horizontal scrolling or taps)
  if (Math.abs(diffY) > 50 && Math.abs(diffY) > Math.abs(diffX) * 1.5 && elapsed < 500) {
    const direction = diffY > 0 ? 1 : -1;
    const targetPage = Math.max(0, Math.min(totalPages - 1, currentPage + direction));
    if (targetPage !== currentPage) {
      isScrolling = true;
      currentPage = targetPage;
      pages[currentPage].scrollIntoView({ behavior: 'smooth' });
      updateNav();
      setTimeout(() => { isScrolling = false; }, 600);
    }
  }
}, { passive: true });

// Click handlers for dots and nav links
dots.forEach(dot => dot.addEventListener('click', () => scrollToPage(parseInt(dot.dataset.page))));
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    scrollToPage(parseInt(link.dataset.page));
  });
});

// ═══════════════════════════════════════════════════
// PAGE TRACKER — IntersectionObserver for nav sync
// Works on both desktop and mobile
// ═══════════════════════════════════════════════════
const pageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const idx = Array.from(pages).indexOf(entry.target);
      if (idx >= 0 && idx !== currentPage) {
        currentPage = idx;
        updateNav();
      }
    }
  });
}, {
  threshold: 0.5,
  root: container
});

pages.forEach(page => pageObserver.observe(page));

// ═══════════════════════════════════════════════════
// SCROLL REVEAL
// ═══════════════════════════════════════════════════
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      entry.target.querySelectorAll('[data-count]').forEach(el => animateNumber(el));
    }
  });
}, { threshold: 0.15, root: container });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ═══════════════════════════════════════════════════
// NUMBER ANIMATION
// ═══════════════════════════════════════════════════
function animateNumber(el) {
  if (el.dataset.animated) return;
  el.dataset.animated = 'true';
  const target = parseFloat(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const duration = 1400;
  const start = performance.now();

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = target * eased;
    el.textContent = (target % 1 !== 0 ? current.toFixed(1) : Math.round(current)) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ═══════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════
const projectDetails = {
  legalpath: {
    title: 'LegalPath 法律信息服务平台',
    subtitle: '项目负责人 · 2026.02 — 2026.04',
    link: 'https://www.figma.com/proto/Rj5Lql3m3IYTeFnTAeBp9r/9511?node-id=0-1&t=X6SytEE3NYDPclJG-1',
    linkLabel: '查看原型',
    body: `<p><strong>用户调研与需求分析：</strong>通过问卷调查与竞品分析，识别用户在信息理解、搜索效率及可访问性方面的痛点；结合用户画像与使用场景梳理核心需求。</p>
    <p><strong>信息架构与交互设计：</strong>构建8大核心页面结构，优化导航逻辑与页面层级，降低用户搜索成本；设计搜索建议、案例筛选及流程进度可视化。</p>
    <p><strong>UI界面设计：</strong>基于Figma完成高保真界面设计，统一视觉风格（配色、字体、组件系统），提升界面一致性与可读性。</p>
    <p><strong>无障碍优化：</strong>引入字体放大、语音朗读、高对比度模式及屏幕阅读器支持；基于认知负荷理论优化信息呈现。</p>`
  },
  cileme: {
    title: '【辞了么】职场情绪打卡APP',
    subtitle: '核心项目成员 · 2026.01 — 2026.03',
    link: 'https://apps.apple.com/cn/app/%E8%BE%9E%E4%BA%86%E6%B2%A1/id6760989161',
    linkLabel: 'App Store',
    body: `<p><strong>项目背景：</strong>面向职场人群打造趣味化职场情绪打卡产品，以每日打卡形式实现职场情绪轻量化记录与正向疏导。</p>
    <p><strong>市场调研：</strong>利用AI工具完成用户画像深度剖析，借助ChatGPT进行需求梳理与文档撰写，项目交付效率提升70%。</p>
    <p><strong>AI原型设计：</strong>使用AI原型工具Stitch，基于产品需求快速输出可交互原型。</p>
    <p><strong>AI设计流程：</strong>搭建AI赋能的产品设计全流程，覆盖调研、需求、原型、文档等环节，形成标准化设计模式。</p>`
  },
  hospital: {
    title: '基于微信小程序的医院预约挂号系统',
    subtitle: '项目负责人 · 2022.11 — 2023.05',
    body: `<p><strong>项目背景：</strong>解决传统医院挂号导诊效率低、管理不规范等痛点，搭建整合云数据库技术的智能导诊系统。</p>
    <p><strong>技术选型：</strong>采用云数据库作为后台存储方案，保障数据安全保密，降低维护成本。</p>
    <p><strong>产品设计：</strong>支持医生检索、科室详情及预约时段选择；提供基于身体不适部位的智能导诊服务。</p>
    <p><strong>后台管理：</strong>搭建Web端后台管理页面，实现挂号导诊全流程规范化管控。</p>`
  }
};

function openModal(id) {
  const data = projectDetails[id];
  if (!data) return;
  previousFocus = document.activeElement;
  document.getElementById('modalInner').innerHTML = `
    <div class="modal-title">${data.title}</div>
    <div class="modal-subtitle">${data.subtitle}</div>
    <div class="modal-body">${data.body}</div>
    ${data.link ? `<a class="modal-link" href="${data.link}" target="_blank" rel="noopener noreferrer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>${data.linkLabel || '访问项目'}</a>` : ''}
  `;
  document.getElementById('modalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
  const closeBtn = document.querySelector('.modal-close');
  if (closeBtn) setTimeout(() => closeBtn.focus(), 100);
  document.addEventListener('keydown', trapModalFocus);
}

function closeModal(event) {
  if (event && event.target !== event.currentTarget && event.target.closest('.modal-close') === null) return;
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
  document.removeEventListener('keydown', trapModalFocus);
  if (previousFocus) previousFocus.focus();
}

function trapModalFocus(e) {
  if (e.key !== 'Tab') return;
  const modal = document.querySelector('.modal');
  const focusable = modal.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
  } else {
    if (document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
}

// ═══════════════════════════════════════════════════
// COPY TO CLIPBOARD
// ═══════════════════════════════════════════════════
function copyToClipboard(text, el) {
  const val = el.querySelector('.contact-value');
  const orig = val.textContent;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      val.textContent = '已复制 ✓';
      setTimeout(() => { val.textContent = orig; }, 1200);
    }).catch(() => {
      // Fallback for iOS
      fallbackCopy(text, val, orig);
    });
  } else {
    fallbackCopy(text, val, orig);
  }
}

function fallbackCopy(text, val, orig) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    val.textContent = '已复制 ✓';
    setTimeout(() => { val.textContent = orig; }, 1200);
  } catch (e) {
    val.textContent = '复制失败';
    setTimeout(() => { val.textContent = orig; }, 1200);
  }
  document.body.removeChild(textarea);
}

// ═══════════════════════════════════════════════════
// RESIZE HANDLER — Re-snap on orientation change
// ═══════════════════════════════════════════════════
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    // On mobile, don't force snap — just update nav
    if (!isMobile()) {
      pages[currentPage].scrollIntoView({ behavior: 'smooth' });
    }
  }, 200);
});

document.querySelectorAll('.contact-card[role="button"]').forEach(card => {
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.click();
    }
  });
});

// Initial state
updateNav();

// Scroll progress indicator
container.addEventListener('scroll', () => {
  const scrollTop = container.scrollTop;
  const scrollHeight = container.scrollHeight - container.clientHeight;
  const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  document.getElementById('scrollProgress').style.width = progress + '%';
});
