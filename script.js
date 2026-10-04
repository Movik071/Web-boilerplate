document.addEventListener('DOMContentLoaded', () => {
    const addTeacherModal = document.getElementById('add-teacher-modal');
    const infoTeacherModal = document.getElementById('info-teacher-modal');

    const openAddButtons = document.querySelectorAll('.js-open-add-modal');
    const openInfoButtons = document.querySelectorAll('.js-open-info-modal');

    const closeButtons = document.querySelectorAll('.js-close-modal');

    function openModal(modal) {
        if (modal) {
            modal.classList.add('active');
        }
    }

    function closeModal(modal) {
        if (modal) {
            modal.classList.remove('active');
        }
    }

    openAddButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(addTeacherModal);
        });
    });

    openInfoButtons.forEach(card => {
        card.addEventListener('click', () => {
            openModal(infoTeacherModal);
        });
    });

    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal-overlay');
            closeModal(modal);
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeModal(e.target);
        }
    });
});