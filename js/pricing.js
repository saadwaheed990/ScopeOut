/* ============================================
   PRICING PAGE - Tab Toggle Script
   ============================================ */

(function() {
    'use strict';

    var tabBtns = document.querySelectorAll('.tab-btn');
    var pricingTables = document.querySelectorAll('.pricing-table');

    tabBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var targetTab = this.getAttribute('data-tab');

            tabBtns.forEach(function(b) {
                b.classList.remove('tab-active');
            });

            pricingTables.forEach(function(table) {
                table.classList.remove('tab-active');
            });

            this.classList.add('tab-active');

            var targetTable = document.getElementById(targetTab);
            if (targetTable) {
                targetTable.classList.add('tab-active');
            }
        });
    });
})();
