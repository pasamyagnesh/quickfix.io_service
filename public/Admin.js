
  let allRequests = [];
  let currentRequest = null;
    let allWorkers = [];
 async function fetchRequests() {
  try {
    const res = await fetch('/api/requests');
    const data = await res.json();
    if (data.success) {
      allRequests = data.data;
      populateTables();

      // === 📊 STATS CALCULATIONS ===
      const now = new Date();
      const thisMonth = now.getMonth();
      const lastMonth = (thisMonth === 0) ? 11 : thisMonth - 1;

      const total = allRequests.length;
      const completed = allRequests.filter(r => r.status === 'completed').length;
      const pending = allRequests.filter(r => r.status === 'pending').length;

      // ✅ ✔ Insert this block BELOW your total/pending/completed counts 👇
      const requestsThisMonth = allRequests.filter(r => {
        const date = new Date(r.createdAt);
        return date.getMonth() === thisMonth && date.getFullYear() === now.getFullYear();
      }).length;

      const requestsLastMonth = allRequests.filter(r => {
        const date = new Date(r.createdAt);
        return date.getMonth() === lastMonth && date.getFullYear() === now.getFullYear();
      }).length;

      let growth = 0;
      let growthText = 'No data from last month';

      if (requestsLastMonth > 0) {
        growth = ((requestsThisMonth - requestsLastMonth) / requestsLastMonth) * 100;
        const arrow = growth >= 0 ? 'up' : 'down';
        growthText = `<i class="fas fa-arrow-${arrow} mr-1"></i>${Math.abs(growth).toFixed(1)}% from last month`;
      } else if (requestsThisMonth > 0) {
        growthText = `<i class="fas fa-arrow-up mr-1"></i>New this month`;
      } else {
        growthText = `<i class="fas fa-minus mr-1"></i>0% (no new requests)`;
      }

      const successRate = (completed / Math.max(total, 1)) * 100;

      // === 💾 Update UI ===
      document.getElementById('totalRequests').textContent = total;
      document.getElementById('pendingRequests').textContent = pending;
      document.getElementById('completedRequests').textContent = completed;

      document.getElementById('growthRate').innerHTML = growthText;

      document.getElementById('successRate').innerHTML = `
        <i class="fas fa-check mr-1"></i>${successRate.toFixed(1)}% success rate
      `;
    }
  } catch (err) {
    console.error('❌ Fetch error:', err);
  }
}



async function fetchServiceProviders() {
  try {
    const res = await fetch('/api/service-providers');
    const data = await res.json();
    if (data.success) {
      allWorkers = data.data;
      document.getElementById('totalWorkers').textContent = data.data.length;
      renderWorkersTable(allWorkers);
    }
  } catch (err) {
    console.error('❌ Error fetching workers:', err);
  }
}


/* -------- 2. Render each worker in a table row ------ */

