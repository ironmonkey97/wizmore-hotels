// script.js
// Full JavaScript file — copy & paste into your project (complete, no missing parts).
// Purpose: Fully functional hotel website interactions.
// Features:
// - Mobile navigation toggle + accessible aria attributes
// - Header scroll effect
// - Smooth anchor scrolling with header offset
// - Fade-in on scroll (throttled)
// - Booking modal open/close (focus management, fade-out animation)
// - Independent booking calculators for main booking form and modal form
//   (main form and modal are completely independent; selecting a room in one DOES NOT affect the other)
// - Prefill modal room when clicking a room card's Book button (uses data-default-room on the button)
// - Date min enforcement (checkin can't be in the past; checkout must be after checkin)
// - Client-side validation and friendly alert on successful booking (alert used per request)
// - Clean, commented, easy-to-follow structure so you can paste without confusion

// ==============================
// Configuration
// ==============================
const roomRates = {
  'standard': 85000,   // matches text inside card: ₦85,000
  'deluxe': 120000,    // matches text in card: ₦120,000
  'executive': 180000  // matches text in card: ₦180,000
};

// Minor internal settings
const HEADER_OFFSET = 80; // pixels to offset scrolling for the fixed header

// ==============================
// Utility helpers
// ==============================
function isoDate(date) {
  // Convert a Date object to YYYY-MM-DD
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseISO(dateString) {
  if (!dateString) return null;
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  return new Date(parts[0], parseInt(parts[1], 10) - 1, parts[2]);
}

function formatCurrency(n) {
  if (typeof n !== 'number') return '₦0';
  return `₦${n.toLocaleString()}`;
}

// ==============================
// Mobile navigation toggle
// ==============================
const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.getElementById('navLinks');

if (mobileToggle && navLinks) {
  // Provide accessible initial aria attribute
  mobileToggle.setAttribute('aria-expanded', 'false');

  mobileToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const expanded = navLinks.classList.contains('active');
    mobileToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');

    // Swap the icon HTML -- use font awesome icons (keep same style as HTML)
    mobileToggle.innerHTML = expanded ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
  });

  // Close mobile menu when a nav link is clicked
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      mobileToggle.setAttribute('aria-expanded', 'false');
      mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
    });
  });
}

// ==============================
// Header scroll effect
// ==============================
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  if (!header) return;
  if (window.scrollY > 100) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// ==============================
// Smooth scrolling for anchor links
// ==============================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    // If href is just '#' or empty, allow default (or ignore)
    if (!href || href === '#') return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      const top = target.offsetTop - HEADER_OFFSET;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ==============================
// Fade-in on scroll (throttled)
// ==============================
const fadeElements = document.querySelectorAll('.fade-in');

function appearOnScroll() {
  fadeElements.forEach(element => {
    const elementTop = element.getBoundingClientRect().top;
    const elementVisible = 150;
    if (elementTop < window.innerHeight - elementVisible) {
      element.classList.add('appear');
    }
  });
}

let scrollThrottle = null;
window.addEventListener('scroll', () => {
  if (scrollThrottle) return;
  scrollThrottle = setTimeout(() => {
    appearOnScroll();
    scrollThrottle = null;
  }, 100);
});
window.addEventListener('load', appearOnScroll);

// ==============================
// Modal handling (open, close, focus trap basics)
// ==============================
const bookingModal = document.getElementById('bookingModal');
const closeModal = document.getElementById('closeModal');
const topBookBtn = document.getElementById('bookBtn'); // top right Book Now button

// small fadeout animation class name
const MODAL_FADEOUT_CLASS = 'modal-fadeout';

// Ensure fadeout CSS exists (adds it dynamically if not present)
(function ensureModalFadeCSS() {
  const css = `
    @keyframes modalFadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-8px); }
    }
    .${MODAL_FADEOUT_CLASS} { animation: modalFadeOut 220ms ease-out forwards; }
  `;
  const style = document.createElement('style');
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
})();

function openBookingModal(preselectedRoom = '') {
  if (!bookingModal) return;
  bookingModal.style.display = 'flex';
  bookingModal.classList.remove(MODAL_FADEOUT_CLASS);
  // lock background scroll
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  // focus first input after a short delay
  setTimeout(() => {
    const first = bookingModal.querySelector('input, select, textarea, button');
    if (first) first.focus();
    // preselect room in modal (this only affects the modal, never the main form)
    if (preselectedRoom) {
      const modalRoomEl = document.getElementById('modalRoom');
      if (modalRoomEl) modalRoomEl.value = preselectedRoom;
      // trigger a change to update modal summary if calculator is set
      modalRoomEl.dispatchEvent(new Event('change'));
    }
  }, 60);
}

