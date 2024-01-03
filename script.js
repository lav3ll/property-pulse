const apID = "35a50561";
const apiKey = "5464348b76ae95a0b90aa68d7acc6aae";
let isLoggedIn = false;

// Event listner for submit button
$(document).ready(() => {
  // Call the function to populate saved job information when the page loads
  populateSavedJobs();
  $("#search-submit").click((e) => {
    e.preventDefault();
    const selectedCity = $("#city").val();
    const searchQueryEl = $("#search-query").val();
    const selectedLevel = $("#experienceDropdown").val();
    getJobs(selectedCity, searchQueryEl, selectedLevel);
  });
});

function getJobs(city, searchQuery) {
  // Updated parameter name here as well

  const queryURL = `http://api.adzuna.com:80/v1/api/jobs/gb/search/1?app_id=${apID}&app_key=${apiKey}&results_per_page=10&what=${searchQuery}&where=${city}&content-type=application/json`;
  fetch(queryURL)
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      const latitude = data.results[0].latitude;
      const longitude = data.results[0].longitude;
      showMap(latitude, longitude);
      showJobs(data.results);
      saveRecentSearch(searchQuery, data.results.slice(0, 3)); // Save only the first three results
      showRecentJobs();
      console.log(data.results, "test");
    })
    .catch(console.error);
}

// Function that displays job information for given companies
function showJobs(companies) {
  // Selecting the container element where company information will be displayed
  const companyContainerEl = $("#company-container");

  // Clearing the content of the main element where the job information will be shown
  $("#main").empty();

  // Looping through each company in the provided array
  companies.forEach((company) => {
    // Logging the current company object to the console
    console.log(company);

    // Creating a new div element to hold company information
    const companyEl = $("<div>");

    // Adding the 'card' and 'col-6' classes to style the company element
    companyEl.addClass("card col-3 mb-4");

    // Creating elements to display company name, job position, and publication date
    const companyName = $("<h5>").text(`${company.company.display_name}`);
    companyName.addClass("mx-auto mt-2");
    const position = $("<p>").text(`Position: ${company.title}`);
    const publishDate = $("<p>").text(
      `Published: ${extractDate(company.created)}`
    );
    const salaryMinFormatted = company.salary_min.toLocaleString("en-GB", {
      style: "currency",
      currency: "GBP",
    });
    const salaryMaxFormatted = company.salary_max.toLocaleString("en-GB", {
      style: "currency",
      currency: "GBP",
    });

    const salary = $("<p>").text(
      company.salary_min === company.salary_max
        ? `Salary: ${salaryMinFormatted.slice(0, -3)}`
        : `Salary: ${salaryMinFormatted.slice(
            0,
            -3
          )} - ${salaryMaxFormatted.slice(0, -3)}`
    );

    const description = $("<p>").text(company.description);

    const cardFooter = $("<div>");
    cardFooter.addClass("mx-auto");
    // Creating a link element to the company's landing page
    const link = $("<a>")
      .text(`Full Job Advert`)
      .attr("href", company.redirect_url);
    link.addClass("col-3");

    const mapBtn = $("<button>").text("Commute").attr({
      type: "button",
      class: "commute-btn btn btn-primary ms-5",
      id: "commute-btn",
      "data-bs-toggle": "modal",
      "data-bs-target": "#commute-modal",
    });
    mapBtn.on("click", () => {
      showMap(company.latitude, company.longitude);
    });
    const saveBtn = $("<button>").text("Save").attr({
      type: "button",
      class: "save-btn btn btn-primary ms-1",
      id: "save-btn",
      "data-bs-toggle": "modal",
      "data-bs-target": "#save-modal",
    });

    const openSaveModal = $("<div>").html(`
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-body text-center">
                ${
                  isLoggedIn
                    ? "<p>Jobs saved</p>"
                    : "<p>Log in to saved jobs</p>"
                }
            </div>
        </div>
    </div>`);

    openSaveModal.attr({
      class: "modal fade",
      id: "save-modal",
      "data-bs-backdrop": "static",
      "data-bs-keyboard": "false",
      tabindex: "-1",
      "aria-labelledby": "save-modalLabel",
      "aria-hidden": "true",
    });

    $(".bottom").append(openSaveModal);

    saveBtn.addClass("save-btn btn btn-primary");
    cardFooter.append(link, mapBtn, saveBtn);

    // Appending company information elements to the company element
    companyEl.append(
      companyName,
      position,
      publishDate,
      salary,
      description,
      cardFooter
    );

    // Appending the company element to the container element
    companyContainerEl.append(companyEl);
  });
}

// Function to extract date from timestamp
function extractDate(timestamp) {
  const dateObj = new Date(timestamp);
  const formattedDate = dateObj.toISOString().split("T")[0]; // Extracting date part
  return formattedDate;
}

