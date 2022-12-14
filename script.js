"use strict";

class Workout {
  id = (Date.now() + "").slice(-10);
  date = new Date();

  constructor(coords, distance, duration) {
    this.coords = coords; // [latitude, longitude]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const type = this.type[0].toUpperCase() + this.type.slice(1);
    const month = months[this.date.getMonth()];

    this.description = `${type} on ${month} ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = "running";

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";

  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = (60 * this.distance) / this.duration;
    return this.speed;
  }
}

// Application Architecture

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    this.#getPosition();

    form.addEventListener("submit", this.#newWorkout.bind(this));
    inputType.addEventListener("change", this.#toggleElevationField);
  }

  #getPosition() {
    navigator.geolocation.getCurrentPosition(this.#loadMap.bind(this), () =>
      alert("Could not get your position")
    );
  }

  #loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on("click", this.#showForm.bind(this));
  }

  #showForm(e) {
    this.#mapEvent = e;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  #hideForm() {
    inputDistance.value = "";
    inputDuration.value = "";
    inputCadence.value = "";
    inputElevation.value = "";

    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  #toggleElevationField() {
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  }

  #newWorkout(e) {
    e.preventDefault();

    const validInputs = (...inputs) =>
      inputs.every((input) => Number.isFinite(input));
    const allPositive = (...inputs) => inputs.every((input) => input > 0);
    let workout;

    // Get data
    const { lat, lng } = this.#mapEvent.latlng;
    const coords = [lat, lng];

    const type = inputType.value;
    const distance = Number(inputDistance.value);
    const duration = Number(inputDuration.value);

    // If workout type = running, create Running object
    if (type === "running") {
      const cadence = Number(inputCadence.value);

      // Check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert("Inputs have to be positive numbers!");

      workout = new Running(coords, distance, duration, cadence);
    }

    // If workout type = cycling, create Cycling object
    if (type === "cycling") {
      const elevation = Number(inputElevation.value);

      // Check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert("Inputs have to be positive numbers!");

      workout = new Cycling(coords, distance, duration, elevation);
    }

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this.#renderWorkoutMarker(workout);

    // Render workout on list
    this.#renderWorkout(workout);

    // Hide form + clear input fields
    this.#hideForm();
  }

  #renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        }).setContent(
          `${workout.type === "running" ? "????" : "????"} ${workout.description}`
        )
      )
      .openPopup();
  }

  #renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === "running" ? "????" : "????"
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">???</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === "running") {
      html += `
          <div class="workout__details">
            <span class="workout__icon">???</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">????</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;
    } else {
      html += `
          <div class="workout__details">
            <span class="workout__icon">???</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">???</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;
    }

    form.insertAdjacentHTML("afterend", html);
  }
}

const app = new App();