function closeBookingModal() {
  if (!bookingModal) return;
  bookingModal.classList.add(MODAL_FADEOUT_CLASS);
  setTimeout(() => {
    bookingModal.style.display = 'none';
    bookingModal.classList.remove(MODAL_FADEOUT_CLASS);
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }, 220);
}

// Open modal via the top Book Now (optional)
if (topBookBtn) {
  topBookBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openBookingModal(); // no preselected room
  });
}

// close button
if (closeModal) {
  closeModal.addEventListener('click', closeBookingModal);
}

// click outside modal-content to close
window.addEventListener('click', (e) => {
  if (!bookingModal) return;
  if (e.target === bookingModal) closeBookingModal();
});

// esc to close
document.addEventListener('keydown', (e) => {
  if (!bookingModal) return;
  if (e.key === 'Escape' && bookingModal.style.display === 'flex') {
    closeBookingModal();
  }
});

// ==============================
// Prefill modal: connect each card's "Book [Type]" button to modal
// Buttons in HTML use: <a class="btn room-open" data-default-room="executive">Book Executive</a>
// IMPORTANT: this only pre-fills the modal form; it DOES NOT change the main form
// ==============================
document.querySelectorAll('.room-open').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    // data-default-room attribute (HTML uses data-default-room="executive" etc)
    const roomType = btn.dataset.defaultRoom || btn.getAttribute('data-default-room') || '';
    // Open modal and preselect the modal room (modal is separate from main form)
    openBookingModal(roomType);
  });
});

// ==============================
// Booking calculator / validations (reusable)
// - Each form has its own IDs and elements and works independently.
// - Main form IDs (from your HTML): checkin, checkout, room, nightsCount, ratePerNight, totalPrice, bookingNotice
// - Modal form IDs: modalCheckin, modalCheckout, modalRoom, modalNightsCount, modalRatePerNight, modalTotalPrice, modalBookingNotice
// ==============================
function setupBookingCalculator({ checkinId, checkoutId, roomId, nightsId, rateId, totalId, noticeId }) {
  const checkin = document.getElementById(checkinId);
  const checkout = document.getElementById(checkoutId);
  const room = document.getElementById(roomId);
  const nightsEl = document.getElementById(nightsId);
  const rateEl = document.getElementById(rateId);
  const totalEl = document.getElementById(totalId);
  const noticeEl = document.getElementById(noticeId);

  // If critical elements are missing, safely return (don't break)
  if (!checkin || !checkout || !room) return;

  // Enforce checkin >= today
  const todayIso = isoDate(new Date());
  checkin.setAttribute('min', todayIso);

  function setCheckoutMinFromCheckin() {
    const checkVal = checkin.value;
    if (!checkVal) {
      // checkout must be at least tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      checkout.setAttribute('min', isoDate(tomorrow));
      return;
    }
    const next = parseISO(checkVal);
    next.setDate(next.getDate() + 1);
    checkout.setAttribute('min', isoDate(next));
  }

  function calculate() {
    const checkinDate = parseISO(checkin.value);
    const checkoutDate = parseISO(checkout.value);
    const roomType = room.value;

    if (!checkinDate || !checkoutDate || checkoutDate <= checkinDate || !roomType) {
      if (nightsEl) nightsEl.textContent = '0';
      if (rateEl) rateEl.textContent = '₦0';
      if (totalEl) totalEl.textContent = '₦0';
      if (noticeEl) {
        noticeEl.style.display = 'block';
        noticeEl.textContent = 'Please choose valid dates and a room type.';
        clearTimeout(noticeEl._hideTimer);
        noticeEl._hideTimer = setTimeout(() => { noticeEl.style.display = 'none'; }, 2200);
      }
      return;
    }

    const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
    const rate = roomRates[roomType] || 0;
    const total = nights * rate;

    if (nightsEl) nightsEl.textContent = nights;
    if (rateEl) rateEl.textContent = formatCurrency(rate);
    if (totalEl) totalEl.textContent = formatCurrency(total);
    if (noticeEl) noticeEl.style.display = 'none';
  }

  // Listeners
  checkin.addEventListener('change', () => {
    setCheckoutMinFromCheckin();
    calculate();
  });
  checkout.addEventListener('change', calculate);
  room.addEventListener('change', calculate);

  // initialize
  setTimeout(() => {
    setCheckoutMinFromCheckin();
    calculate();
  }, 40);
}

