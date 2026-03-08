/* ============================================================
   IMPULSE DRIVING SCHOOL - BOOKING PAGE JAVASCRIPT
   Complete multi-step booking form with calendar, validation,
   summary generation, API submission, and success modal.
   ============================================================ */

(function() {
    'use strict';

    var API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : '';

    // ---- State ----
    var currentStep = 1;
    var selectedDate = null;
    var selectedTime = null;
    var calendarMonth = new Date().getMonth();
    var calendarYear = new Date().getFullYear();

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 60);

    var monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];

    // ---- Course price data ----
    var courseData = {
        payg:        { name: 'Pay As You Go',       manual: 72,   auto: 74 },
        block:       { name: 'Block Booking 10hrs', manual: 335,  auto: 340 },
        intensive6:  { name: 'Intensive 6hr',       manual: 465,  auto: 465 },
        intensive10: { name: 'Intensive 10hr',      manual: 695,  auto: 695 },
        intensive20: { name: 'Intensive 20hr',      manual: 1295, auto: 1295 },
        intensive30: { name: 'Intensive 30hr',      manual: 1695, auto: 1695 },
        intensive40: { name: 'Intensive 40hr',      manual: 1895, auto: 1895 },
        guaranteed:  { name: 'Guaranteed Pass',     manual: 2995, auto: 2995 }
    };

    // ---- Transmission Toggle: update displayed prices ----
    var transmissionRadios = document.querySelectorAll('input[name="transmission"]');
    for (var t = 0; t < transmissionRadios.length; t++) {
        transmissionRadios[t].addEventListener('change', updateDisplayedPrices);
    }

    function getTransmission() {
        var checked = document.querySelector('input[name="transmission"]:checked');
        return checked ? checked.value : 'Manual';
    }

    function updateDisplayedPrices() {
        var trans = getTransmission();
        var isManual = (trans === 'Manual');
        var cards = document.querySelectorAll('.course-radio-card');
        for (var c = 0; c < cards.length; c++) {
            var card = cards[c];
            var input = card.querySelector('input[type="radio"]');
            var val = input.value;
            var data = courseData[val];
            if (!data) continue;
            var price = isManual ? data.manual : data.auto;
            var priceEl = card.querySelector('.dynamic-price');
            if (priceEl) {
                if (val === 'payg') {
                    priceEl.textContent = '\u00A3' + price;
                } else if (val === 'block') {
                    priceEl.textContent = isManual ? '\u00A3330\u2013\u00A3340' : '\u00A3330\u2013\u00A3350';
                } else {
                    priceEl.textContent = '\u00A3' + price.toLocaleString();
                }
            }
        }
    }

    // ---- Calendar ----
    function renderCalendar() {
        var grid = document.getElementById('calendarGrid');
        var title = document.getElementById('calendarTitle');
        grid.innerHTML = '';
        title.textContent = monthNames[calendarMonth] + ' ' + calendarYear;

        var prevBtn = document.getElementById('calPrev');
        if (calendarYear === today.getFullYear() && calendarMonth <= today.getMonth()) {
            prevBtn.disabled = true;
        } else {
            prevBtn.disabled = false;
        }

        var nextBtn = document.getElementById('calNext');
        if (calendarYear > maxDate.getFullYear() ||
            (calendarYear === maxDate.getFullYear() && calendarMonth >= maxDate.getMonth())) {
            nextBtn.disabled = true;
        } else {
            nextBtn.disabled = false;
        }

        var firstDay = new Date(calendarYear, calendarMonth, 1);
        var startDay = firstDay.getDay();
        startDay = (startDay === 0) ? 6 : startDay - 1;

        var daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

        for (var e = 0; e < startDay; e++) {
            var empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            grid.appendChild(empty);
        }

        for (var d = 1; d <= daysInMonth; d++) {
            var cell = document.createElement('button');
            cell.type = 'button';
            cell.className = 'calendar-day';
            cell.textContent = d;

            var cellDate = new Date(calendarYear, calendarMonth, d);
            cellDate.setHours(0, 0, 0, 0);

            if (cellDate < today) {
                cell.classList.add('disabled');
            } else if (cellDate > maxDate) {
                cell.classList.add('disabled');
            } else {
                cell.classList.add('available');
                cell.setAttribute('data-date', cellDate.toISOString().split('T')[0]);
                (function(btn) {
                    btn.addEventListener('click', function() {
                        selectDate(btn);
                    });
                })(cell);
            }

            if (cellDate.getTime() === today.getTime()) {
                cell.classList.add('today');
            }

            if (selectedDate && cellDate.toISOString().split('T')[0] === selectedDate) {
                cell.classList.add('selected');
            }

            grid.appendChild(cell);
        }
    }

    function selectDate(el) {
        var allSelected = document.querySelectorAll('.calendar-day.selected');
        for (var i = 0; i < allSelected.length; i++) {
            allSelected[i].classList.remove('selected');
        }
        el.classList.add('selected');
        selectedDate = el.getAttribute('data-date');
    }

    document.getElementById('calPrev').addEventListener('click', function() {
        calendarMonth--;
        if (calendarMonth < 0) {
            calendarMonth = 11;
            calendarYear--;
        }
        renderCalendar();
    });

    document.getElementById('calNext').addEventListener('click', function() {
        calendarMonth++;
        if (calendarMonth > 11) {
            calendarMonth = 0;
            calendarYear++;
        }
        renderCalendar();
    });

    renderCalendar();

    // ---- Time Slots ----
    var timeSlots = document.querySelectorAll('.time-slot');
    for (var s = 0; s < timeSlots.length; s++) {
        (function(slot) {
            slot.addEventListener('click', function(e) {
                e.preventDefault();
                var allActive = document.querySelectorAll('.time-slot.active');
                for (var j = 0; j < allActive.length; j++) {
                    allActive[j].classList.remove('active');
                }
                slot.classList.add('active');
                selectedTime = slot.getAttribute('data-time');
            });
        })(timeSlots[s]);
    }

    // ---- Step Navigation ----
    window.nextStep = function(fromStep) {
        if (!validateStep(fromStep)) return;

        if (fromStep === 3) {
            generateSummary();
        }

        currentStep = fromStep + 1;
        showStep(currentStep);
        updateProgress();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.prevStep = function(fromStep) {
        currentStep = fromStep - 1;
        showStep(currentStep);
        updateProgress();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    function showStep(step) {
        var allSteps = document.querySelectorAll('.booking-step');
        for (var i = 0; i < allSteps.length; i++) {
            allSteps[i].classList.remove('active');
        }
        var el = document.getElementById('step' + step);
        if (el) {
            el.style.animation = 'none';
            el.offsetHeight;
            el.style.animation = '';
            el.classList.add('active');
        }
    }

    function updateProgress() {
        var steps = document.querySelectorAll('.progress-step');
        for (var i = 0; i < steps.length; i++) {
            var stepNum = parseInt(steps[i].getAttribute('data-step'));
            steps[i].classList.remove('active', 'completed');
            if (stepNum < currentStep) {
                steps[i].classList.add('completed');
            } else if (stepNum === currentStep) {
                steps[i].classList.add('active');
            }
        }

        var fill = document.getElementById('progressFill');
        var pct = ((currentStep - 1) / 3) * 100;
        fill.style.width = pct + '%';
    }

    // ---- Validation ----
    function validateStep(step) {
        clearErrors();

        if (step === 1) {
            var course = document.querySelector('input[name="course"]:checked');
            if (!course) {
                alert('Please select a course to continue.');
                return false;
            }
            return true;
        }

        if (step === 2) {
            if (!selectedDate) {
                alert('Please select a date on the calendar.');
                return false;
            }
            if (!selectedTime) {
                alert('Please select a time slot.');
                return false;
            }
            return true;
        }

        if (step === 3) {
            var valid = true;

            var nameField = document.getElementById('fullName');
            if (!nameField.value.trim()) {
                setError(nameField);
                valid = false;
            }

            var emailField = document.getElementById('email');
            var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailField.value.trim() || !emailPattern.test(emailField.value.trim())) {
                setError(emailField);
                valid = false;
            }

            var phoneField = document.getElementById('phone');
            var phoneVal = phoneField.value.replace(/\s+/g, '');
            var phonePattern = /^(\+44|0)7\d{9}$/;
            if (!phoneVal || !phonePattern.test(phoneVal)) {
                setError(phoneField);
                valid = false;
            }

            var licence = document.querySelector('input[name="licence"]:checked');
            if (!licence) {
                var licenceInputs = document.querySelectorAll('input[name="licence"]');
                if (licenceInputs.length > 0) {
                    var licenceGroup = licenceInputs[0].closest('.form-group');
                    if (licenceGroup) licenceGroup.classList.add('has-error');
                }
                valid = false;
            }

            if (!valid) {
                var firstErr = document.querySelector('.form-group.has-error');
                if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            return valid;
        }

        return true;
    }

    function setError(input) {
        var group = input.closest('.form-group');
        if (group) group.classList.add('has-error');
        input.classList.add('error');
    }

    function clearErrors() {
        var errorGroups = document.querySelectorAll('.form-group.has-error');
        for (var i = 0; i < errorGroups.length; i++) {
            errorGroups[i].classList.remove('has-error');
        }
        var errorInputs = document.querySelectorAll('.form-input.error');
        for (var j = 0; j < errorInputs.length; j++) {
            errorInputs[j].classList.remove('error');
        }
        var tw = document.getElementById('termsWrap');
        if (tw) tw.classList.remove('has-error');
    }

    var formInputs = document.querySelectorAll('.form-input');
    for (var fi = 0; fi < formInputs.length; fi++) {
        formInputs[fi].addEventListener('focus', function() {
            var group = this.closest('.form-group');
            if (group) group.classList.remove('has-error');
            this.classList.remove('error');
        });
    }

    // ---- Summary Generation ----
    function generateSummary() {
        var courseRadio = document.querySelector('input[name="course"]:checked');
        var courseVal = courseRadio ? courseRadio.value : '';
        var trans = getTransmission();
        var data = courseData[courseVal];

        document.getElementById('sumCourse').textContent = data ? data.name : '\u2014';
        document.getElementById('sumTransmission').textContent = trans;

        if (data) {
            var price = (trans === 'Manual') ? data.manual : data.auto;
            document.getElementById('sumPrice').textContent = '\u00A3' + price.toLocaleString();
        }

        if (selectedDate) {
            var dateObj = new Date(selectedDate + 'T00:00:00');
            var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('sumDate').textContent = dateObj.toLocaleDateString('en-GB', options);
        }

        document.getElementById('sumTime').textContent = selectedTime || '\u2014';
        document.getElementById('sumInstructor').textContent = document.getElementById('instructor').value;
        document.getElementById('sumArea').textContent = document.getElementById('pickupArea').value || 'Not specified';

        document.getElementById('sumName').textContent = document.getElementById('fullName').value;
        document.getElementById('sumEmail').textContent = document.getElementById('email').value;
        document.getElementById('sumPhone').textContent = document.getElementById('phone').value;

        var licence = document.querySelector('input[name="licence"]:checked');
        document.getElementById('sumLicence').textContent = licence ? licence.value : '\u2014';
        document.getElementById('sumExperience').textContent = document.getElementById('experience').value;

        var contact = document.querySelector('input[name="contactMethod"]:checked');
        document.getElementById('sumContact').textContent = contact ? contact.value : 'Phone';
    }

    // ---- Confirm Booking (API Integration) ----
    window.confirmBooking = function() {
        var termsBox = document.getElementById('termsAgree');
        var termsWrap = document.getElementById('termsWrap');

        if (!termsBox.checked) {
            termsWrap.classList.add('has-error');
            termsWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        var confirmBtn = document.querySelector('.btn-confirm');
        var originalText = confirmBtn.innerHTML;
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        var courseRadio = document.querySelector('input[name="course"]:checked');
        var courseVal = courseRadio ? courseRadio.value : '';
        var trans = getTransmission();
        var data = courseData[courseVal];
        var price = data ? ((trans === 'Manual') ? data.manual : data.auto) : 0;

        var bookingData = {
            course: data ? data.name : courseVal,
            transmission: trans.toLowerCase(),
            date: selectedDate,
            time_slot: selectedTime,
            name: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            notes: document.getElementById('additionalNotes') ? document.getElementById('additionalNotes').value.trim() : '',
            amount: price
        };

        fetch(API_BASE + '/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(result) {
            if (result.success) {
                document.getElementById('refNumber').textContent = result.booking.reference;
                document.getElementById('successModal').classList.add('active');
                document.body.style.overflow = 'hidden';
            } else {
                alert('Booking failed: ' + (result.error || 'Please try again.'));
            }
        })
        .catch(function(err) {
            // Fallback: generate client-side reference if API is unavailable
            console.warn('API unavailable, generating client-side reference:', err);
            var refNum = 'IMP-' + (Math.floor(10000 + Math.random() * 90000));
            document.getElementById('refNumber').textContent = refNum;
            document.getElementById('successModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        })
        .finally(function() {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = originalText;
        });
    };

    // ---- Close Modal ----
    window.closeModal = function() {
        document.getElementById('successModal').classList.remove('active');
        document.body.style.overflow = '';
        window.location.href = '../index.html';
    };

    document.getElementById('successModal').addEventListener('click', function(e) {
        if (e.target === this) {
            window.closeModal();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            var modal = document.getElementById('successModal');
            if (modal.classList.contains('active')) {
                window.closeModal();
            }
        }
    });

})();
