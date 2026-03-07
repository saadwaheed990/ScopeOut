document.addEventListener('DOMContentLoaded', function () {
  // =========================================================================
  // 1. Preloader
  // =========================================================================
  const preloader = document.getElementById('preloader');

  function hidePreloader() {
    if (preloader) {
      preloader.classList.add('hidden');
    }
  }

  if (document.readyState === 'complete') {
    hidePreloader();
  } else {
    window.addEventListener('load', hidePreloader);
  }

  // =========================================================================
  // 2. Navbar Scroll Effect
  // =========================================================================
  const navbar = document.getElementById('navbar');

  function handleNavbarScroll() {
    if (!navbar) return;
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavbarScroll);
  handleNavbarScroll();

  // =========================================================================
  // 3. Mobile Hamburger Menu
  // =========================================================================
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  function toggleMenu() {
    if (!hamburger || !navLinks) return;
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
    document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
  }

  function closeMenu() {
    if (!hamburger || !navLinks) return;
    hamburger.classList.remove('active');
    navLinks.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (hamburger) {
    hamburger.addEventListener('click', toggleMenu);
  }

  if (navLinks) {
    var menuLinks = navLinks.querySelectorAll('a');
    menuLinks.forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  }

  // =========================================================================
  // 4. Smooth Scrolling
  // =========================================================================
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;

      var targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      e.preventDefault();

      var navbarHeight = navbar ? navbar.offsetHeight : 0;
      var targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    });
  });

  // =========================================================================
  // 5. Animated Counters
  // =========================================================================
  var statNumbers = document.querySelectorAll('.stat-number[data-count]');

  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;

    var duration = 2000;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);

      // Ease-out quad for smoother finish
      var easedProgress = 1 - (1 - progress) * (1 - progress);
      var current = Math.floor(easedProgress * target);

      el.textContent = formatNumber(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = formatNumber(target);
      }
    }

    requestAnimationFrame(step);
  }

  if (statNumbers.length > 0 && 'IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    statNumbers.forEach(function (el) {
      counterObserver.observe(el);
    });
  }

  // =========================================================================
  // 6. Testimonials Slider
  // =========================================================================
  var slider = document.getElementById('testimonialsSlider');
  var prevBtn = document.querySelector('.slider-btn.prev');
  var nextBtn = document.querySelector('.slider-btn.next');
  var dotsContainer = document.querySelector('.slider-dots');

  if (slider) {
    var slides = slider.children;
    var totalSlides = slides.length;
    var currentIndex = 0;
    var autoPlayInterval = null;

    function getVisibleCount() {
      var width = window.innerWidth;
      if (width < 768) return 1;
      if (width < 1024) return 2;
      return 3;
    }

    function getMaxIndex() {
      var visible = getVisibleCount();
      return Math.max(0, totalSlides - visible);
    }

    function updateSlider() {
      if (totalSlides === 0) return;

      var visible = getVisibleCount();
      var cardWidth = 100 / visible;

      for (var i = 0; i < totalSlides; i++) {
        slides[i].style.minWidth = cardWidth + '%';
      }

      var maxIndex = getMaxIndex();
      if (currentIndex > maxIndex) {
        currentIndex = maxIndex;
      }

      var offset = -(currentIndex * (100 / visible));
      slider.style.transform = 'translateX(' + offset + '%)';

      updateDots();
    }

    function generateDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';

      var maxIndex = getMaxIndex();
      var dotCount = maxIndex + 1;

      for (var i = 0; i < dotCount; i++) {
        var dot = document.createElement('span');
        dot.classList.add('dot');
        if (i === currentIndex) {
          dot.classList.add('active');
        }
        dot.setAttribute('data-index', i);
        dot.addEventListener('click', function () {
          currentIndex = parseInt(this.getAttribute('data-index'), 10);
          updateSlider();
        });
        dotsContainer.appendChild(dot);
      }
    }

    function updateDots() {
      if (!dotsContainer) return;
      var dots = dotsContainer.querySelectorAll('.dot');
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === currentIndex);
      });
    }

    function goNext() {
      var maxIndex = getMaxIndex();
      currentIndex = currentIndex < maxIndex ? currentIndex + 1 : 0;
      updateSlider();
    }

    function goPrev() {
      var maxIndex = getMaxIndex();
      currentIndex = currentIndex > 0 ? currentIndex - 1 : maxIndex;
      updateSlider();
    }

    function startAutoPlay() {
      stopAutoPlay();
      autoPlayInterval = setInterval(goNext, 5000);
    }

    function stopAutoPlay() {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
      }
    }

    if (nextBtn) nextBtn.addEventListener('click', function () { goNext(); startAutoPlay(); });
    if (prevBtn) prevBtn.addEventListener('click', function () { goPrev(); startAutoPlay(); });

    slider.addEventListener('mouseenter', stopAutoPlay);
    slider.addEventListener('mouseleave', startAutoPlay);

    window.addEventListener('resize', function () {
      generateDots();
      updateSlider();
    });

    slider.style.transition = 'transform 0.4s ease';
    generateDots();
    updateSlider();
    startAutoPlay();
  }

  // =========================================================================
  // 7. FAQ Accordion
  // =========================================================================
  var faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(function (item) {
    var question = item.querySelector('.faq-question');
    var answer = item.querySelector('.faq-answer');

    if (!question || !answer) return;

    question.addEventListener('click', function () {
      var isActive = item.classList.contains('active');

      // Close all other open items
      faqItems.forEach(function (otherItem) {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
          var otherAnswer = otherItem.querySelector('.faq-answer');
          if (otherAnswer) {
            otherAnswer.style.maxHeight = null;
          }
        }
      });

      // Toggle current item
      item.classList.toggle('active');

      if (!isActive) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
      } else {
        answer.style.maxHeight = null;
      }
    });
  });

  // =========================================================================
  // 8. Back to Top Button
  // =========================================================================
  var backToTop = document.getElementById('backToTop');

  function handleBackToTopVisibility() {
    if (!backToTop) return;
    if (window.scrollY > 500) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', handleBackToTopVisibility);
  handleBackToTopVisibility();

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // =========================================================================
  // 9. Scroll Animations (AOS-like)
  // =========================================================================
  var aosElements = document.querySelectorAll('[data-aos]');

  if (aosElements.length > 0 && 'IntersectionObserver' in window) {
    var aosObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var delay = el.getAttribute('data-aos-delay');

          if (delay) {
            el.style.transitionDelay = delay + 'ms';
          }

          el.classList.add('aos-animate');
          aosObserver.unobserve(el);
        }
      });
    }, { threshold: 0.1 });

    aosElements.forEach(function (el) {
      aosObserver.observe(el);
    });
  }

  // =========================================================================
  // 10. Active Nav Link Highlighting
  // =========================================================================
  var sections = document.querySelectorAll('section[id]');
  var navLinksAll = document.querySelectorAll('#navLinks a[href^="#"]');

  function highlightActiveNav() {
    if (sections.length === 0 || navLinksAll.length === 0) return;

    var scrollPos = window.scrollY;
    var navHeight = navbar ? navbar.offsetHeight : 0;

    var currentSection = '';

    sections.forEach(function (section) {
      var sectionTop = section.offsetTop - navHeight - 100;
      var sectionBottom = sectionTop + section.offsetHeight;

      if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
        currentSection = section.getAttribute('id');
      }
    });

    navLinksAll.forEach(function (link) {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + currentSection) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', highlightActiveNav);
  highlightActiveNav();
});
