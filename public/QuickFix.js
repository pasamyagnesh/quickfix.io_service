
        // Loader functionality
        window.addEventListener('load', function() {
            const loaderOverlay = document.getElementById('loaderOverlay');
            const mainContent = document.getElementById('mainContent');
            
            // Hide loader after 2.5 seconds
            setTimeout(() => {
                loaderOverlay.classList.add('hidden');
                mainContent.style.opacity = '1';
                mainContent.style.transition = 'opacity 0.5s ease-in';
            }, 2500);
        });

        const form = document.getElementById('serviceForm');
        const loadingState = document.getElementById('loadingState');
        const successState = document.getElementById('successState');
        const submitBtn = document.getElementById('submitBtn');

        function resetForm() {
            form.reset();
            form.classList.remove('hidden');
            successState.classList.add('hidden');
        }

        // Add floating animation to service cards
        document.querySelectorAll('.service-card-glass').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
            card.classList.add('fade-in');
        });

     form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Get form data
    const formData = {
      name: document.getElementById('name').value,
      phone: document.getElementById('phone').value,
      address: document.getElementById('address').value,
      serviceType: document.getElementById('serviceType').value
    };

    // Hide form and show loading
    form.classList.add('hidden');
    loadingState.classList.remove('hidden');

    // Send to backend
    fetch('/api/submit-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(data => {
        loadingState.classList.add('hidden');

        if (data.success) {
          successState.classList.remove('hidden');
          console.log("Success..................")
          // ✅ Open WhatsApp with worker contact info
          if (data.whatsappLink) {
            window.open(data.whatsappLink, '_blank');
          }
        } else {
          alert("❌ Failed to submit request.");
          form.classList.remove('hidden');
        }
      })
      .catch(err => {
        alert("Something went wrong. Try again later.");
        console.error(err);
        form.classList.remove('hidden');
        loadingState.classList.add('hidden');
      });
  });
