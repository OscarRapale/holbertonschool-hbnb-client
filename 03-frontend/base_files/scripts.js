/* 
  This is a SAMPLE FILE to get you started.
  Please, follow the project instructions to complete the tasks.
*/

const placeImages = [
  'images/place1.jpg',
  'images/place2.jpg',
  'images/place3.jpg',
  'images/place4.jpg',
  'images/place5.jpg',
  'images/place6.jpg',
]

document.addEventListener('DOMContentLoaded', () => {
  checkAuthentication();

  const token = getCookie('token');
  
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const response = await loginUser(email, password);
        if (response.ok) {
          const data = await response.json();
          document.cookie = `token=${data.access_token}; path=/`;
          window.location.href = 'index.html';
        }
        else {
          displayErrorMessage('Login failed: ' + response.statusText);
        }
      }
      catch (error) {
        displayErrorMessage('An error ocurred ' + error.message);
      }
    });
  }

  const countryFilter = document.getElementById('country-filter');
  if (countryFilter) {
    countryFilter.addEventListener('change', (event) => {
      const selectedCountry = event.target.value;
      filterPlacesByCountry(selectedCountry);
    });
  }

  const placeId = getPlaceIdFromURL();
  if (placeId) {
    fetchPlaceDetails(token, placeId);
  }

  const reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const reviewText = document.getElementById('review-text').value;
      const rating = document.getElementById('rating').value;

      try {
        const response = await submitReview(token, placeId, reviewText, rating);
        handleReviewResponse(response);
      } catch (error) {
        console.error('Error submitting review:', error);
        alert('Failed to submit review');
      }
    });
  }
});

function checkAuthentication() {
  const token = getCookie('token');
  const loginLink = document.getElementById('login-link');
  const addReviewSection = document.getElementById('add-review');
  const addReviewButton = document.getElementById('add-review-button');

  // Show or hide login link based on token
  if (loginLink) {
    loginLink.style.display = token ? 'none' : 'block';
  }

  // Fetch places if token exists
  if (token) {
    fetchPlaces(token);
  }

  // Show or hide review form based on token
  if (addReviewSection) {
    addReviewSection.style.display = token ? 'block' : 'none';
  }

  if (addReviewButton) {
    addReviewButton.style.display = token ? 'none' : 'block';
  }
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

async function loginUser(email, password) {
  const response = await fetch('http://127.0.0.1:5000/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  return response;
}

function displayErrorMessage(message) {
  const errorMessage = document.getElementById('error-message');
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}

async function fetchPlaces(token) {
  try {
    const response = await fetch('http://127.0.0.1:5000/places', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (response.ok) {
      const places = await response.json();
      displayPlaces(places);
      populateCountryFilter(places);
    }
    else {
      console.error('Failed to fetch places');
    }
  }
  catch (error) {
    console.error('Error fetching places:', error)
  }
}

function displayPlaces(places, limit = 15) {
  const placesList = document.getElementById('places-list');

  if (placesList) {
    placesList.innerHTML = '';

    const limitedPlaces = places.slice(0, limit)

    limitedPlaces.forEach((place, index) => {
      const placeCard = document.createElement('div');
      placeCard.classList.add('place-card');

      const imageIndex = index % placeImages.length;
      const imageUrl = placeImages[imageIndex];

      placeCard.innerHTML = `
      <img src="${imageUrl}" alt="${place.description || 'Unnamed Place'}" class="place-image">
      <div class="place-info">
          <h3>${place.description || 'Unnamed Place'}</h3>
          <p>Price per night: $${place.price_per_night || 'N/A'}</p>
          <p>Location: ${place.city_name || 'Unknown City'}, ${place.country_name || 'Unknown Country'}</p>
          <button class="details-button">View Details</button>
      </div>
  `;

     placeCard.querySelector('.details-button').addEventListener('click', () => viewDetails(place.id));
     
     placesList.appendChild(placeCard);
    });
  }
}

function viewDetails(placeId) {
  window.location.href = `place.html?id=${placeId}`;
}

function populateCountryFilter(places) {
  const countryFilter = document.getElementById('country-filter');
  if (countryFilter) {
      const countries = [...new Set(places.map(place => place.country_name))];

      countries.forEach(country => {
          const option = document.createElement('option');
          option.value = country;
          option.textContent = country;
          countryFilter.appendChild(option);
      });
  }
}

function filterPlacesByCountry(country) {
  const placeCards = document.querySelectorAll('.place-card');

  placeCards.forEach(card => {
    const location = card.querySelector('.place-info p:nth-child(3)').textContent;
    if (location.includes(country) || country === 'All') {
      card.style.display = 'block';
    }
    else {
      card.style.display = 'none';
    }
  });
}

function getPlaceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function fetchPlaceDetails(token, placeId) {
  try {
    const response = await fetch(`http://127.0.0.1:5000/places/${placeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.ok) {
      const place = await response.json();
      displayPlaceDetails(place);
    }
    else {
      console.error('Failed to fetch place details');
    }
  }
  catch (error) {
    console.error('Error fetching place details:', error);
  }
}

function displayPlaceDetails(place) {
  const placeDetailsSection = document.getElementById('place-details');
  if (placeDetailsSection) {
    placeDetailsSection.innerHTML = `
      <h2>${place.description || 'Unnamed Place'}</h2>
      <div class="place-info">
      <img src="images/place7.jpg" alt="${place.description || 'Unnamed Place'}" class="place-image-large">
          <p><strong>Location:</strong> ${place.city_name || 'Unknown City'}, ${place.country_name || 'Unknown Country'}</p>
          <p><strong>Price per Night:</strong> $${place.price_per_night || 'N/A'}</p>
          <p><strong>Host:</strong> ${place.host_name || 'N/A'}</p>
          <p><strong>Number of Rooms:</strong> ${place.number_of_rooms || 'N/A'}</p>
          <p><strong>Number of Bathrooms:</strong> ${place.number_of_bathrooms || 'N/A'}</p>
          <p><strong>Max Guests:</strong> ${place.max_guests || 'N/A'}</p>
          <p><strong>Amenities:</strong> ${place.amenities.join(', ') || 'N/A'}</p>
      </div>
      <div id="reviews-section">
          <h3>Reviews:</h3>
          ${place.reviews.length > 0 ? place.reviews.map(review => `
            <div class="review-card">
              <p><strong>${review.user_name || 'Anonymous'}:</strong> ${review.comment || 'No comment'}</p>
              <p>Rating: ${review.rating || 'No rating'}</p>
            </div>
          `).join('') : '<p>No reviews yet.</p>'}
      </div>
    `;
  }
}

async function submitReview(token, placeId, reviewText, rating) {
  const response = await fetch(`http://127.0.0.1:5000/places/${placeId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ 
      review: reviewText,
      rating: rating 
    })
  });
  if (response.status === 201) {
    return Promise.resolve({ status: 201 });
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

function handleReviewResponse(response) {
  // Check if the status code is 200, 201, or 204
  if (response.status === 200 || response.status === 201 || response.status === 204) {
    alert('Review submitted successfully!');
    document.getElementById('review-form').reset();
  }
  else {
    alert('Failed to submit review');
  }
}

function logoutUser() {
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  window.location.href = 'login.html'; // redirect to login page
}
