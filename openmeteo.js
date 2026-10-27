/* Wetter — Datenzugriff. Open-Meteo: https://open-meteo.com/en/docs
   Ortsdaten: Open-Meteo Geocoding / GeoNames. Kein API-Schlüssel erforderlich.
   Die kostenlose öffentliche API ist für nichtkommerzielle Nutzung vorgesehen. */
(() => {
  'use strict';

  const STORAGE_KEY = 'wetterApp';
  const NUMBERS = new Map();
  const TIME_FORMATTERS = new Map();
  const CURRENT = 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m';
  const HOURLY = 'temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,visibility,wind_speed_10m,is_day,uv_index';
  const DAILY = 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max';

  function cleanText(value, max = 100) {
    return typeof value === 'string'
      ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max)
      : '';
  }

  function normalizePlace(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    const latitude = input.latitude;
    const longitude = input.longitude;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
    const name = cleanText(input.name);
    if (!name) return null;
    const source = input.source === 'gps' ? 'gps' : 'search';
    const providedId = typeof input.id === 'number' && Number.isFinite(input.id)
      ? String(input.id) : cleanText(input.id, 100);
    const id = source === 'gps' ? 'gps' : /^[a-zA-Z0-9_.:-]{1,100}$/.test(providedId)
      ? providedId : `loc-${latitude.toFixed(5)}-${longitude.toFixed(5)}`;
    let timezone = cleanText(input.timezone, 80);
    if (timezone) {
      try { new Intl.DateTimeFormat('de-DE', { timeZone: timezone }); }
      catch { timezone = ''; }
    }
    const countryCode = cleanText(input.countryCode || input.country_code, 2).toUpperCase();
    return {
      id,
      name,
      admin1: cleanText(input.admin1),
      country: cleanText(input.country),
      countryCode: /^[A-Z]{2}$/.test(countryCode) ? countryCode : '',
      latitude: Number(latitude.toFixed(5)),
      longitude: Number(longitude.toFixed(5)),
      timezone,
      source
    };
  }

  function loadPlaces() {
    let raw;
    try { raw = window.localStorage.getItem(STORAGE_KEY); }
    catch {
      return { places: [], warning: 'Der Browser blockiert den lokalen Speicher. Deine Orte bleiben nur bis zum Schließen geöffnet.' };
    }
    if (raw === null) return { places: [], warning: '' };
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch {
      return { places: [], warning: 'Gespeicherte Orte konnten nicht gelesen werden. Bitte füge deine Orte erneut hinzu.' };
    }
    if (!Array.isArray(parsed)) {
      return { places: [], warning: 'Die gespeicherte Ortsliste hat ein unbekanntes Format. Bitte füge deine Orte erneut hinzu.' };
    }
    const ids = new Set();
    const places = [];
    let invalid = 0;
    for (const input of parsed) {
      const place = normalizePlace(input);
      if (!place) { invalid++; continue; }
      if (ids.has(place.id)) continue;
      ids.add(place.id);
      places.push(place);
    }
    return { places, warning: invalid ? 'Einige beschädigte Ortseinträge konnten nicht geladen werden.' : '' };
  }

  function savePlaces(places) {
    if (!Array.isArray(places)) return { ok: false, warning: 'Die Ortsliste konnte nicht gespeichert werden.' };
    const normalized = places.map(normalizePlace);
    if (normalized.some(place => !place)) {
      return { ok: false, warning: 'Ein Ort enthält ungültige Daten und konnte nicht gespeichert werden.' };
    }
    const unique = normalized.filter((place, index) => normalized.findIndex(other => other.id === place.id) === index);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
      return { ok: true, warning: '' };
    } catch {
      return { ok: false, warning: 'Deine Orte konnten nicht dauerhaft gespeichert werden. Prüfe die Speichereinstellungen deines Browsers.' };
    }
  }

  async function requestJSON(url, { signal, timeout = 15000 } = {}) {
    const controller = new AbortController();
    let timedOut = false;
    const abortFromCaller = () => controller.abort();
    if (signal?.aborted) throw new DOMException('Abgebrochen', 'AbortError');
    signal?.addEventListener('abort', abortFromCaller, { once: true });
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeout);
    try {
      const response = await fetch(url, { signal: controller.signal, credentials: 'omit', cache: 'no-store' });
      if (!response.ok) {
        if (response.status === 429) throw new Error('Zu viele Anfragen. Bitte warte einen Moment und versuche es erneut.');
        if (response.status >= 500) throw new Error('Der Wetterdienst ist gerade nicht erreichbar. Bitte versuche es später erneut.');
        throw new Error(`Die Daten konnten nicht geladen werden (HTTP ${response.status}).`);
      }
      const result = await response.json();
      if (!result || typeof result !== 'object' || result.error) throw new Error('Der Wetterdienst hat keine gültigen Daten geliefert.');
      return result;
    } catch (error) {
      if (signal?.aborted) throw new DOMException('Abgebrochen', 'AbortError');
      if (timedOut) throw new Error('Die Anfrage dauert zu lange. Prüfe deine Verbindung und versuche es erneut.');
      if (error instanceof TypeError) throw new Error('Keine Verbindung zum Wetterdienst. Prüfe deine Internetverbindung.');
      if (error instanceof SyntaxError) throw new Error('Die Antwort des Wetterdienstes konnte nicht gelesen werden.');
      throw error;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abortFromCaller);
    }
  }

  async function searchPlaces(query, { signal } = {}) {
    const name = cleanText(query, 160);
    if (name.length < 2) return [];
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.search = new URLSearchParams({ name, count: '7', language: 'de', format: 'json' }).toString();
    const data = await requestJSON(url, { signal, timeout: 12000 });
    if (!data.results) return [];
    if (!Array.isArray(data.results)) throw new Error('Die Ortssuche hat keine gültige Antwort geliefert.');
    return data.results.map(normalizePlace).filter(Boolean);
  }

  function validISOTime(value, dateOnly = false) {
    return typeof value === 'string' && (dateOnly ? /^\d{4}-\d{2}-\d{2}$/ : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/).test(value);
  }

  async function fetchWeather(input, { signal } = {}) {
    const place = normalizePlace(input);
    if (!place) throw new Error('Die Koordinaten dieses Ortes sind ungültig.');
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({
      latitude: String(place.latitude),
      longitude: String(place.longitude),
      current: CURRENT,
      hourly: HOURLY,
      daily: DAILY,
      temperature_unit: 'celsius',
      wind_speed_unit: 'kmh',
      precipitation_unit: 'mm',
      timezone: 'auto',
      timeformat: 'iso8601',
      forecast_days: '10'
    }).toString();
    const data = await requestJSON(url, { signal });
    if (!data.current || !validISOTime(data.current.time) || !data.hourly || !data.daily ||
        !Array.isArray(data.hourly.time) || !data.hourly.time.length ||
        !data.hourly.time.every(value => validISOTime(value)) ||
        !Array.isArray(data.daily.time) || !data.daily.time.length ||
        !data.daily.time.every(value => validISOTime(value, true))) {
      throw new Error('Die Wetterdaten sind unvollständig. Bitte versuche es erneut.');
    }
    // Nicht verfügbare Modellwerte bleiben null: niemals fehlende Werte als 0 ausgeben.
    for (const key of CURRENT.split(',')) {
      if (!Number.isFinite(data.current[key])) data.current[key] = null;
    }
    for (const [section, variables] of [[data.hourly, HOURLY], [data.daily, DAILY]]) {
      for (const key of variables.split(',')) {
        const values = Array.isArray(section[key]) ? section[key] : [];
        section[key] = section.time.map((_, i) => {
          if (key === 'sunrise' || key === 'sunset') return validISOTime(values[i]) ? values[i] : null;
          return Number.isFinite(values[i]) ? values[i] : null;
        });
      }
    }
    data.fetchedAt = Date.now();
    return data;
  }

  function weatherInfo(code, isDay = true) {
    if (code === 0) return { label: isDay ? 'Sonnig' : 'Klar', kind: 'clear', icon: isDay ? 'sun' : 'moon' };
    if (code === 1) return { label: isDay ? 'Überwiegend sonnig' : 'Überwiegend klar', kind: 'clear', icon: isDay ? 'partly' : 'partly-night' };
    if (code === 2) return { label: 'Teilweise bewölkt', kind: 'cloudy', icon: isDay ? 'partly' : 'partly-night' };
    if (code === 3) return { label: 'Bedeckt', kind: 'cloudy', icon: 'cloud' };
    if (code === 45 || code === 48) return { label: code === 48 ? 'Nebel mit Reif' : 'Neblig', kind: 'fog', icon: 'fog' };
    if ([51, 53, 55].includes(code)) return { label: code === 51 ? 'Leichter Nieselregen' : code === 55 ? 'Starker Nieselregen' : 'Nieselregen', kind: 'rain', icon: 'rain' };
    if (code === 56 || code === 57) return { label: 'Gefrierender Nieselregen', kind: 'rain', icon: 'rain' };
    if ([61, 63, 65].includes(code)) return { label: code === 61 ? 'Leichter Regen' : code === 65 ? 'Starker Regen' : 'Regen', kind: 'rain', icon: 'rain' };
    if (code === 66 || code === 67) return { label: 'Gefrierender Regen', kind: 'rain', icon: 'rain' };
    if ([71, 73, 75, 77].includes(code)) return { label: code === 71 ? 'Leichter Schneefall' : code === 75 ? 'Starker Schneefall' : code === 77 ? 'Schneegriesel' : 'Schneefall', kind: 'snow', icon: 'snow' };
    if ([80, 81, 82].includes(code)) return { label: code === 80 ? 'Leichte Regenschauer' : code === 82 ? 'Kräftige Regenschauer' : 'Regenschauer', kind: 'rain', icon: 'rain' };
    if (code === 85 || code === 86) return { label: 'Schneeschauer', kind: 'snow', icon: 'snow' };
    if ([95, 96, 99].includes(code)) return { label: code === 95 ? 'Gewitter' : 'Gewitter mit Hagel', kind: 'storm', icon: 'storm' };
    return { label: 'Wetter nicht verfügbar', kind: 'cloudy', icon: 'cloud' };
  }

  function localParts(timezone, now = new Date()) {
    const instant = now instanceof Date ? now : new Date(now);
    const validInstant = Number.isNaN(instant.getTime()) ? new Date() : instant;
    let zone = cleanText(timezone, 80);
    try {
      if (!TIME_FORMATTERS.has(zone)) {
        TIME_FORMATTERS.set(zone, new Intl.DateTimeFormat('en-CA', {
          ...(zone ? { timeZone: zone } : {}),
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
        }));
      }
    } catch {
      zone = 'UTC';
      if (!TIME_FORMATTERS.has(zone)) TIME_FORMATTERS.set(zone, new Intl.DateTimeFormat('en-CA', {
        timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }));
    }
    const parts = Object.fromEntries(TIME_FORMATTERS.get(zone).formatToParts(validInstant).map(p => [p.type, p.value]));
    const hour = Number(parts.hour) % 24;
    const minute = Number(parts.minute);
    return {
      date: `${parts.year}-${parts.month}-${parts.day}`,
      hour,
      minute,
      clock: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    };
  }

  function formatClock(iso) {
    if (typeof iso !== 'string') return '–';
    const match = iso.match(/T(\d{2}:\d{2})/);
    return match ? match[1] : '–';
  }

  function isDaylight(data, now = new Date()) {
    const supplied = now instanceof Date ? now : new Date(now);
    const instant = Number.isFinite(supplied.getTime()) ? supplied : new Date();
    const local = localParts(data?.timezone, instant);
    const hourKey = `${local.date}T${String(local.hour).padStart(2, '0')}`;
    const nowISO = `${local.date}T${local.clock}:${String(instant.getUTCSeconds()).padStart(2, '0')}`;

    // Compare local ISO values, never interpret them in the device's time zone.
    // Seconds are optional in API responses; normalizing keeps boundaries exact.
    const normalizeTime = value => {
      if (typeof value !== 'string') return null;
      const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
      if (!match || Number(match[2]) > 23 || Number(match[3]) > 59 || Number(match[4] || 0) > 59) return null;
      const date = new Date(`${match[1]}T00:00:00Z`);
      if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== match[1]) return null;
      return `${match[1]}T${match[2]}:${match[3]}:${match[4] || '00'}`;
    };
    const daily = data?.daily;
    const todayIndex = Array.isArray(daily?.time) ? daily.time.indexOf(local.date) : -1;
    if (todayIndex >= 0) {
      const sunrise = normalizeTime(daily.sunrise?.[todayIndex]);
      const sunset = normalizeTime(daily.sunset?.[todayIndex]);
      if (sunrise && sunset && sunrise < sunset &&
          (sunrise.slice(0, 10) === local.date || sunset.slice(0, 10) === local.date)) {
        if (nowISO >= sunrise && nowISO < sunset) return true;
        // Some places have a daylight interval spanning local midnight.
        // The preceding day's interval can still cover the early morning.
        if (todayIndex > 0) {
          const previousRise = normalizeTime(daily.sunrise?.[todayIndex - 1]);
          const previousSet = normalizeTime(daily.sunset?.[todayIndex - 1]);
          if (previousRise && previousSet && previousRise < previousSet &&
              previousSet.slice(0, 10) === local.date &&
              nowISO >= previousRise && nowISO < previousSet) return true;
        }
        return false;
      }
    }

    // Polar days/nights may have no usable sunrise/sunset. Prefer the forecast
    // for this exact local hour over current.is_day from an older response.
    const hourly = data?.hourly;
    const hourlyIndex = Array.isArray(hourly?.time)
      ? hourly.time.findIndex(value => normalizeTime(value)?.slice(0, 13) === hourKey)
      : -1;
    const hourlyFlag = hourlyIndex >= 0 ? hourly.is_day?.[hourlyIndex] : null;
    if (hourlyFlag === 0 || hourlyFlag === 1) return hourlyFlag === 1;

    // An old cached flag must not carry yesterday's daytime into tonight.
    // Without solar or hourly values, only trust a current flag for this hour.
    const currentTime = normalizeTime(data?.current?.time);
    const currentFlag = data?.current?.is_day;
    if (currentTime?.slice(0, 13) === hourKey && currentTime <= nowISO &&
        (currentFlag === 0 || currentFlag === 1)) return currentFlag === 1;
    return false;
  }

  function nextHourly(data, count = 24) {
    if (!Array.isArray(data?.hourly?.time)) return [];
    const parts = localParts(data.timezone);
    const currentHour = `${parts.date}T${String(parts.hour).padStart(2, '0')}:00`;
    const start = data.hourly.time.findIndex(time => typeof time === 'string' && time >= currentHour);
    if (start < 0) return [];
    const limit = Math.min(Math.max(0, Math.floor(Number(count) || 0)), data.hourly.time.length - start);
    return Array.from({ length: limit }, (_, index) => start + index);
  }

  function formatNumber(value, digits = 0) {
    if (!Number.isFinite(value)) return '–';
    const precision = Math.min(3, Math.max(0, Math.floor(Number(digits) || 0)));
    if (!NUMBERS.has(precision)) NUMBERS.set(precision, new Intl.NumberFormat('de-DE', {
      minimumFractionDigits: precision, maximumFractionDigits: precision
    }));
    // Verhindert eine gerundete Anzeige von „−0°“.
    const rounded = Number(value.toFixed(precision));
    return NUMBERS.get(precision).format(Object.is(rounded, -0) ? 0 : rounded);
  }

  function gpsPlace(position) {
    const latitude = position?.coords?.latitude;
    const longitude = position?.coords?.longitude;
    return normalizePlace({ id: 'gps', name: 'Mein Standort', latitude, longitude, source: 'gps' });
  }

  window.WeatherCore = Object.freeze({
    loadPlaces, savePlaces, normalizePlace, fetchWeather, searchPlaces,
    weatherInfo, localParts, formatClock, nextHourly, formatNumber, gpsPlace, isDaylight
  });
})();