async function updateWorkerRating(id) {
  const input = document.getElementById(`rating-${id}`);
  const newRating = parseFloat(input.value);

  if (isNaN(newRating) || newRating < 0 || newRating > 5) {
    alert('Please enter a valid rating (0 to 5)');
    return;
  }

  try {
    const res = await fetch(`/api/service-providers/${id}/rating`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: newRating })
    });

    if (res.ok) {
      alert('✅ Rating updated successfully!');
    } else {
      alert('❌ Failed to update rating');
    }
  } catch (err) {
    console.error('❌ Error updating rating:', err);
    alert('❌ Server error');
  }
}

  // Call this in onload
  window.onload = () => {
    fetchRequests();
    fetchServiceProviders(); // 👈 Call it here
  };


  function populateTables() {
    const recentTable = document.getElementById('recentRequestsTable');
    const allTable = document.getElementById('allRequestsTable');
    recentTable.innerHTML = '';
    allTable.innerHTML = '';

    allRequests.forEach((req, index) => {
      const statusClass = req.status === 'pending' ? 'status-pending' :
                          req.status === 'in-progress' ? 'status-in-progress' : 'status-completed';

      const recentRow = `
        <tr class="table-row cursor-pointer" onclick="openModal('${req._id}')">
          <td class="py-3 px-4">${req.name}</td>
          <td class="py-3 px-4">${req.serviceType}</td>
          <td class="py-3 px-4">${req.phone}</td>
          <td class="py-3 px-4"><span class="status-badge ${statusClass}">${req.status}</span></td>
          <td class="py-3 px-4">${new Date(req.createdAt).toLocaleDateString()}</td>
          <td class="py-3 px-4 text-primary font-medium">View</td>
        </tr>
      `;

      const allRow = `
        <tr class="table-row cursor-pointer" onclick="openModal('${req._id}')">
          <td class="py-3 px-4">${req._id.slice(-5)}</td>
          <td class="py-3 px-4">${req.name}</td>
          <td class="py-3 px-4">${req.serviceType}</td>
          <td class="py-3 px-4">${req.phone}</td>
          <td class="py-3 px-4">${req.address}</td>
          <td class="py-3 px-4"><span class="status-badge ${statusClass}">${req.status}</span></td>
          <td class="py-3 px-4">${new Date(req.createdAt).toLocaleDateString()}</td>
          <td class="py-3 px-4 text-primary font-medium">View</td>
        </tr>
      `;

      if (index < 3) recentTable.innerHTML += recentRow;
      allTable.innerHTML += allRow;
    });
  }

  function openModal(id) {
    currentRequest = allRequests.find(r => r._id === id);
    const content = document.getElementById('modalContent');
    const modal = document.getElementById('requestModal');

    if (currentRequest) {
      content.innerHTML = `
        <p><strong>Request ID:</strong> ${currentRequest._id}</p>
        <p><strong>Customer:</strong> ${currentRequest.name}</p>
        <p><strong>Service:</strong> ${currentRequest.serviceType}</p>
        <p><strong>Phone:</strong> ${currentRequest.phone}</p>
        <p><strong>Address:</strong> ${currentRequest.address}</p>
        <p><strong>Status:</strong> ${currentRequest.status}</p>
        <p><strong>Date:</strong> ${new Date(currentRequest.createdAt).toLocaleDateString()}</p>
      `;
      modal.classList.remove('hidden');
    }
  }

  function closeModal() {
    document.getElementById('requestModal').classList.add('hidden');
  }

  async function updateRequestStatus(newStatus) {
    if (!currentRequest) return;
    try {
      const res = await fetch(`/api/requests/${currentRequest._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        closeModal();
        fetchRequests();
      }
    } catch (err) {
      console.error('❌ Update error:', err);
    }
  }

  function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(sectionId).classList.remove('hidden');

    document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
    event.currentTarget.classList.add('active');
    if (sectionId === 'workers') {
    fetchServiceProviders();
  }
  }
let currentWorker = null;

function openWorkerModal(id) {
    console.log("🧠 All Workers:", allWorkers);
  console.log("✅ openWorkerModal triggered with ID:", id);  // Add this
  currentWorker = allWorkers.find(w => String(w._id) === id);
  console.log(currentWorker)
  const content = document.getElementById('workerModalContent');

  if (currentWorker) {
    content.innerHTML = `
      <p><strong>Name:</strong> ${currentWorker.name}</p>
      <p><strong>Profession:</strong> ${currentWorker.profession}</p>
      <p><strong>Phone:</strong> ${currentWorker.phone}</p>
      <p><strong>Location:</strong> ${currentWorker.location}</p>
      <label for="workerStatus" class="block mt-2 text-sm font-medium text-gray-700">Status:</label>
      <select id="workerStatus" class="w-full border px-3 py-2 rounded-md">
        <option value="Not Assigned" ${currentWorker.status === 'Not Assigned' ? 'selected' : ''}>Not Assigned</option>
        <option value="Assigned" ${currentWorker.status === 'Assigned' ? 'selected' : ''}>Assigned</option>
      </select>
    `;

    // ✅ Show modal
    document.getElementById('workerModal').classList.remove('hidden');
  } else {
    console.warn("❌ Worker not found for ID:", id);
  }
}

function closeWorkerModal() {
  document.getElementById('workerModal').classList.add('hidden');
}

async function saveWorkerStatus() {
  if (!currentWorker) return;

  const newStatus = document.getElementById('workerStatus').value;

  try {
    const res = await fetch(`/api/service-providers/${currentWorker._id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (res.ok) {
      closeWorkerModal();
      fetchServiceProviders();  // re-render updated table
    } else {
      alert('Failed to update worker status');
    }
  } catch (err) {
    console.error('❌ Update error:', err);
  }
}
function renderWorkersTable(workers) {
  const table = document.getElementById('workersTable');
  if (!table) {
    console.error('❌ #workersTable not found');
    return;
  }

  table.innerHTML = '';                     // clear old rows
  console.log('Rendering workers:', workers);

  workers.forEach(worker => {
    const row = document.createElement('tr');
    row.classList.add('table-row');

   row.innerHTML = `
  <td class="py-3 px-4">${worker._id.slice(-5)}</td>
  <td class="py-3 px-4">${worker.name}</td>
  <td class="py-3 px-4">${worker.profession}</td>
  <td class="py-3 px-4">${worker.phone}</td>
  <td class="py-3 px-4">${worker.location}</td>
  <td class="py-3 px-4">
    <input type="number" min="0" max="5" step="0.1"
           value="${worker.rating}" id="rating-${worker._id}"
           class="w-20 px-2 py-1 border rounded-md text-center">
  </td>
  <td class="py-3 px-4">
    <span class="status-badge ${
      worker.status === 'Assigned' ? 'status-in-progress' : 'status-pending'
    }">${worker.status}</span>
  </td>
  <td class="py-3 px-4">
    <button onclick="openWorkerModal('${worker._id}')" class="text-primary hover:underline">Edit</button>
  </td>
`;

    table.appendChild(row);
  });
}

window.onload = () => {
  fetchRequests();
  fetchServiceProviders(); // ✅ ensure this runs
};