/////////////////////////////////// SAVE TO LOCAL STORAGE //////////////////////////
// Function to save job information to local storage
function saveToLocalStorage(job) {
  // Retrieve existing saved jobs or initialize an empty array
  let savedJobs = JSON.parse(localStorage.getItem("savedJobs"));
  if (!Array.isArray(savedJobs)) {
    savedJobs = [];
  }

  // Add the new job to the existing saved jobs
  savedJobs.push(job);

  // Save the updated list back to local storage
  localStorage.setItem("savedJobs", JSON.stringify(savedJobs));
}

// Delegate the save btn click function through parent element

jobsSavedTimer = function () {
  setTimeout(function () {
    // Close the save modal after 3 seconds
    $("#save-modal").modal("hide");
  }, 800);
};

$("#company-container").on("click", ".save-btn", (e) => {
  jobsSavedTimer();

  // Find the closest parent element with class "card"
  const closestCard = $(e.currentTarget).closest(".card");

  // Remove the save button from the original element
  closestCard.find(".save-btn").remove();

  // Get the HTML content of the modified element
  const jobToSave = closestCard.html();

  saveToLocalStorage(jobToSave);
  populateSavedJobs();
});

// Function to populate saved job information into element with class "saved-info"
function populateSavedJobs() {
  const savedInfoElement = $(".saved-info");
  const savedJobs = JSON.parse(localStorage.getItem("savedJobs"));
  if (Array.isArray(savedJobs)) {
    savedInfoElement.empty();
    savedJobs.forEach((job, index) => {
      const jobDiv = $("<div>").html(job);
      const commuteBtn = jobDiv.find(".commute-btn");

      // Create a delete button for each job
      const deleteButton = $("<button>")
        .text("Delete")
        .addClass("delete-btn btn btn-danger ms-3")
        .attr("data-index", index); // Add an index attribute to identify the job to delete

      // Insert the delete button next to the commute button
      commuteBtn.after(deleteButton);

      savedInfoElement.append(jobDiv);
      // Add event listener to the commute button in saved jobs
      commuteBtn.on("click", () => {
        const job = savedJobs[index];
        const company = $(job);
        const latitude = Number($(".latitude", company).text());
        const longitude = Number($(".longitude", company).text());
        console.log(longitude, latitude);
        showMap(latitude, longitude);
      });
    });
  } else {
    savedInfoElement.text("No saved jobs found");
  }
}

// Delegate the delete-btn click function through parent element
$(".saved-info").on("click", ".delete-btn", (e) => {
  const indexToDelete = $(e.currentTarget).data("index");

  let savedJobs = JSON.parse(localStorage.getItem("savedJobs"));

  if (Array.isArray(savedJobs)) {
    savedJobs.splice(indexToDelete, 1); // Remove the job at the specified index

    localStorage.setItem("savedJobs", JSON.stringify(savedJobs));
    populateSavedJobs(); // Reload the UI after deleting the job
  }
});

//////////////////////////////////// RECENT SEARCH ////////////////////

let recentSearches = [];

function saveRecentSearch(searchQuery, results) {
  recentSearches.unshift({ searchQuery, results }); // Add recent search to the beginning of the array
  if (recentSearches.length > 4) {
    recentSearches.pop(); // Keep only the last four searches
  }
}

function showRecentJobs() {
  const recentInfoEl = $(".recent-info");
  recentInfoEl.empty(); // Clear recent info before populating new data

  recentSearches.forEach((search) => {
    const searchDiv = $("<div>").addClass("search-info");
    const searchHeader = $("<h6>").text(`Recent Search: ${search.searchQuery}`);
    const searchResults = $("<div>").addClass("search-results");

    search.results.forEach((result) => {
      const resultEl = $("<div>").addClass("card");
      const companyName = $("<h5>").text(result.company.display_name);
      const position = $("<p>").text(result.title);
      const publishDate = $("<p>").text(
        `Published: ${extractDate(result.created)}`
      );
      const cardFooter = $("<div>");
      const link = $("<a>")
        .text(`${result.company.display_name} website`)
        .attr("href", result.redirect_url)
        .addClass("col-3");
      const mapBtn = $("<button>").text("Commute").attr({
        type: "button",
        class: "commute-btn btn btn-primary ms-5",
        id: "commute-btn",
        "data-bs-toggle": "modal",
        "data-bs-target": "#commute-modal",
      });
      const saveBtn = $("<button>").text("Save").attr({
        type: "button",
        class: "save-btn btn btn-primary ms-1",
        id: "save-btn",
        "data-bs-toggle": "modal",
        "data-bs-target": "#save-modal",
      });

      saveBtn.addClass("save-btn btn btn-primary");
      saveBtn.on("click", jobsSavedTimer);
      cardFooter.append(link, mapBtn, saveBtn);

      resultEl.append(companyName, position, publishDate, cardFooter);
      searchResults.append(resultEl);
    });

    searchDiv.append(searchHeader, searchResults);
    recentInfoEl.append(searchDiv);
  });
}
/////////////////////////////////// SIGN IN //////////////////////////
// Function to handle the sign-in process
function signIn() {
  // Retrieving the entered email and password values from the input fields
  const emailEl = $("#signin-email").val();
  const password = $("#signin-password").val();

  // Checking if provided email and password match any set of credentials
  const found = credentials.some(
    (cred) => cred.email === emailEl && cred.password === password
  );

  // Checking if the credentials are found and logging the result
  if (found) {
    console.log("Login successful");
  } else {
    console.log("Account does not exist");
  }
}

