// Shared behavior for the portfolio website.
const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const themeToggle = document.getElementById('themeToggle');
const scrollTopButton = document.getElementById('scrollTop');
const years = document.querySelectorAll('#year');
const typingText = document.getElementById('typingText');
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

// Mobile navigation toggle.
if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

// Active navigation highlight based on current page.
const currentPage = document.body.dataset.page;
const navLinks = document.querySelectorAll('.site-nav a');
navLinks.forEach((link) => {
  const href = link.getAttribute('href');
  if (href && href.includes(currentPage) && currentPage !== 'home') {
    link.classList.add('active');
  }
});

// Theme toggle.
const savedTheme = localStorage.getItem('portfolio-theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark');
  if (themeToggle) themeToggle.textContent = '☀️';
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('portfolio-theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
  });
}

// Current year in footer.
years.forEach((yearEl) => {
  yearEl.textContent = new Date().getFullYear();
});

// Scroll-to-top button visibility.
window.addEventListener('scroll', () => {
  if (window.scrollY > 400) {
    scrollTopButton.style.display = 'block';
  } else {
    scrollTopButton.style.display = 'none';
  }
});

if (scrollTopButton) {
  scrollTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Smooth scrolling for internal anchor links.
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (event) => {
    const targetId = anchor.getAttribute('href');
    if (!targetId || targetId === '#') return;
    const target = document.querySelector(targetId);
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Typing animation on homepage.
if (typingText) {
  const words = ['Java Full Stack Developer', 'Web Developer', 'Problem Solver'];
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function type() {
    const currentWord = words[wordIndex];
    typingText.textContent = currentWord.substring(0, charIndex);

    if (!isDeleting && charIndex < currentWord.length) {
      charIndex++;
      setTimeout(type, 120);
    } else if (isDeleting && charIndex > 0) {
      charIndex--;
      setTimeout(type, 80);
    } else {
      isDeleting = !isDeleting;
      wordIndex = (wordIndex + 1) % words.length;
      setTimeout(type, 900);
    }
  }

    // Populate resume from PDF (uses PDF.js from CDN)
    function loadPdfAndPopulate(url) {
      const status = document.getElementById('pdfStatus');
      const extractEl = document.getElementById('pdfExtract');
      if (!status || !extractEl) return;
      status.textContent = 'Loading PDF...';

      // Load PDF.js script dynamically
      if (!window.pdfjsLib) {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.min.js';
        s.onload = () => start();
        s.onerror = () => { status.textContent = 'Failed to load PDF library.'; };
        document.head.appendChild(s);
      } else {
        start();
      }

      function start() {
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js';
          const loadingTask = pdfjsLib.getDocument(url);
          loadingTask.promise.then((pdf) => {
            const maxPages = Math.min(pdf.numPages, 6);
            const pagePromises = [];
            for (let i = 1; i <= maxPages; i++) {
              pagePromises.push(pdf.getPage(i).then((page) => page.getTextContent()));
            }
            Promise.all(pagePromises).then((pages) => {
              const fullText = pages.map((p) => p.items.map((it) => it.str).join(' ')).join('\n\n');
              extractEl.style.display = 'block';
              extractEl.textContent = fullText;
              status.textContent = 'PDF loaded — extracted text shown below.';
              populateFieldsFromText(fullText);
            });
          }, (err) => {
            status.textContent = 'Failed to open PDF: ' + err.message;
          });
        } catch (e) {
          status.textContent = 'Error reading PDF.';
        }
      }
    }

    function populateFieldsFromText(text) {
      // Improved parsing: split into sections by heading keywords and populate DOM elements.
      const headings = ['Objective', 'Career Objective', 'Education', 'Experience', 'Certificat', 'Projects', 'Project', 'Skills', 'Languages', 'Personal', 'Contact', 'Email', 'Phone', 'Name'];

      // Find all heading occurrences and their positions
      const positions = [];
      headings.forEach((h) => {
        const re = new RegExp(h, 'ig');
        let m;
        while ((m = re.exec(text)) !== null) {
          positions.push({ key: h.toLowerCase(), index: m.index });
        }
      });

      // Always add end marker
      positions.push({ key: '__end', index: text.length });
      positions.sort((a, b) => a.index - b.index);

      const sections = {};
      for (let i = 0; i < positions.length - 1; i++) {
        const name = positions[i].key;
        const start = positions[i].index + name.length;
        const end = positions[i + 1].index;
        const secText = text.slice(start, end).trim();
        sections[name] = (sections[name] || '') + '\n' + secText;
      }

      const getSection = (keys) => {
        for (const k of keys) {
          const found = Object.keys(sections).find((s) => s.indexOf(k.toLowerCase()) !== -1 || s === k.toLowerCase());
          if (found) return sections[found].trim();
        }
        return null;
      };

      // Helper to find single-line values (Name, Email, Phone)
      const findInline = (labelRegex) => {
        const m = text.match(labelRegex);
        if (m && m[1]) return m[1].trim();
        return null;
      };

      // Name / Contact
      const nameInline = findInline(/Name[:\-\s]{0,6}([A-Z][A-Za-z .,-]{2,120})/i) || findInline(/([A-Z][A-Za-z ]{2,60})\s+\n\s*Profile/i);
      if (nameInline) document.getElementById('res_name').textContent = nameInline;
      const emailInline = findInline(/Email[:\-\s]{0,6}([\w.%-]+@[\w.-]+\.[A-Za-z]{2,6})/i);
      if (emailInline) document.getElementById('res_email').textContent = emailInline;
      const phoneInline = findInline(/Phone[:\-\s]{0,6}([+\d][\d \-()]{6,20}\d)/i) || findInline(/Contact[:\-\s]{0,6}([+\d][\d \-()]{6,20}\d)/i);
      if (phoneInline) document.getElementById('res_phone').textContent = phoneInline;

      // Objective
      const objective = getSection(['objective', 'career objective']) || null;
      if (objective) document.getElementById('res_objective').textContent = objective.split('\n')[0];

      // Experience
      const exp = getSection(['experience']);
      if (exp) document.getElementById('res_experience').textContent = exp.split('\n')[0];

      // Certifications
      const certText = getSection(['certificat']);
      if (certText) {
        const certs = certText.split(/\n|;|,|\u2022|\u2023/).map(s => s.trim()).filter(Boolean);
        const certList = document.getElementById('res_certifications');
        if (certList) {
          certList.innerHTML = certs.map(c => '<li>' + c + '</li>').join('');
        }
      }

      // Projects
      const projText = getSection(['projects', 'project']);
      if (projText) {
        const projs = projText.split(/\n|;|\u2022|\u2023/).map(s => s.trim()).filter(Boolean);
        const projList = document.getElementById('res_projects');
        if (projList) {
          projList.innerHTML = projs.map(p => '<li>' + p + '</li>').join('');
        }
      }

      // Languages
      const lang = getSection(['languages']);
      if (lang) document.getElementById('res_languages').textContent = lang.replace(/\n/g, ', ').trim();

      // Education: populate resume table body if available
      const eduText = getSection(['education']);
      if (eduText) {
        const tbody = document.querySelector('.resume-table tbody');
        if (tbody) {
          // Try to split education entries by line or semicolon
          const rows = eduText.split(/\n|;|\u2022/).map(s => s.trim()).filter(Boolean);
          const newRows = rows.map(r => {
            // Try to extract qualification, institution, year, percent using simple patterns
            const yearMatch = r.match(/(19|20)\d{2}/);
            const year = yearMatch ? yearMatch[0] : '';
            const parts = r.split(/,| at | - |\|/).map(p => p.trim()).filter(Boolean);
            const qual = parts[0] || r;
            const inst = parts[1] || '';
            const percentMatch = r.match(/(\d{1,3}%)/);
            const percent = percentMatch ? percentMatch[0] : '';
            return '<tr><td>' + qual + '</td><td>' + inst + '</td><td>' + year + '</td><td>' + percent + '</td></tr>';
          });
          if (newRows.length) tbody.innerHTML = newRows.join('');
        }
      }
    }

    // Hook up button on resume page
    if (document.body.dataset.page === 'resume') {
      // Auto-run PDF extraction using the local PDF filename found in the project
      const url = 'ABHAY%20Malve.....pdf';
      // Run immediately (no user interaction required)
      loadPdfAndPopulate(url);

      // Keep the button for manual retry, but hide it since auto-run handles it
      const btn = document.getElementById('populatePdfBtn');
      if (btn) {
        btn.addEventListener('click', () => loadPdfAndPopulate(url));
        btn.style.display = 'none';
      }
    }

  type();
}

// Animate progress bars when skills section appears.
const progressBars = document.querySelectorAll('.progress-bar span');
const animateProgress = () => {
  progressBars.forEach((bar) => {
    const width = bar.style.getPropertyValue('--skill') || bar.getAttribute('data-width');
    if (width) {
      bar.style.width = width;
    }
  });
};

if (progressBars.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateProgress();
        observer.disconnect();
      }
    });
  }, { threshold: 0.3 });

  const skillsSection = document.querySelector('.skills-grid');
  if (skillsSection) observer.observe(skillsSection);
}

// Form validation.
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !subject || !message) {
      formStatus.textContent = 'Please fill in all fields before submitting.';
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      formStatus.textContent = 'Please enter a valid email address.';
      return;
    }

    formStatus.textContent = 'Thank you! Your message has been submitted successfully.';
    contactForm.reset();
  });
}
