(function (window, document) {
  'use strict';

  window.__app = window.__app || {};
  var app = window.__app;

  function debounce(fn, delay) {
    var timer;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(ctx, args);
      }, delay);
    };
  }

  function throttle(fn, limit) {
    var lastCall = 0;
    return function () {
      var now = Date.now();
      if (now - lastCall >= limit) {
        lastCall = now;
        fn.apply(this, arguments);
      }
    };
  }

  function getHeaderHeight() {
    var header = document.querySelector('.l-header');
    return header ? header.getBoundingClientRect().height : 68;
  }

  function initHeaderScroll() {
    if (app.headerScrollReady) return;
    app.headerScrollReady = true;

    var header = document.querySelector('.l-header');
    if (!header) return;

    var onScroll = throttle(function () {
      if (window.pageYOffset > 10) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }, 100);

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initBurger() {
    if (app.burgerReady) return;
    app.burgerReady = true;

    var header = document.querySelector('.l-header');
    var toggle = document.querySelector('.navbar-toggler, .c-nav__toggle');
    var collapse = document.querySelector('.navbar-collapse');

    if (!toggle) return;

    var mobileMenu = null;

    function buildMobileMenu() {
      if (mobileMenu) return;

      mobileMenu = document.createElement('nav');
      mobileMenu.id = 'mobileMenu';
      mobileMenu.setAttribute('aria-label', 'Mobile navigation');
      mobileMenu.classList.add('c-mobile-menu');

      var sourceList = header
        ? header.querySelector('.navbar-nav, .c-nav__list')
        : null;

      if (sourceList) {
        var cloned = sourceList.cloneNode(true);
        mobileMenu.appendChild(cloned);
      }

      document.body.appendChild(mobileMenu);
    }

    function openMenu() {
      buildMobileMenu();
      toggle.setAttribute('aria-expanded', 'true');
      if (mobileMenu) mobileMenu.classList.add('is-open');
      document.body.classList.add('u-no-scroll');
      if (collapse) collapse.classList.add('show');
    }

    function closeMenu() {
      toggle.setAttribute('aria-expanded', 'false');
      if (mobileMenu) mobileMenu.classList.remove('is-open');
      document.body.classList.remove('u-no-scroll');
      if (collapse) collapse.classList.remove('show');
    }

    function isOpen() {
      return toggle.getAttribute('aria-expanded') === 'true';
    }

    toggle.addEventListener('click', function () {
      if (isOpen()) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        closeMenu();
        toggle.focus();
      }
    });

    document.addEventListener('click', function (e) {
      if (!isOpen()) return;
      if (
        e.target === toggle ||
        toggle.contains(e.target) ||
        (mobileMenu && mobileMenu.contains(e.target))
      ) return;
      closeMenu();
    });

    document.addEventListener('click', function (e) {
      if (!mobileMenu) return;
      var link = e.target.closest('a[href]');
      if (link && mobileMenu.contains(link)) {
        closeMenu();
      }
    });

    var onResize = debounce(function () {
      if (window.innerWidth >= 768) {
        closeMenu();
      }
    }, 150);

    window.addEventListener('resize', onResize, { passive: true });
  }

  function initAnchors() {
    if (app.anchorsReady) return;
    app.anchorsReady = true;

    var isHome =
      location.pathname === '/' ||
      location.pathname === '/index.html' ||
      /^\/index\.html(\?.*)?$/.test(location.pathname);

    var anchors = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < anchors.length; i++) {
      (function (link) {
        var href = link.getAttribute('href');
        if (href === '#' || href === '#!') return;

        if (!isHome) {
          link.setAttribute('href', '/' + href);
          return;
        }

        link.addEventListener('click', function (e) {
          var target = document.querySelector(href);
          if (!target) return;
          e.preventDefault();
          var offset = getHeaderHeight();
          var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top: top, behavior: 'smooth' });
          history.pushState(null, '', href);
        });
      })(anchors[i]);
    }

    if (isHome && location.hash && location.hash.length > 1) {
      setTimeout(function () {
        var target = document.querySelector(location.hash);
        if (target) {
          var offset = getHeaderHeight();
          var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      }, 300);
    }
  }

  function initActiveMenu() {
    if (app.activeMenuReady) return;
    app.activeMenuReady = true;

    var links = document.querySelectorAll('.c-nav__link, .nav-link');
    var pathname = location.pathname.replace(/\/index\.html$/, '/') || '/';
    var isHome = pathname === '/' || pathname === '';

    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var linkPath = link.getAttribute('href');
      if (!linkPath) continue;

      linkPath = linkPath.replace(/\/index\.html$/, '/') || '/';

      link.removeAttribute('aria-current');
      link.classList.remove('is-active', 'active');

      var isMatch = false;

      if (isHome && (linkPath === '/' || linkPath === '/index.html' || linkPath === '')) {
        isMatch = true;
      } else if (!isHome && linkPath !== '/' && linkPath !== '/index.html') {
        isMatch = pathname === linkPath || pathname.indexOf(linkPath) === 0;
      }

      if (isMatch) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('is-active', 'active');
      }
    }
  }

  function initScrollSpy() {
    if (app.scrollSpyReady) return;
    app.scrollSpyReady = true;

    var navLinks = document.querySelectorAll('.c-nav__link[href^="#"], .nav-link[href^="#"]');
    if (!navLinks.length) return;

    var sections = [];
    for (var i = 0; i < navLinks.length; i++) {
      var href = navLinks[i].getAttribute('href');
      if (!href || href === '#') continue;
      var section = document.querySelector(href);
      if (section) {
        sections.push({ el: section, link: navLinks[i] });
      }
    }

    if (!sections.length) return;

    var onScroll = throttle(function () {
      var scrollY = window.pageYOffset;
      var offset = getHeaderHeight() + 10;
      var current = null;

      for (var j = 0; j < sections.length; j++) {
        var top = sections[j].el.getBoundingClientRect().top + window.pageYOffset - offset;
        if (scrollY >= top) {
          current = sections[j];
        }
      }

      for (var k = 0; k < sections.length; k++) {
        sections[k].link.classList.remove('is-active', 'active');
        sections[k].link.removeAttribute('aria-current');
      }

      if (current) {
        current.link.classList.add('is-active', 'active');
        current.link.setAttribute('aria-current', 'page');
      }
    }, 100);

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initScrollToTop() {
    if (app.scrollToTopReady) return;
    app.scrollToTopReady = true;

    var btn = document.querySelector('.c-scroll-top, [data-scroll-top], #scrollToTop');
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'c-scroll-top';
      btn.setAttribute('aria-label', 'Scroll to top');
      btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>';
      document.body.appendChild(btn);
    }

    var onScroll = throttle(function () {
      if (window.pageYOffset > 400) {
        btn.classList.add('is-visible');
      } else {
        btn.classList.remove('is-visible');
      }
    }, 100);

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initCountUp() {
    if (app.countUpReady) return;
    app.countUpReady = true;

    var stats = document.querySelectorAll('.c-stat__number[data-count], [data-countup]');
    if (!stats.length) return;

    var counted = [];

    function countUp(el) {
      var target = parseInt(el.getAttribute('data-count') || el.getAttribute('data-countup'), 10);
      if (isNaN(target)) return;

      var duration = parseInt(el.getAttribute('data-duration'), 10) || 1800;
      var startTime = null;
      var startVal = 0;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = Math.round(startVal + eased * (target - startVal));
        el.textContent = current.toLocaleString();
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target.toLocaleString();
        }
      }

      requestAnimationFrame(step);
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          if (counted.indexOf(el) === -1) {
            counted.push(el);
            countUp(el);
            observer.unobserve(el);
          }
        }
      });
    }, { threshold: 0.5 });

    for (var i = 0; i < stats.length; i++) {
      observer.observe(stats[i]);
    }
  }

  function initNotify() {
    if (app.notifyReady) return;
    app.notifyReady = true;

    var container = document.getElementById('app-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'app-toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      container.className = 'c-toast-container';
      document.body.appendChild(container);
    }

    app.notify = function (message, type) {
      var toast = document.createElement('div');
      toast.setAttribute('role', 'alert');
      toast.className = 'c-toast c-toast--' + (type || 'success');
      toast.innerHTML =
        '<span class="c-toast__message">' + message + '</span>' +
        '<button type="button" class="c-toast__close" aria-label="Close">&times;</button>';

      var closeBtn = toast.querySelector('.c-toast__close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        });
      }

      container.appendChild(toast);

      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 5000);
    };
  }

  function initContactForm() {
    if (app.contactFormReady) return;
    app.contactFormReady = true;

    var form = document.getElementById('contactForm');
    if (!form) return;

    var submitBtn = document.getElementById('contactSubmitBtn');
    var honeyField = form.querySelector('[name="website"]');

    if (!honeyField) {
      var honey = document.createElement('input');
      honey.type = 'text';
      honey.name = 'website';
      honey.setAttribute('tabindex', '-1');
      honey.setAttribute('autocomplete', 'off');
      honey.className = 'c-form__honeypot';
      form.appendChild(honey);
    }

    var formStartTime = Date.now();

    var validators = {
      firstName: function (val) {
        if (!val || val.trim().length < 2) return 'First name must be at least 2 characters.';
        if (val.trim().length > 50) return 'First name must be 50 characters or fewer.';
        if (!/^[a-zA-ZÀ-ÿs'-]{2,50}$/.test(val.trim())) return 'First name contains invalid characters.';
        return '';
      },
      lastName: function (val) {
        if (!val || val.trim().length < 2) return 'Last name must be at least 2 characters.';
        if (val.trim().length > 50) return 'Last name must be 50 characters or fewer.';
        if (!/^[a-zA-ZÀ-ÿs'-]{2,50}$/.test(val.trim())) return 'Last name contains invalid characters.';
        return '';
      },
      email: function (val) {
        if (!val || !val.trim()) return 'Email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return 'Please enter a valid email address.';
        return '';
      },
      phone: function (val) {
        if (!val || !val.trim()) return '';
        if (!/^[-\d\s+()]{7,20}$/.test(val.trim())) return 'Phone number must be 7–20 digits and may include +, -, (, ), spaces.';
        return '';
      },
      message: function (val) {
        if (!val || val.trim().length < 10) return 'Message must be at least 10 characters.';
        return '';
      },
      privacyConsent: function (val, el) {
        if (!el.checked) return 'You must agree to the Privacy Policy.';
        return '';
      }
    };

    function showError(fieldId, message) {
      var errorEl = document.getElementById(fieldId + 'Error');
      var inputEl = document.getElementById(fieldId);
      if (errorEl) errorEl.textContent = message;
      if (inputEl) {
        inputEl.classList.toggle('is-invalid', !!message);
        inputEl.classList.toggle('is-valid', !message);
      }
    }

    function clearError(fieldId) {
      showError(fieldId, '');
    }

    function validateAll() {
      var valid = true;

      var firstNameEl = document.getElementById('firstName');
      var lastNameEl = document.getElementById('lastName');
      var emailEl = document.getElementById('email');
      var phoneEl = document.getElementById('phone');
      var messageEl = document.getElementById('message');
      var privacyEl = document.getElementById('privacyConsent');

      var fields = [
        { id: 'firstName', el: firstNameEl, val: firstNameEl ? firstNameEl.value : '' },
        { id: 'lastName', el: lastNameEl, val: lastNameEl ? lastNameEl.value : '' },
        { id: 'email', el: emailEl, val: emailEl ? emailEl.value : '' },
        { id: 'phone', el: phoneEl, val: phoneEl ? phoneEl.value : '' },
        { id: 'message', el: messageEl, val: messageEl ? messageEl.value : '' },
        { id: 'privacyConsent', el: privacyEl, val: privacyEl ? privacyEl.value : '' }
      ];

      for (var i = 0; i < fields.length; i++) {
        var f = fields[i];
        if (!validators[f.id]) continue;
        var err = validators[f.id](f.val, f.el);
        showError(f.id, err);
        if (err) valid = false;
      }

      return valid;
    }

    var fieldIds = ['firstName', 'lastName', 'email', 'phone', 'message'];
    for (var fi = 0; fi < fieldIds.length; fi++) {
      (function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', function () {
          if (validators[id]) {
            var err = validators[id](el.value, el);
            showError(id, err);
          }
        });
      })(fieldIds[fi]);
    }

    var privacyEl = document.getElementById('privacyConsent');
    if (privacyEl) {
      privacyEl.addEventListener('change', function () {
        var err = validators.privacyConsent(privacyEl.value, privacyEl);
        showError('privacyConsent', err);
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopPropagation();

      var honeyInput = form.querySelector('[name="website"]');
      if (honeyInput && honeyInput.value) return;

      var elapsed = Date.now() - formStartTime;
      if (elapsed < 2000) {
        if (app.notify) app.notify('Please wait a moment before submitting.', 'error');
        return;
      }

      var isValid = validateAll();
      if (!isValid) {
        var firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      if (!navigator.onLine) {
        if (app.notify) app.notify('Ошибка соединения, попробуйте позже.', 'error');
        return;
      }

      var originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
        submitBtn.classList.add('is-loading');
      }

      var formData = {};
      var fields = form.querySelectorAll('input, textarea, select');
      for (var j = 0; j < fields.length; j++) {
        var field = fields[j];
        if (!field.name || field.name === 'website') continue;
        if (field.type === 'checkbox') {
          formData[field.name] = field.checked;
        } else {
          formData[field.name] = field.value;
        }
      }

      function restoreBtn() {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          submitBtn.classList.remove('is-loading');
        }
      }

      fetch('process.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Network error');
          return response.json();
        })
        .then(function () {
          restoreBtn();
          form.reset();
          var allInputs = form.querySelectorAll('input, textarea, select');
          for (var k = 0; k < allInputs.length; k++) {
            allInputs[k].classList.remove('is-invalid', 'is-valid');
          }
          formStartTime = Date.now();
          window.location.href = 'thank_you.html';
        })
        .catch(function () {
          restoreBtn();
          if (app.notify) {
            app.notify('Ошибка соединения, попробуйте позже.', 'error');
          }
        });
    });
  }

  function initChatbot() {
    if (app.chatbotReady) return;
    app.chatbotReady = true;

    var chatForm = document.getElementById('chatbotForm');
    var chatInput = document.getElementById('chatInput');
    var chatMessages = document.getElementById('chatMessages');
    var chips = document.querySelectorAll('.c-chatbot-chip');

    if (!chatForm || !chatInput || !chatMessages) return;

    var responses = {
      'what programs are available': 'We offer Personal Training, Online Coaching, Group Sessions, and Nutrition Planning. Visit our Services page for full details.',
      'how much does coaching cost': 'Our coaching plans start from €99/month. Check the Services page for full pricing options.',
      'how do i get started': 'Simply fill out the contact form on this page or click the "Get Started" button. We'll get back to you within 24 hours.',
      'default': 'Thanks for your question! Please use the contact form above and we'll get back to you as soon as possible.'
    };

    function getResponse(question) {
      var q = question.toLowerCase().trim();
      for (var key in responses) {
        if (key !== 'default' && q.indexOf(key) !== -1) {
          return responses[key];
        }
      }
      return responses['default'];
    }

    function addMessage(text, type) {
      var msg = document.createElement('div');
      msg.className = 'c-chatbot-message c-chatbot-message--' + type;
      msg.textContent = text;
      chatMessages.appendChild(msg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function handleSubmit(question) {
      var q = question.trim();
      if (!q) return;
      addMessage(q, 'user');
      chatInput.value = '';
      setTimeout(function () {
        addMessage(getResponse(q), 'bot');
      }, 400);
    }

    chatForm.addEventListener('submit', function (e) {
      e.preventDefault();
      handleSubmit(chatInput.value);
    });

    for (var i = 0; i < chips.length; i++) {
      (function (chip) {
        chip.addEventListener('click', function () {
          var question = chip.getAttribute('data-question') || chip.textContent;
          handleSubmit(question);
        });
      })(chips[i]);
    }
  }

  function initPrivacyModal() {
    if (app.privacyModalReady) return;
    app.privacyModalReady = true;

    var overlay = document.getElementById('privacyModal');
    var links = document.querySelectorAll('a[href="privacy.html"], .c-link[href*="privacy"], a[data-modal="privacy"]');

    if (!links.length) return;

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'privacyModal';
      overlay.className = 'c-modal';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'Privacy Policy');

      var inner = document.createElement('div');
      inner.className = 'c-modal__inner';

      var header = document.createElement('div');
      header.className = 'c-modal__header';

      var title = document.createElement('h2');
      title.className = 'c-modal__title';
      title.textContent = 'Privacy Policy';

      var closeBtn = document.createElement('button');
      closeBtn.className = 'c-modal__close';
      closeBtn.setAttribute('aria-label', 'Close Privacy Policy');
      closeBtn.innerHTML = '&times;';

      header.appendChild(title);
      header.appendChild(closeBtn);

      var body = document.createElement('div');
      body.className = 'c-modal__body';
      body.innerHTML = '<p>Loading privacy policy…</p>';

      inner.appendChild(header);
      inner.appendChild(body);
      overlay.appendChild(inner);
      document.body.appendChild(overlay);

      closeBtn.addEventListener('click', closeModal);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal();
      });
    }

    function openModal(e) {
      if (e) e.preventDefault();
      overlay.classList.add('is-open');
      document.body.classList.add('u-no-scroll');

      var body = overlay.querySelector('.c-modal__body');
      if (body && body.innerHTML === '<p>Loading privacy policy…</p>') {
        fetch('privacy.html')
          .then(function (r) { return r.text(); })
          .then(function (html) {
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');
            var main = doc.querySelector('#main-content, main');
            if (main) {
              body.innerHTML = main.innerHTML;
            } else {
              body.innerHTML = '<p>Privacy Policy content could not be loaded.</p>';
            }
          })
          .catch(function () {
            body.innerHTML = '<p>Privacy Policy content could not be loaded.</p>';
          });
      }

      var closeBtn = overlay.querySelector('.c-modal__close');
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      overlay.classList.remove('is-open');
      document.body.classList.remove('u-no-scroll');
    }

    for (var i = 0; i < links.length; i++) {
      (function (link) {
        var href = link.getAttribute('href') || '';
        if (href === 'privacy.html' || href.indexOf('privacy.html') !== -1) {
          link.addEventListener('click', openModal);
        }
      })(links[i]);
    }
  }

  function initRipple() {
    if (app.rippleReady) return;
    app.rippleReady = true;

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.c-button');
      if (!btn) return;

      var ripple = document.createElement('span');
      ripple.className = 'c-button__ripple';

      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      var x = e.clientX - rect.left - size / 2;
      var y = e.clientY - rect.top - size / 2;

      ripple.setAttribute('data-x', x);
      ripple.setAttribute('data-y', y);
      ripple.setAttribute('data-size', size);
      ripple.className = 'c-button__ripple';

      btn.appendChild(ripple);

      setTimeout(function () {
        if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
      }, 600);
    });
  }

  function initScrollMargins() {
    if (app.scrollMarginsReady) return;
    app.scrollMarginsReady = true;

    var headerHeight = getHeaderHeight();
    var sections = document.querySelectorAll('section[id], div[id], article[id]');
    for (var i = 0; i < sections.length; i++) {
      var el = sections[i];
      if (!el.style.scrollMarginTop) {
        el.style.scrollMarginTop = headerHeight + 'px';
      }
    }
  }

  function initOfflineMessage() {
    if (app.offlineReady) return;
    app.offlineReady = true;

    window.addEventListener('offline', function () {
      if (app.notify) app.notify('Ошибка соединения, попробуйте позже.', 'error');
    });
  }

  function initTypingAnimation() {
    if (app.typingReady) return;
    app.typingReady = true;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    var typingEls = document.querySelectorAll('[data-typing]');

    for (var i = 0; i < typingEls.length; i++) {
      (function (el) {
        var fullText = el.getAttribute('data-typing') || el.textContent;
        var speed = parseInt(el.getAttribute('data-typing-speed'), 10) || 60;
        var delay = parseInt(el.getAttribute('data-typing-delay'), 10) || 0;

        el.textContent = '';
        el.setAttribute('aria-label', fullText);

        var index = 0;

        function typeChar() {
          if (index < fullText.length) {
            el.textContent += fullText.charAt(index);
            index++;
            setTimeout(typeChar, speed);
          }
        }

        setTimeout(typeChar, delay);
      })(typingEls[i]);
    }
  }

  function initImages() {
    if (app.imagesReady) return;
    app.imagesReady = true;

    var svgPlaceholder =
      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22 viewBox=%220 0 400 300%22%3E%3Crect width=%22400%22 height=%22300%22 fill=%22%23e9ecef%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2216%22 fill=%22%236c757d%22%3EImage unavailable%3C%2Ftext%3E%3C%2Fsvg%3E';

    var images = document.querySelectorAll('img');
    for (var i = 0; i < images.length; i++) {
      (function (img) {
        var isLogo = img.classList.contains('c-logo__img') || img.classList.contains('navbar-brand__img');
        var isCritical = img.hasAttribute('data-critical');

        if (!img.hasAttribute('loading') && !isLogo && !isCritical) {
          img.setAttribute('loading', 'lazy');
        }

        img.addEventListener('error', function () {
          if (img.src === svgPlaceholder) return;
          img.src = svgPlaceholder;
        });
      })(images[i]);
    }
  }

  app.init = function () {
    if (app.initialized) return;
    app.initialized = true;

    initNotify();
    initHeaderScroll();
    initBurger();
    initAnchors();
    initActiveMenu();
    initScrollSpy();
    initScrollToTop();
    initCountUp();
    initContactForm();
    initChatbot();
    initPrivacyModal();
    initRipple();
    initScrollMargins();
    initOfflineMessage();
    initTypingAnimation();
    initImages();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', app.init);
  } else {
    app.init();
  }

})(window, document);