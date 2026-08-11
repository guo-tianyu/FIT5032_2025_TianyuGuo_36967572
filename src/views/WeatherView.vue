<template>
  <div class="container weather-page">
    <div class="header">
      <h1>WEATHER APP</h1>

      <div class="search-bar">
        <input
          v-model="city"
          type="text"
          placeholder="Enter city name"
          class="search-input"
          @keyup.enter="searchByCity"
        />
        <button class="search-button" type="button" @click="searchByCity">Search</button>
      </div>

      <button class="location-button" type="button" @click="getCurrentLocation">
        Use Current Location
      </button>
    </div>

    <p v-if="loading" class="status-message">Loading weather...</p>
    <p v-if="error" class="error-message">{{ error }}</p>

    <main v-if="weatherData">
      <h2>{{ weatherData.name }}, {{ weatherData.sys.country }}</h2>
      <div class="weather-details">
        <img :src="iconUrl" alt="Weather Icon" />
        <p>{{ temperature }} °C</p>
      </div>
      <span>{{ weatherData.weather[0].description }}</span>
    </main>
  </div>
</template>

<script>
import axios from 'axios'

const apikey = import.meta.env.VITE_OPENWEATHER_API_KEY

export default {
  name: 'WeatherView',
  data() {
    return {
      city: '',
      weatherData: null,
      hourlyForecast: [],
      dailyForecast: [],
      loading: false,
      error: ''
    }
  },
  computed: {
    temperature() {
      return this.weatherData ? Math.round(this.weatherData.main.temp) : null
    },
    iconUrl() {
      return this.weatherData
        ? `https://openweathermap.org/img/wn/${this.weatherData.weather[0].icon}@2x.png`
        : ''
    }
  },
  mounted() {
    this.getCurrentLocation()
  },
  methods: {
    async getWeather(params) {
      if (!apikey) {
        this.error = 'OpenWeather API key is missing. Add it to the .env file.'
        return
      }

      this.loading = true
      this.error = ''

      try {
        const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
          params: {
            ...params,
            appid: apikey,
            units: 'metric'
          }
        })

        this.weatherData = response.data
      } catch (error) {
        this.weatherData = null
        this.error = error.response?.data?.message || 'Unable to retrieve weather data.'
      } finally {
        this.loading = false
      }
    },
    searchByCity() {
      const cityName = this.city.trim()

      if (!cityName) {
        this.error = 'Please enter a city name.'
        return
      }

      this.getWeather({ q: cityName })
    },
    getCurrentLocation() {
      if (!navigator.geolocation) {
        this.error = 'Geolocation is not supported by this browser.'
        return
      }

      this.error = ''
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.getWeather({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
        },
        () => {
          this.error = 'Location permission was not granted. Search by city instead.'
        }
      )
    }
  }
}
</script>

<style scoped>
.weather-page {
  max-width: 620px;
  text-align: center;
}

.header h1 {
  margin-bottom: 1rem;
}

.search-bar {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.search-input {
  width: 260px;
  padding: 7px 10px;
  border: 1px solid #777;
  border-radius: 3px;
}

.search-button,
.location-button {
  padding: 7px 14px;
  border: 1px solid #0d6efd;
  border-radius: 4px;
  color: white;
  background: #0d6efd;
}

.location-button {
  margin-top: 10px;
  border-color: #6c757d;
  background: #6c757d;
}

main {
  margin-top: 24px;
}

.weather-details {
  display: flex;
  align-items: center;
  justify-content: center;
}

.weather-details img {
  width: 100px;
  height: 100px;
}

.weather-details p {
  margin: 0;
  font-size: 2rem;
}

main span {
  text-transform: capitalize;
}

.status-message {
  margin-top: 20px;
  color: #555;
}

.error-message {
  margin-top: 20px;
  color: #dc3545;
}
</style>

