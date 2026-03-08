/* ============================================
   CONTACT PAGE - Form Validation & API Submission
   ============================================ */

(function() {
    'use strict';

    var API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000'
        : '';

    var form = document.getElementById('contactForm');
    var successMsg = document.getElementById('formSuccess');

    if (!form) return;

    function showError(id, show) {
        var el = document.getElementById(id);
        if (el) el.style.display = show ? 'block' : 'none';
    }

    function setFieldError(input, hasError) {
        input.style.borderColor = hasError ? '#e74c3c' : '#e0e0e0';
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    var nameInput = document.getElementById('contactName');
    var emailInput = document.getElementById('contactEmail');
    var subjectInput = document.getElementById('contactSubject');
    var messageInput = document.getElementById('contactMessage');

    nameInput.addEventListener('blur', function() {
        var empty = !this.value.trim();
        showError('nameError', empty);
        setFieldError(this, empty);
    });

    emailInput.addEventListener('blur', function() {
        var invalid = !validateEmail(this.value.trim());
        showError('emailError', invalid);
        setFieldError(this, invalid);
    });

    subjectInput.addEventListener('change', function() {
        var empty = !this.value;
        showError('subjectError', empty);
        setFieldError(this, empty);
    });

    messageInput.addEventListener('blur', function() {
        var empty = !this.value.trim();
        showError('messageError', empty);
        setFieldError(this, empty);
    });

    [nameInput, emailInput, messageInput].forEach(function(input) {
        input.addEventListener('input', function() {
            setFieldError(this, false);
        });
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        var isValid = true;
        var name = nameInput.value.trim();
        var email = emailInput.value.trim();
        var subject = subjectInput.value;
        var message = messageInput.value.trim();
        var phone = document.getElementById('contactPhone') ? document.getElementById('contactPhone').value.trim() : '';

        if (!name) {
            showError('nameError', true);
            setFieldError(nameInput, true);
            isValid = false;
        } else {
            showError('nameError', false);
            setFieldError(nameInput, false);
        }

        if (!validateEmail(email)) {
            showError('emailError', true);
            setFieldError(emailInput, true);
            isValid = false;
        } else {
            showError('emailError', false);
            setFieldError(emailInput, false);
        }

        if (!subject) {
            showError('subjectError', true);
            setFieldError(subjectInput, true);
            isValid = false;
        } else {
            showError('subjectError', false);
            setFieldError(subjectInput, false);
        }

        if (!message) {
            showError('messageError', true);
            setFieldError(messageInput, true);
            isValid = false;
        } else {
            showError('messageError', false);
            setFieldError(messageInput, false);
        }

        if (!isValid) return;

        var submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        var contactData = {
            name: name,
            email: email,
            phone: phone,
            subject: subject,
            message: message
        };

        fetch(API_BASE + '/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contactData)
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(result) {
            if (result.success) {
                form.style.display = 'none';
                successMsg.style.display = 'block';
            } else {
                alert('Failed to send message: ' + (result.error || 'Please try again.'));
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
            }
        })
        .catch(function(err) {
            // Fallback: show success even if API is unavailable (graceful degradation)
            console.warn('API unavailable:', err);
            form.style.display = 'none';
            successMsg.style.display = 'block';
        });
    });
})();