// Binding the signIn function to the click event of the sign-in button
const signInEl = $("#signin");
signInEl.click(signIn);

// Array containing sets of email and password credentials
const credentials = [
  {
    email: "test1@gmail.com",
    password: "password123",
  },
  {
    email: "tes2@google.com",
    password: "securePass",
  },
];

/////////////////////////////////// REGISTER //////////////////////////

function signUp() {
  // Function to handle the register process
  function signup() {
    // Retrieving the entered email and password values from the input fields
    const emailEl = $("#register-email").val();
    const password1 = $("#password1").val();
    const password2 = $("#password2").val();

    // Checking if the passwords match
    const passwordsMatch = password1 === password2;

    // Checking if the provided email is unique (not already in credentials)
    const emailExists = credentials.some((cred) => cred.email === emailEl);

    // Checking if the email is unique and passwords match
    if (!emailExists && passwordsMatch) {
      console.log("You have now signed up to CareerWay Commut");
      console.log(credentials);
      // Add the new user to the credentials array
      credentials.push({ email: emailEl, password: password1 });
    } else if (!passwordsMatch) {
      console.log("passwords do not match!");
    } else {
      console.log("Please enter a valid email address and matching passwords");
    }
  }

  // Binding the signup function to the click event of the sign-up button
  const signUpEl = $("#signup");
  signUpEl.click(signup);
}

// Call signUp function
signUp();

/////////////////////////////////// Commute Button //////////////////////////
// Delegate the commute btn click function through parent element
$("#company-container").on("click", ".commute-btn", () => {
  console.log("Commute button clicked");
});

//////////////////////////////////Google Maps Api //////////////////////////
let map;
let directionsService;
let directionsRenderer;

async function initMap(latVal, lngVal) {
  console.log(latVal, lngVal);
  const position = { lat: latVal, lng: lngVal };
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  map = new Map(document.getElementById("map"), {
    zoom: 4,
    center: position,
    mapId: "DEMO_MAP_ID",
  });

  const marker = new AdvancedMarkerElement({
    map: map,
    position: position,
    title: "Location from API",
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  directionsRenderer.setMap(map);

  getLocationAndAddUserMarker(latVal, lngVal);
}

function getLocationAndAddUserMarker(latVal, lngVal) {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const userPosition = { lat, lng };

        const userMarker = new google.maps.Marker({
          position: userPosition,
          map: map,
          title: "Your Location",
        });

        // Calculate and display the route between user's location and initial location
        calculateAndDisplayRoute(lat, lng, latVal, lngVal);
      },
      (error) => {
        console.error("Error getting user's location:", error);
      }
    );
  } else {
    console.log("Geolocation is not supported by this browser.");
  }
}

function calculateAndDisplayRoute(startLat, startLng, destLat, destLng) {
  const start = new google.maps.LatLng(startLat, startLng);
  const destination = new google.maps.LatLng(destLat, destLng);

  // Request for walking mode
  const walkingRequest = {
    origin: start,
    destination: destination,
    travelMode: google.maps.TravelMode.WALKING,
  };

  // Request for driving mode
  const drivingRequest = {
    origin: start,
    destination: destination,
    travelMode: google.maps.TravelMode.DRIVING,
  };

  // Directions service for walking mode
  directionsService.route(
    walkingRequest,
    function (walkingResult, walkingStatus) {
      if (walkingStatus === google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(walkingResult);
        const walkingRoute = walkingResult.routes[0];
        const { duration, distance } = walkingRoute.legs[0];
        console.log("Route duration (walking):", duration.text);
        console.log("Route distance (walking):", distance.text);
      } else {
        console.error(
          "Walking directions request failed due to " + walkingStatus
        );
      }
    }
  );

  // Directions service for driving mode
  directionsService.route(
    drivingRequest,
    function (drivingResult, drivingStatus) {
      if (drivingStatus === google.maps.DirectionsStatus.OK) {
        const drivingRoute = drivingResult.routes[0];
        const { duration, distance } = drivingRoute.legs[0];
        console.log("Route duration (driving):", duration.text);
        console.log("Route distance (driving):", distance.text);
      } else {
        console.error(
          "Driving directions request failed due to " + drivingStatus
        );
      }
    }
  );
}
/////////////////// Show Map///////////////////////////////
function showMap(lat, lng) {
  $("#map").show();
  initMap(lat, lng);
}

////////////////////// Get Users Geo Location///////////////////
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else {
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}

function showPosition(position) {
  return position.coords.latitude + position.coords.longitude;
}

getLocation();