// Setup main booking calculator (main form)
setupBookingCalculator({
  checkinId: 'checkin',
  checkoutId: 'checkout',
  roomId: 'room',
  nightsId: 'nightsCount',
  rateId: 'ratePerNight',
  totalId: 'totalPrice',
  noticeId: 'bookingNotice'
});

// Setup modal booking calculator (modal form)
setupBookingCalculator({
  checkinId: 'modalCheckin',
  checkoutId: 'modalCheckout',
  roomId: 'modalRoom',
  nightsId: 'modalNightsCount',
  rateId: 'modalRatePerNight',
  totalId: 'modalTotalPrice',
  noticeId: 'modalBookingNotice' // ensure this ID matches your HTML
});

// ==============================
// Form submission handling (alerts) — keep forms independent
// - On success, show alert message as requested and reset only that form
// - Does NOT change the other form or other UI elements
// ==============================
const bookingForm = document.getElementById('bookingForm');
const modalForm = document.getElementById('modalForm');

function simpleAlertBooking(formEl, checkinId, checkoutId, roomId) {
  const checkin = document.getElementById(checkinId);
  const checkout = document.getElementById(checkoutId);
  const room = document.getElementById(roomId);

  if (!checkin || !checkout || !room) {
    alert('Booking fields are missing. Please refresh the page.');
    return false;
  }

  // Basic validation
  if (!checkin.value || !checkout.value || !room.value) {
    alert('Please complete check-in, check-out and room type before booking.');
    return false;
  }
  const ci = parseISO(checkin.value);
  const co = parseISO(checkout.value);
  if (!ci || !co || co <= ci) {
    alert('Please choose valid check-in and check-out dates.');
    return false;
  }

  // Successful booking (client-side simulation)
  alert(`✅ Booking confirmed!\nRoom: ${room.value.charAt(0).toUpperCase() + room.value.slice(1)}\nCheck-in: ${checkin.value}\nCheck-out: ${checkout.value}\nThank you — we will email you confirmation shortly.`);
  return true;
}

if (bookingForm) {
  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = simpleAlertBooking(bookingForm, 'checkin', 'checkout', 'room');
    if (ok) {
      bookingForm.reset();
      // reset the booking summary UI
      const nightsEl = document.getElementById('nightsCount');
      const rateEl = document.getElementById('ratePerNight');
      const totalEl = document.getElementById('totalPrice');
      if (nightsEl) nightsEl.textContent = '0';
      if (rateEl) rateEl.textContent = '₦0';
      if (totalEl) totalEl.textContent = '₦0';
    }
  });
}

if (modalForm) {
  modalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = simpleAlertBooking(modalForm, 'modalCheckin', 'modalCheckout', 'modalRoom');
    if (ok) {
      modalForm.reset();
      closeBookingModal();
      // reset modal summary UI
      const nightsEl = document.getElementById('modalNightsCount');
      const rateEl = document.getElementById('modalRatePerNight');
      const totalEl = document.getElementById('modalTotalPrice');
      if (nightsEl) nightsEl.textContent = '0';
      if (rateEl) rateEl.textContent = '₦0';
      if (totalEl) totalEl.textContent = '₦0';
    }
  });
}

