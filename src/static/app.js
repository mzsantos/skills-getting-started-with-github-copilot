document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select options (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML
        const participantsHTML = details.participants && details.participants.length
          ? `
            <div class="participants">
              <strong>Participants</strong>
              <ul class="participants-list">
                ${details.participants.map(p => `<li class="participant-item"><span class="participant-email">${p}</span><button class="participant-remove" data-activity="${name}" data-email="${p}" title="Remove participant">✖</button></li>`).join("")}
              </ul>
            </div>
          `
          : `<p class="no-participants">No participants yet</p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Attach remove handlers for participants in this card
        const removeButtons = activityCard.querySelectorAll('.participant-remove');
        removeButtons.forEach((btn) => {
          btn.addEventListener('click', async (e) => {
            const email = btn.dataset.email;
            const activityName = btn.dataset.activity;
            try {
              const res = await fetch(
                `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
                { method: 'DELETE' }
              );
              const payload = await res.json();
              if (res.ok) {
                messageDiv.textContent = payload.message || 'Participant removed';
                messageDiv.className = 'message success';
                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 3000);
                // Refresh activities to reflect removal
                fetchActivities();
              } else {
                messageDiv.textContent = payload.detail || 'Failed to remove participant';
                messageDiv.className = 'message error';
                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 4000);
              }
            } catch (err) {
              console.error('Error removing participant:', err);
              messageDiv.textContent = 'Network error while removing participant';
              messageDiv.className = 'message error';
              messageDiv.classList.remove('hidden');
              setTimeout(() => messageDiv.classList.add('hidden'), 4000);
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        // Optimistically update the UI for this activity so users see the change immediately
        const selectedActivity = activity; // keep before reset
        signupForm.reset();

        // Try to find the activity card and append the new participant
        const cards = Array.from(activitiesList.querySelectorAll('.activity-card'));
        const card = cards.find(c => {
          const h4 = c.querySelector('h4');
          return h4 && h4.textContent.trim() === selectedActivity;
        });

        if (card) {
          const participantsContainer = card.querySelector('.participants');
          if (participantsContainer) {
            const ul = participantsContainer.querySelector('.participants-list');
            if (ul) {
              const li = document.createElement('li');
              li.className = 'participant-item';
              li.innerHTML = `<span class="participant-email">${email}</span><button class="participant-remove" data-activity="${selectedActivity}" data-email="${email}" title="Remove participant">✖</button>`;
              ul.appendChild(li);
              // attach handler to the new remove button
              const btn = li.querySelector('.participant-remove');
              btn.addEventListener('click', async () => {
                try {
                  const res = await fetch(
                    `/activities/${encodeURIComponent(selectedActivity)}/signup?email=${encodeURIComponent(email)}`,
                    { method: 'DELETE' }
                  );
                  const payload = await res.json();
                  if (res.ok) {
                    messageDiv.textContent = payload.message || 'Participant removed';
                    messageDiv.className = 'message success';
                    messageDiv.classList.remove('hidden');
                    setTimeout(() => messageDiv.classList.add('hidden'), 3000);
                    fetchActivities();
                  } else {
                    messageDiv.textContent = payload.detail || 'Failed to remove participant';
                    messageDiv.className = 'message error';
                    messageDiv.classList.remove('hidden');
                    setTimeout(() => messageDiv.classList.add('hidden'), 4000);
                  }
                } catch (err) {
                  console.error('Error removing participant:', err);
                }
              });
            }
          } else {
            // No participants list exists yet; recreate the participants block
            const participantsHTML = `\
              <div class="participants">\
                <strong>Participants</strong>\
                <ul class="participants-list">\
                  <li class="participant-item"><span class="participant-email">${email}</span><button class="participant-remove" data-activity="${selectedActivity}" data-email="${email}" title="Remove participant">✖</button></li>\
                </ul>\
              </div>`;
            const noPart = card.querySelector('.no-participants');
            if (noPart) {
              noPart.remove();
            }
            card.insertAdjacentHTML('beforeend', participantsHTML);
            // attach handler to the new remove button
            const btn = card.querySelector('.participant-remove');
            if (btn) {
              btn.addEventListener('click', async () => {
                try {
                  const res = await fetch(
                    `/activities/${encodeURIComponent(selectedActivity)}/signup?email=${encodeURIComponent(email)}`,
                    { method: 'DELETE' }
                  );
                  const payload = await res.json();
                  if (res.ok) {
                    messageDiv.textContent = payload.message || 'Participant removed';
                    messageDiv.className = 'message success';
                    messageDiv.classList.remove('hidden');
                    setTimeout(() => messageDiv.classList.add('hidden'), 3000);
                    fetchActivities();
                  } else {
                    messageDiv.textContent = payload.detail || 'Failed to remove participant';
                    messageDiv.className = 'message error';
                    messageDiv.classList.remove('hidden');
                    setTimeout(() => messageDiv.classList.add('hidden'), 4000);
                  }
                } catch (err) {
                  console.error('Error removing participant:', err);
                }
              });
            }
          }
        }

        // Refresh activities list so participants view syncs with server state
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
