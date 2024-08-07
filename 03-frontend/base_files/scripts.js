// Array of image URLs to be used for displaying place images
const placeImages = [
  'images/place1.jpg',
  'images/place2.jpg',
  'images/place3.jpg',
  'images/place4.jpg',
  'images/place5.jpg',
  'images/place6.jpg',
  'images/place8.jpg',
  'images/place9.jpg',
  'images/place10.jpg',
];

// Event listener that triggers when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  checkAuthentication(); // Check if user is authenticated

  const token = getCookie('token'); // Retrieve the token from cookies

  const stars = document.querySelectorAll('.star-rating .star');
  let selectedRating = 0;

  // Handle login form submission
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
          document.cookie = `token=${data.access_token}; path=/`; // Save token in cookie
          window.location.href = 'index.html'; // Redirect to home page after successful login
        } else {
          displayErrorMessage('Login failed: ' + response.statusText); // Show error if login fails
        }
      } catch (error) {
        displayErrorMessage('An error occurred: ' + error.message); // Show error if there is an issue with the login request
      }
    });
  }

  // Filter places by country
  const countryFilter = document.getElementById('country-filter');
  if (countryFilter) {
    countryFilter.addEventListener('change', (event) => {
      const selectedCountry = event.target.value;
      filterPlacesByCountry(selectedCountry); // Filter places based on the selected country
    });
  }

  // Get the place ID from the URL
  const placeId = getPlaceIdFromURL();
  if (placeId) {
    fetchPlaceDetails(token, placeId); // Fetch and display details for the selected place
  }

  // Handle star rating selection
  stars.forEach(star => {
    star.addEventListener('click', function() {
      selectedRating = this.getAttribute('data-value'); // Set selected rating
      highlightStars(selectedRating); // Highlight the selected stars
    });
  });

  // Handle review form submission
  const reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const reviewText = document.getElementById('review-text').value;
      const rating = selectedRating; // Use selectedRating from the star rating

      try {
        // Submit the review and wait for the server's response
        const response = await submitReview(token, placeId, reviewText, rating);

        // If submission is successful, reset the form
        if (response.status === 201) {
          reviewForm.reset(); // Reset form fields
          alert('Review submitted successfully!');
          window.location.reload(); // Reload the page to display the new review
        } else {
          alert('Failed to submit review'); // Show error if review submission fails
        }
      } catch (error) {
        console.error('Error submitting review:', error);
        alert('Failed to submit review'); // Show error if there is an issue with the review request
      }
    });
  }
  
  // Function to highlight stars based on the selected rating
  function highlightStars(rating) {
    stars.forEach(star => {
      star.classList.remove('selected');
      if (star.getAttribute('data-value') <= rating) {
        star.classList.add('selected'); // Add 'selected' class to highlight stars
      }
    });
  }
});

// Function to check if the user is authenticated and adjust the UI accordingly
function checkAuthentication() {
  const token = getCookie('token');
  const loginLink = document.getElementById('login-link');
  const addReviewSection = document.getElementById('add-review');
  const addReviewButton = document.getElementById('add-review-button');
  const logoutButton = document.getElementById('logout-button');

  // Show or hide login link based on token presence
  if (loginLink) {
    loginLink.style.display = token ? 'none' : 'inline-block';
  }

  // Fetch places if token exists
  if (token) {
    fetchPlaces(token);
  }

  // Show or hide review form based on token presence
  if (addReviewSection) {
    addReviewSection.style.display = token ? 'block' : 'none';
  }

  if (addReviewButton) {
    addReviewButton.style.display = token ? 'none' : 'block';
  }

  if (logoutButton) {
    logoutButton.style.display = token ? 'inline-block' : 'none'; // Show logout button if user is logged in
  }
}

// Function to retrieve the value of a specific cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

// Function to log in a user and retrieve an authentication token
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

// Function to display an error message on the page
function displayErrorMessage(message) {
  const errorMessage = document.getElementById('error-message');
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}

// Function to fetch and display a list of places
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
      populateCountryFilter(places); // Populate the country filter dropdown with available countries
    } else {
      console.error('Failed to fetch places');
    }
  } catch (error) {
    console.error('Error fetching places:', error);
  }
}

// Function to display the list of places on the page
function displayPlaces(places, limit = 15) {
  const placesList = document.getElementById('places-list');

  if (placesList) {
    placesList.innerHTML = '';

    // Limit the number of places to display
    const limitedPlaces = places.slice(0, limit);

    // Iterate through each place and create a place card element
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

      // Add an event listener to the details button to view the selected place's details
      placeCard.querySelector('.details-button').addEventListener('click', () => viewDetails(place.id));
     
      placesList.appendChild(placeCard); // Add the place card to the list of places
    });
  }
}

// Function to navigate to the place details page
function viewDetails(placeId) {
  window.location.href = `place.html?id=${placeId}`;
}

// Function to populate the country filter dropdown with available countries
function populateCountryFilter(places) {
  const countryFilter = document.getElementById('country-filter');
  if (countryFilter) {
    const countries = [...new Set(places.map(place => place.country_name))];

    // Iterate through each country and create an option element for the dropdown
    countries.forEach(country => {
      const option = document.createElement('option');
      option.value = country;
      option.textContent = country;
      countryFilter.appendChild(option); // Add the option to the country filter dropdown
    });
  }
}

// Function to filter places based on the selected country
function filterPlacesByCountry(country) {
  const placeCards = document.querySelectorAll('.place-card');

  // Iterate through each place card and display or hide it based on the selected country
  placeCards.forEach(card => {
    const location = card.querySelector('.place-info p:nth-child(3)').textContent;
    if (location.includes(country) || country === 'All') {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// Function to get the place ID from the URL parameters
function getPlaceIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// Function to fetch and display details for a specific place
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
      displayPlaceDetails(place); // Display the details of the selected place
    } else {
      console.error('Failed to fetch place details');
    }
  } catch (error) {
    console.error('Error fetching place details:', error);
  }
}

// Function to display the details of a specific place on the page
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
              <p>Rating: ${convertRatingToStars(review.rating) || 'No rating'}</p>
            </div>
          `).join('') : '<p>No reviews yet.</p>'}
      </div>
    `;
  }
}

// Function to submit a review for a specific place
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
  return response;
}

// Function to handle the response after submitting a review
function handleReviewResponse(response) {
  // Check if the status code is 200, 201, or 204
  if (response.status === 200 || response.status === 201 || response.status === 204) {
    alert('Review submitted successfully!');
    document.getElementById('review-form').reset(); // Reset the review form
  } else {
    alert('Failed to submit review');
  }
}

// Function to convert a numeric rating to star symbols for display
function convertRatingToStars(rating) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += i <= rating ? '★' : '☆'; // Display filled star for each rating point, empty star otherwise
  }
  return stars;
}

// Function to log out the user by clearing the authentication token
function logoutUser() {
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"; // Clear the token cookie
  window.location.href = 'login.html'; // Redirect to login page
}