/* =========================
   Room image slider modal
   - Uses existing .room-card .room-img img elements as the source
   - Builds one modal dynamically and shows 4 duplicated images for each room
   - Close by X, click outside, or Esc. Keyboard left/right navigation.
   ========================= */

   (function () {
    // Find all room images (existing structure)
    const roomCards = document.querySelectorAll('.room-card');
  
    if (!roomCards || roomCards.length === 0) return;
  
    // Create modal DOM once
    const modal = document.createElement('div');
    modal.className = 'room-slider-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="room-slider-container" role="document">
        <div class="room-slider-imagewrap">
          <img class="room-slider-main" src="" alt="Room image 1">
          <img class="room-slider-main room-slider-ghost hide" src="" alt="Room image 2">
        </div>
        <button class="room-slider-prev" aria-label="Previous image">&#10094;</button>
        <button class="room-slider-next" aria-label="Next image">&#10095;</button>
        <div class="room-slider-close" aria-label="Close gallery">&times;</div>
      </div>
      <div class="room-slider-counter" aria-hidden="true"></div>
    `;
    // Append to body
    document.body.appendChild(modal);
  
    // Element refs
    const modalContainer = modal.querySelector('.room-slider-container');
    const mainImg = modal.querySelector('.room-slider-main');
    const ghostImg = modal.querySelector('.room-slider-ghost'); // used for crossfade
    const prevBtn = modal.querySelector('.room-slider-prev');
    const nextBtn = modal.querySelector('.room-slider-next');
    const closeBtn = modal.querySelector('.room-slider-close');
    const counterEl = modal.querySelector('.room-slider-counter');
  
    // State
    let gallery = []; // array of URLs for current room
    let idx = 0;
  
    // Helper: open modal for a given gallery (array of src), start index 0
    function openGallery(srcArray, startIndex = 0, altText = '') {
      if (!Array.isArray(srcArray) || srcArray.length === 0) return;
      gallery = srcArray.slice(); // clone
      idx = Math.min(Math.max(0, startIndex), gallery.length - 1);
      // initial set
      mainImg.src = gallery[idx];
      mainImg.alt = altText || `Room image ${idx + 1}`;
      ghostImg.classList.add('hide');
      updateCounter();
      // show modal
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      // focus for keyboard nav
      nextBtn.focus();
      // trap scroll
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    }
  
    // Helper: close modal
    function closeGallery() {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
  
    // Update counter text
    function updateCounter() {
      counterEl.textContent = `${idx + 1} / ${gallery.length}`;
    }
  
    // Crossfade to new index
    function showIndex(newIndex) {
      if (newIndex === idx) return;
      newIndex = (newIndex + gallery.length) % gallery.length;
      // set ghost to current visible, set main to new one, then crossfade
      ghostImg.src = mainImg.src;
      ghostImg.alt = mainImg.alt;
      ghostImg.classList.remove('hide'); // visible (opacity 1)
      // a tiny delay to ensure browser registers change (helps transitions)
      setTimeout(() => {
        mainImg.src = gallery[newIndex];
        mainImg.alt = `Room image ${newIndex + 1}`;
        // hide ghost (fade out) after small delay
        setTimeout(() => {
          ghostImg.classList.add('hide');
        }, 40);
      }, 8);
      idx = newIndex;
      updateCounter();
    }
  
    // Prev/Next handlers
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showIndex(idx - 1);
    });
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showIndex(idx + 1);
    });
  
    // Close handlers
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeGallery();
    });
  
    // click outside to close (on overlay)
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeGallery();
    });
  
    // keyboard nav
    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('open')) return;
      if (e.key === 'Escape') closeGallery();
      if (e.key === 'ArrowLeft') showIndex(idx - 1);
      if (e.key === 'ArrowRight') showIndex(idx + 1);
    });
  
    // For each room card, attach click to open gallery.
    // Use the room's existing image src as the base: duplicate it 4x for the gallery.
    roomCards.forEach(card => {
      const imgEl = card.querySelector('.room-img img');
      if (!imgEl) return;
      const src = imgEl.src;
      const alt = imgEl.alt || card.querySelector('h3')?.textContent || 'Room image';
      card.addEventListener('click', (e) => {
        // prevent clicks on booking button inside card from opening the gallery
        const insideBookingBtn = e.target.closest('.room-open');
        if (insideBookingBtn) return; // let the booking button behave separately
  
        // build gallery of 4 duplicates for now
        const galleryArray = [src, src, src, src];
        openGallery(galleryArray, 0, alt);
      });
  
      // Also make the image specifically clickable (more precise)
      imgEl.style.cursor = 'pointer';
      imgEl.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const galleryArray = [src, src, src, src];
        openGallery(galleryArray, 0, alt);
      });
    });
  
  })();
  

// ==========================
// DINING MENU IMAGE POPUP
// ==========================

const viewMenuBtn = document.getElementById('viewMenuBtn');
const menuModal = document.getElementById('menuModal');
const closeMenu = document.querySelector('.close-menu');

// Open the menu modal
if (viewMenuBtn) {
  viewMenuBtn.addEventListener('click', (e) => {
    e.preventDefault();
    menuModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  });
}

// Close the modal when clicking close button
if (closeMenu) {
  closeMenu.addEventListener('click', () => {
    menuModal.style.display = 'none';
    document.body.style.overflow = '';
  });
}

// Close when clicking outside images
menuModal.addEventListener('click', (e) => {
  if (e.target === menuModal) {
    menuModal.style.display = 'none';
    document.body.style.overflow = '';
  }
});

// Close with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menuModal.style.display === 'flex') {
    menuModal.style.display = 'none';
    document.body.style.overflow = '';
  }
});

document.addEventListener('DOMContentLoaded', function () {
  const amenities = document.querySelectorAll('.amenity-item');
  const modal = document.getElementById('amenityModal');
  const closeBtn = modal.querySelector('.close');
  const modalImg = document.getElementById('amenityImage');
  const modalTitle = document.getElementById('amenityTitle');

  // Temporary placeholder image (use your own later)
  const placeholderImage = "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=900&q=80";

  amenities.forEach(item => {
    item.addEventListener('click', () => {
      const title = item.getAttribute('data-amenity');
      modalTitle.textContent = title;
      modalImg.src = placeholderImage;
      modal.style.display = 'flex';
    });
  });

  closeBtn.addEventListener('click', () => modal.style.display = 'none');
  window.addEventListener('click', e => {
    if (e.target == modal) modal.style.display = 'none';
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const amenities = document.querySelectorAll('.amenity-item');
  const modal = document.getElementById('amenityModal');
  const closeBtn = modal.querySelector('.close');
  const modalImg = document.getElementById('amenityImage');
  const modalTitle = document.getElementById('amenityTitle');

  const placeholderImage = "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=900&q=80";

  amenities.forEach(item => {
    item.addEventListener('click', () => {
      const title = item.getAttribute('data-amenity');
      modalTitle.textContent = title;
      modalImg.src = placeholderImage;
      modal.style.display = 'flex';
    });
  });

  closeBtn.addEventListener('click', () => modal.style.display = 'none');
  window.addEventListener('click', e => {
    if (e.target == modal) modal.style.display = 'none';
  });
});

//deals button
// const dealsBadge = document.getElementById('dealsBadge');
// const dealsModal = document.getElementById('dealsModal');
// const closeDeals = document.getElementById('closeDeals');

// dealsBadge.addEventListener('click', () => {
//     dealsModal.style.display = 'block';
// });

// closeDeals.addEventListener('click', () => {
//     dealsModal.style.display = 'none';
// });

// window.addEventListener('click', (e) => {
//     if (e.target === dealsModal) dealsModal.style.display = 'none';
// });



// ==============================
// Final notes for future tweaks (no action required now):
// - The room rates shown inside the "Exquisite Accommodations" cards (the textual price inside each card) are static HTML.
//   This script does not and will not change those card prices. Each "Book [Type]" button only pre-fills the modal.
// - The main booking form is independent; selecting a room there updates the main summary only.
// - The modal booking form is independent; pre-filling it via a card button only affects the modal.
// ==============================
// === Add Terms & Conditions Captcha to all booking forms ===
document.addEventListener("DOMContentLoaded", () => {
  const allForms = document.querySelectorAll("form");

  allForms.forEach(form => {
    // Check if the form has a "Book" or "Confirm Reservation" button
    const bookButton = form.querySelector("button[type='submit'], .btn");
    if (bookButton && !form.querySelector(".terms-captcha")) {

      // Create the terms div
      const termsDiv = document.createElement("div");
      termsDiv.classList.add("form-group", "terms-captcha");
      termsDiv.innerHTML = `
        <label style="display:flex;align-items:center;gap:8px;">
          <input type="checkbox" id="termsCaptcha" required>
          <span style="color:yellow; font-style:italic; font-size:14px;">
            I agree that my booking is not fully secured until a 50% down payment is made.
            Bookings are first-come, first-serve, and deposits are non-refundable after the stay expires.
            Please contact Wizmore Hotel via WhatsApp, phone, or email to confirm your down payment.
          </span>
        </label>
      `;

      // Insert the terms div before the submit button
      bookButton.parentNode.insertBefore(termsDiv, bookButton);
    }
  });
});

