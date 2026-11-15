import './style.css';

const canvas = document.querySelector('#sand-canvas');
const sandStage = document.querySelector('.sand-stage');
const ctx = canvas.getContext('2d', { alpha: false });
const audio = document.querySelector('#audio');
const DPR = Math.min(window.devicePixelRatio || 1, 2);
const textureCanvas = document.createElement('canvas');
const textureCtx = textureCanvas.getContext('2d');
let width = 0;
let height = 0;
let lastTime = performance.now();
let isPointerDown = false;
let lastPoint = null;
let rafId = null;
let lastRenderedAt = 0;
let stageVisible = true;
let trailErosionStartsAt = 0;
let windAmount = 12;
let trailHoldMs = 9000;
let sandContrast = 1;
let shuffleEnabled = false;
let queueView = 'all';
let visualizerEnabled = false;
const storageKeys = { favorites: 'sandfi:favorites', playlists: 'sandfi:playlists', mood: 'sandfi:mood', visualizer: 'sandfi:visualizer' };
function readStorage(key, fallback) {
  try { const value = localStorage.getItem(key); return value === null ? fallback : JSON.parse(value); } catch { return fallback; }
}
function writeStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage can be unavailable in private browsing. */ }
}
const translations = {
  en: {
    liveAmbience: 'LIVE AMBIENCE', ambienceTitle: 'AMBIENCE', moodLabel: 'Sand mood', windDrift: 'Wind drift', traceHold: 'Trace hold', sandContrast: 'Sand contrast', cardOpacity: 'Card opacity', moodEyebrow: 'CHOOSE YOUR WEATHER', moodTitleOne: 'Six skies,', moodTitleTwo: 'one quiet dune.', moodCopy: 'Tap a mood to change the light, the weather, and the feel of the sand. It takes you back to the dunes.', kPlay: 'Play / pause', kSkip: 'Previous / next', kFav: 'Favorite', kVis: 'Visualizer', kQueue: 'Queue', footerTag: 'LOFI IN THE DUNES', clearSand: 'Clear sand surface', myPlaylist: 'MY PLAYLIST', keyboardHint: 'Space play · ←/→ next · F favorite · V visualizer · Q queue', stageEyebrow: 'A QUIET PLACE TO FOCUS', stageTitleOne: 'Let the sand', stageTitleTwo: 'carry the noise away.', stageHint: 'Drag across the surface to leave a trace', drag: 'Drag', softTrace: 'soft trace', click: 'Click', deepImprint: 'deep imprint', windSmoothing: 'Wind is smoothing', nowPlaying: 'NOW PLAYING', restartTrack: 'Restart track', closeMenu: 'Close menu', light: 'Light', dark: 'Dark', queue: 'Queue', upNext: 'UP NEXT', all: 'All', favorites: 'Favorites', exploreEyebrow: 'THE QUIET MECHANICS', exploreTitleOne: 'A surface that', exploreTitleTwo: 'remembers softly.', exploreCopy: 'Sandfi turns small gestures into temporary topography. Every mark fades at its own pace as the simulated wind moves across the surface.', traceCardTitle: 'Trace', traceCardCopy: 'Drag through the sand for a shallow, directional trail with raised edges.', pressCardTitle: 'Press', pressCardCopy: 'Click to form a deeper hollow that takes longer for the wind to soften.', driftCardTitle: 'Drift', driftCardCopy: 'Fine grains, ripples, and a slow crosswind keep the whole landscape alive.', myPlaylists: 'My playlists', newPlaylist: 'New playlist', choosePlaylist: 'Choose playlist', visualizerOn: 'Visualizer: On', visualizerOff: 'Visualizer: Off', emptyQueue: 'No tracks in this view yet.', playlistCreated: 'Playlist created.', playlistExists: 'That playlist already exists.', writePlaylistName: 'Enter a playlist name first.', trackAdded: 'Track added.', trackExists: 'This track is already in the playlist.', createPlaylistFirst: 'Create a playlist first.', moods: { focus: { label: 'Focus', description: 'Warm and clear' }, rainy: { label: 'Rainy', description: 'Wet sand and soft rain' }, night: { label: 'Night', description: 'Cool moonlit dunes' }, sunset: { label: 'Sunset', description: 'Golden light and long shadows' }, dust: { label: 'Dust storm', description: 'Wind-blown grains and haze' }, mist: { label: 'Misty dawn', description: 'Soft fog over cool sand' } }
  },
  id: {
    liveAmbience: 'SUASANA LANGSUNG', ambienceTitle: 'SUASANA', moodLabel: 'Mood pasir', windDrift: 'Arah angin', traceHold: 'Jejak bertahan', sandContrast: 'Kontras pasir', cardOpacity: 'Transparansi kartu', moodEyebrow: 'PILIH CUACAMU', moodTitleOne: 'Enam langit,', moodTitleTwo: 'satu bukit pasir yang tenang.', moodCopy: 'Ketuk satu mood untuk mengubah cahaya, cuaca, dan rasa pasirnya. Kamu akan dibawa balik ke bukit.', kPlay: 'Putar / jeda', kSkip: 'Sebelumnya / berikutnya', kFav: 'Favorit', kVis: 'Visualizer', kQueue: 'Antrean', footerTag: 'LOFI DI BUKIT PASIR', clearSand: 'Bersihkan permukaan', myPlaylist: 'PLAYLIST SAYA', keyboardHint: 'Spasi putar · ←/→ berikutnya · F favorit · V visualizer · Q antrean', stageEyebrow: 'TEMPAT TENANG UNTUK FOKUS', stageTitleOne: 'Biarkan pasir', stageTitleTwo: 'membawa pergi bisingnya.', stageHint: 'Geser di permukaan untuk meninggalkan jejak', drag: 'Geser', softTrace: 'jejak lembut', click: 'Klik', deepImprint: 'cekungan dalam', windSmoothing: 'Angin sedang meratakan', nowPlaying: 'SEDANG DIPUTAR', restartTrack: 'Putar ulang', closeMenu: 'Tutup menu', light: 'Terang', dark: 'Gelap', queue: 'Antrean', upNext: 'BERIKUTNYA', all: 'Semua', favorites: 'Favorit', exploreEyebrow: 'MEKANIKA YANG TENANG', exploreTitleOne: 'Permukaan yang', exploreTitleTwo: 'mengingat dengan lembut.', exploreCopy: 'Sandfi mengubah gerakan kecil menjadi topografi sementara. Setiap jejak memudar dengan ritmenya sendiri saat angin simulasi bergerak di atas pasir.', traceCardTitle: 'Jejak', traceCardCopy: 'Geser di atas pasir untuk membuat jejak dangkal yang mengikuti arah gerakan.', pressCardTitle: 'Tekan', pressCardCopy: 'Klik untuk membuat cekungan yang lebih dalam dan lebih lama diratakan angin.', driftCardTitle: 'Hanyut', driftCardCopy: 'Butiran halus, riak, dan angin silang yang pelan membuat lanskap tetap hidup.', myPlaylists: 'Playlist saya', newPlaylist: 'Playlist baru', choosePlaylist: 'Pilih playlist', visualizerOn: 'Visualizer: Nyala', visualizerOff: 'Visualizer: Mati', emptyQueue: 'Belum ada lagu di tampilan ini.', playlistCreated: 'Playlist dibuat.', playlistExists: 'Playlist itu sudah ada.', writePlaylistName: 'Tulis nama playlist dulu.', trackAdded: 'Lagu ditambahkan.', trackExists: 'Lagu ini sudah ada di playlist.', createPlaylistFirst: 'Buat playlist dulu.', moods: { focus: { label: 'Fokus', description: 'Pasir hangat dan jernih' }, rainy: { label: 'Hujan', description: 'Pasir basah dan hujan lembut' }, night: { label: 'Malam', description: 'Gundukan pasir diterangi bulan' }, sunset: { label: 'Senja', description: 'Cahaya emas dan bayangan panjang' }, dust: { label: 'Badai pasir', description: 'Butiran tertiup angin dan kabut debu' }, mist: { label: 'Fajar berkabut', description: 'Kabut lembut di atas pasir sejuk' } }
  }
};
let language = readStorage('sandfi:language', 'en');
if (!translations[language]) language = 'en';
function t(key) { return translations[language][key] ?? translations.en[key] ?? key; }
const savedFavorites = readStorage(storageKeys.favorites, []);
let favoriteTracks = new Set(Array.isArray(savedFavorites) ? savedFavorites : []);
let playlists = readStorage(storageKeys.playlists, [{ id: 'my-lofi', name: 'My Lofi', tracks: [] }]);
if (!Array.isArray(playlists) || !playlists.length) playlists = [{ id: 'my-lofi', name: 'My Lofi', tracks: [] }];
let selectedMood = readStorage(storageKeys.mood, 'focus');
visualizerEnabled = Boolean(readStorage(storageKeys.visualizer, false));

const tracks = [
  { title: 'Desert Bloom', artist: 'Sundown Radio', duration: '4:12', src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_1926242958.webp' },
  { title: 'Soft Focus', artist: 'mellowform', duration: '3:48', src: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_94692e12de.mp3?filename=lofi-chill-hip-hop-121492.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_0504138555.webp' },
  { title: 'Golden Hour Loop', artist: 'Low Tide Club', duration: '5:06', src: 'https://cdn.pixabay.com/download/audio/2022/02/22/audio_d1718ab21b.mp3?filename=lofi-study-112191.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_1451869109.webp' },
  { title: 'Quiet Palms', artist: 'Afterglow FM', duration: '4:35', src: 'https://cdn.pixabay.com/download/audio/2022/08/23/audio_7c4c1e2e6e.mp3?filename=lofi-study-112191.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_1442359434.webp' },
  { title: 'Warm Static', artist: 'n o r t h', duration: '3:21', src: 'https://cdn.pixabay.com/download/audio/2022/10/30/audio_7d7f9f9b15.mp3?filename=lofi-chill-hip-hop-121492.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_1648025642.webp' },
  { title: 'Slow Orbit', artist: 'Moonlit Market', duration: '4:51', src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_1836540378.webp' },
  { title: 'Window Seat', artist: 'sleepwalkers', duration: '5:18', src: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_94692e12de.mp3?filename=lofi-chill-hip-hop-121492.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_0527137995.webp' },
  { title: 'Last Light', artist: 'Low Tide Club', duration: '3:57', src: 'https://cdn.pixabay.com/download/audio/2022/02/22/audio_d1718ab21b.mp3?filename=lofi-study-112191.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_0934818732.webp' },
  { title: 'Paper Lanterns', artist: 'Hourglass Youth', duration: '4:08', src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_1926242958.webp' },
  { title: 'Sleepy District', artist: 'Neko Signal', duration: '3:43', src: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_94692e12de.mp3?filename=lofi-chill-hip-hop-121492.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_0504138555.webp' },
  { title: 'Vinyl Weather', artist: 'Eastbound', duration: '4:46', src: 'https://cdn.pixabay.com/download/audio/2022/02/22/audio_d1718ab21b.mp3?filename=lofi-study-112191.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_1451869109.webp' },
  { title: 'Distant Platform', artist: 'Afterglow FM', duration: '5:02', src: 'https://cdn.pixabay.com/download/audio/2022/08/23/audio_7c4c1e2e6e.mp3?filename=lofi-study-112191.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_1442359434.webp' },
  { title: 'Night Bus Home', artist: 'n o r t h', duration: '3:36', src: 'https://cdn.pixabay.com/download/audio/2022/10/30/audio_7d7f9f9b15.mp3?filename=lofi-chill-hip-hop-121492.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_1648025642.webp' },
  { title: 'Cinnamon Sky', artist: 'Moonlit Market', duration: '4:17', src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_1836540378.webp' },
  { title: 'Low Battery', artist: 'sleepwalkers', duration: '3:58', src: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_94692e12de.mp3?filename=lofi-chill-hip-hop-121492.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_0527137995.webp' },
  { title: 'After the Rain', artist: 'Low Tide Club', duration: '5:24', src: 'https://cdn.pixabay.com/download/audio/2022/02/22/audio_d1718ab21b.mp3?filename=lofi-study-112191.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_0934818732.webp' },
  { title: 'Blue Hour Arcade', artist: 'Soft Relay', duration: '4:26', src: 'https://cdn.pixabay.com/download/audio/2022/08/23/audio_7c4c1e2e6e.mp3?filename=lofi-study-112191.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_1926242958.webp' },
  { title: 'Rain on Fifth', artist: 'Window Garden', duration: '3:52', src: 'https://cdn.pixabay.com/download/audio/2022/10/30/audio_7d7f9f9b15.mp3?filename=lofi-chill-hip-hop-121492.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_0504138555.webp' },
  { title: 'Dusty Cassette', artist: 'Mellow Archive', duration: '4:41', src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_1451869109.webp' },
  { title: 'Neon Tea', artist: 'Late Checkout', duration: '3:29', src: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_94692e12de.mp3?filename=lofi-chill-hip-hop-121492.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_1442359434.webp' },
  { title: 'Clouds on Repeat', artist: 'Daydream Dept.', duration: '5:11', src: 'https://cdn.pixabay.com/download/audio/2022/02/22/audio_d1718ab21b.mp3?filename=lofi-study-112191.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_1648025642.webp' },
  { title: 'Sunday Sidewalk', artist: 'Paper Moons', duration: '4:03', src: 'https://cdn.pixabay.com/download/audio/2022/08/23/audio_7c4c1e2e6e.mp3?filename=lofi-study-112191.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_1836540378.webp' },
  { title: 'Faded Polaroid', artist: 'Quiet Hours', duration: '3:47', src: 'https://cdn.pixabay.com/download/audio/2022/10/30/audio_7d7f9f9b15.mp3?filename=lofi-chill-hip-hop-121492.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_0527137995.webp' },
  { title: 'Midnight Rooftop', artist: 'Sundown Radio', duration: '4:58', src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3', cover: 'https://lofistudy247.com/images/boy_train_headphones/boy_train_headphones_0934818732.webp' },
];

// Expand the queue with 80 more lofi selections so the listener can keep exploring.
const extraTrackMoods = [
  'Amber', 'Velvet', 'Rainy', 'Sleepy', 'Golden', 'Paper', 'Mellow', 'Faded',
  'Quiet', 'Neon', 'Soft', 'Dusty', 'Cloudy', 'Midnight', 'Warm', 'Blue',
  'Slow', 'Sunday', 'Hazy', 'Candlelit',
];
const extraTrackScenes = ['Windows', 'Lanterns', 'Streets', 'Daydreams'];
const extraTrackArtists = [
  'Sundown Radio', 'mellowform', 'Low Tide Club', 'Afterglow FM',
  'n o r t h', 'Moonlit Market', 'sleepwalkers', 'Hourglass Youth',
  'Neko Signal', 'Eastbound',
];
const lofiStreamPool = [
  'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
  'https://cdn.pixabay.com/download/audio/2022/10/25/audio_94692e12de.mp3?filename=lofi-chill-hip-hop-121492.mp3',
  'https://cdn.pixabay.com/download/audio/2022/02/22/audio_d1718ab21b.mp3?filename=lofi-study-112191.mp3',
  'https://cdn.pixabay.com/download/audio/2022/08/23/audio_7c4c1e2e6e.mp3?filename=lofi-study-112191.mp3',
  'https://cdn.pixabay.com/download/audio/2022/10/30/audio_7d7f9f9b15.mp3?filename=lofi-chill-hip-hop-121492.mp3',
];
const extraTracks = extraTrackMoods.flatMap((mood, moodIndex) => extraTrackScenes.map((scene, sceneIndex) => {
  const index = moodIndex * extraTrackScenes.length + sceneIndex;
  const seconds = 18 + ((index * 7) % 42);
  return {
    title: `${mood} ${scene}`,
    artist: extraTrackArtists[index % extraTrackArtists.length],
    duration: `4:${String(seconds).padStart(2, '0')}`,
    src: lofiStreamPool[index % lofiStreamPool.length],
  };
}));
tracks.push(...extraTracks);
let trackIndex = 0;
let isPlaying = false;
let audioContext;
let ambientSource;
let ambientGain;
let ambientBeatTimer;
const animatedSceneryCovers = [
  'https://media1.tenor.com/m/HtxxlZHbsc8AAAAd/anime-rain.gif',
  'https://media1.tenor.com/m/I3vp5LtFADIAAAAd/anime-scenery.gif',
  'https://media1.tenor.com/m/YnUaO2k0zNQAAAAd/anime-rain-city.gif',
  'https://media1.tenor.com/m/xFlaHYiCHnkAAAAd/anime-rain.gif',
  'https://media1.tenor.com/m/0uDfc8UDPVMAAAAd/anime-rain.gif',
  'https://i.pinimg.com/originals/7f/1f/48/7f1f48a226990396625da58a50423ada.gif',
];

// Each track keeps its lofi stream; the synth fallback below keeps playback alive if a network stream fails.
tracks.forEach((track, index) => {
  track.gif = animatedSceneryCovers[index % animatedSceneryCovers.length];
});

function resize() {
  if (rafId) cancelAnimationFrame(rafId);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * DPR);
  canvas.height = Math.floor(height * DPR);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  buildSandTexture();
  buildSandSurface();
  drawSand(performance.now());
}

function preserveSoftTrace() {
  trailErosionStartsAt = performance.now() + trailHoldMs;
}

function seeded(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function smoothstep(value) { return value * value * (3 - 2 * value); }

function valueNoise(x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const xf = smoothstep(x - x0);
  const yf = smoothstep(y - y0);
  const a = seeded(x0 * 127.1 + y0 * 311.7);
  const b = seeded((x0 + 1) * 127.1 + y0 * 311.7);
  const c = seeded(x0 * 127.1 + (y0 + 1) * 311.7);
  const d = seeded((x0 + 1) * 127.1 + (y0 + 1) * 311.7);
  return (a + (b - a) * xf) * (1 - yf) + (c + (d - c) * xf) * yf;
}

function fractalNoise(x, y) {
  let total = 0;
  let amplitude = .55;
  let frequency = 1;
  let weight = 0;
  for (let octave = 0; octave < 4; octave++) {
    total += valueNoise(x * frequency, y * frequency) * amplitude;
    weight += amplitude;
    frequency *= 2.07;
    amplitude *= .5;
  }
  return total / weight;
}

function buildSandTexture() {
  const scale = Math.min(.52, 840 / Math.max(width, height));
  textureCanvas.width = Math.max(240, Math.floor(width * scale));
  textureCanvas.height = Math.max(180, Math.floor(height * scale));
  const image = textureCtx.createImageData(textureCanvas.width, textureCanvas.height);
  const data = image.data;
  const lightingAngle = -.48;
  const lightX = Math.cos(lightingAngle);
  const lightY = Math.sin(lightingAngle);
  for (let y = 0; y < textureCanvas.height; y++) {
    for (let x = 0; x < textureCanvas.width; x++) {
      const u = x / textureCanvas.width;
      const v = y / textureCanvas.height;
      const warp = fractalNoise(u * 3.5, v * 3.5) * .38;
      const broad = fractalNoise(u * 2.05 + warp, v * 2.05 - warp);
      const grain = fractalNoise(u * 58 + warp, v * 58 - warp);
      const ripple = Math.sin((v + warp) * 138 + Math.sin(u * 11 + broad * 5) * 2.4) * .5 + .5;
      const ridge = Math.pow(ripple, 12) * .13;
      const dx = fractalNoise(u * 2.05 + .015, v * 2.05) - fractalNoise(u * 2.05 - .015, v * 2.05);
      const dy = fractalNoise(u * 2.05, v * 2.05 + .015) - fractalNoise(u * 2.05, v * 2.05 - .015);
      const relief = (dx * lightX + dy * lightY) * 24;
      const tone = ((broad - .5) * 23 + (grain - .5) * 15 + ridge * 26 + relief) * sandContrast;
      const index = (y * textureCanvas.width + x) * 4;
      data[index] = Math.max(0, Math.min(255, 202 + tone * 1.06));
      data[index + 1] = Math.max(0, Math.min(255, 161 + tone * .83));
      data[index + 2] = Math.max(0, Math.min(255, 112 + tone * .54));
      data[index + 3] = 255;
    }
  }
  textureCtx.putImageData(image, 0, 0);
}

// ---------------------------------------------------------------------------
// Rainy mood: layered rain, wet sand, reflective puddles, ripples and splashes.
// Everything below only runs while the Rainy mood is selected.
// ---------------------------------------------------------------------------
const TAU = Math.PI * 2;
const rainState = {
  startedAt: 0,
  lastFrame: 0,
  impacts: [],
  streaks: [],
  streakKey: '',
  wetCanvas: document.createElement('canvas'),
  puddleCanvas: document.createElement('canvas'),
  mapKey: '',
  mapBuiltAt: 0,
  mask: null,
  maskWidth: 0,
  maskHeight: 0,
  puddlePoints: new Float32Array(0),
  sandSpawn: 0,
  rippleSpawn: 0,
};
// Three depth layers: far streaks are short and faint, near streaks are long, fast and slightly glowing.
const rainLayers = [
  { count: 90, speed: 780, length: 15, width: .6, alpha: .12, glow: false },
  { count: 56, speed: 1080, length: 26, width: .9, alpha: .18, glow: false },
  { count: 20, speed: 1480, length: 42, width: 1.3, alpha: .26, glow: true },
];

function wrap(value, size) { return ((value % size) + size) % size; }
function clamp01(value) { return value < 0 ? 0 : value > 1 ? 1 : value; }
function smooth01(value) { return smoothstep(clamp01(value)); }
function rainFbm(x, y) {
  return valueNoise(x, y) * .57 + valueNoise(x * 2.1 + 5.2, y * 2.1 + 1.3) * .29 + valueNoise(x * 4.3 + 9.1, y * 4.3 + 7.7) * .14;
}

// Builds two low-resolution maps once per canvas size:
// 1) wet sand: darker, uneven damp patches with a faint glossy sheen
// 2) puddles: irregular water bodies with sky reflection, a lit bank and a shadowed bank
function buildRainMaps(now) {
  const scale = Math.min(.36, 520 / Math.max(width, height));
  const w = Math.max(160, Math.floor(width * scale));
  const h = Math.max(110, Math.floor(height * scale));
  const { wetCanvas, puddleCanvas } = rainState;
  wetCanvas.width = puddleCanvas.width = w;
  wetCanvas.height = puddleCanvas.height = h;
  const wetCtx = wetCanvas.getContext('2d');
  const puddleCtx = puddleCanvas.getContext('2d');
  const wetImage = wetCtx.createImageData(w, h);
  const puddleImage = puddleCtx.createImageData(w, h);
  const wet = wetImage.data;
  const water = puddleImage.data;
  const mask = new Uint8Array(w * h);
  const points = [];
  const aspect = h / w;
  const eps = .018;
  const lightX = -.707;
  const lightY = -.707;

  let r = 0, g = 0, b = 0, a = 0;
  const reset = () => { r = g = b = a = 0; };
  const over = (sr, sg, sb, sa) => {
    if (sa <= 0) return;
    const oa = sa + a * (1 - sa);
    r = (sr * sa + r * a * (1 - sa)) / oa;
    g = (sg * sa + g * a * (1 - sa)) / oa;
    b = (sb * sa + b * a * (1 - sa)) / oa;
    a = oa;
  };
  const store = (data, index) => { data[index] = r; data[index + 1] = g; data[index + 2] = b; data[index + 3] = a * 255; };

  for (let y = 0; y < h; y++) {
    const v = y / h;
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const index = y * w + x;
      const nx = u * 2.8 + 4.7;
      const ny = v * 2.8 * aspect;
      const base = rainFbm(nx, ny) + (v - .5) * .11;
      const depth = smooth01((base - .595) / .05);
      const halo = smooth01((base - .5) / .13);
      const wetNoise = rainFbm(nx * 2.3 + 11.1, ny * 2.3 + 4.4);
      const wetness = clamp01(.45 + (wetNoise - .5) * 1.9 + halo * .35);
      const grain = seeded(x * 1.37 + y * 91.7 + .5);

      // Wet sand: darker brown, darkest right around the water, with soft glossy patches.
      reset();
      over(60 - 16 * halo, 41 - 10 * halo, 27 - 5 * halo, Math.min((.16 + wetness * .24 + halo * .1) * (.88 + grain * .24), .55));
      over(178, 194, 192, smooth01((wetNoise - .56) / .14) * (1 - depth) * .09);
      if (grain > .975) over(236, 242, 236, .12 * (1 - depth));
      store(wet, index * 4);

      // Puddles: murky water that mirrors a brighter sky toward the top of the scene.
      reset();
      if (depth > 0) {
        const refl = clamp01(.2 + (1 - v) * .4 + (rainFbm(nx * 5 + 2.2, ny * 5 + 8.8) - .5) * .6) * .75;
        over(86 + 92 * refl, 98 + 96 * refl, 98 + 96 * refl, depth * .82);
        if (depth < 1) {
          const gx = rainFbm(nx + eps, ny) - rainFbm(nx - eps, ny);
          const gy = rainFbm(nx, ny + eps) - rainFbm(nx, ny - eps);
          const facing = (gx * lightX + gy * lightY) / (Math.hypot(gx, gy) + 1e-5);
          const edge = clamp01(1 - Math.abs(depth - .5) * 2);
          over(236, 242, 236, edge * clamp01(facing * 1.2 + .25) * .5);
          over(28, 20, 15, edge * clamp01(-facing * 1.2 + .1) * .45);
        }
      }
      store(water, index * 4);

      mask[index] = depth > .35 ? 1 : 0;
      if (depth > .6 && seeded(index * .731) < .05) points.push(u, v);
    }
  }
  wetCtx.putImageData(wetImage, 0, 0);
  puddleCtx.putImageData(puddleImage, 0, 0);
  rainState.mask = mask;
  rainState.maskWidth = w;
  rainState.maskHeight = h;
  rainState.puddlePoints = Float32Array.from(points);
  rainState.mapKey = `${width}x${height}`;
  rainState.mapBuiltAt = now;
}

function isOverPuddle(x, y) {
  const { mask, maskWidth, maskHeight } = rainState;
  if (!mask) return false;
  const px = Math.min(maskWidth - 1, Math.max(0, Math.floor((x / width) * maskWidth)));
  const py = Math.min(maskHeight - 1, Math.max(0, Math.floor((y / height) * maskHeight)));
  return mask[py * maskWidth + px] === 1;
}

function ensureRainStreaks() {
  const key = `${Math.round(width)}x${Math.round(height)}`;
  if (rainState.streakKey === key) return;
  rainState.streakKey = key;
  const areaScale = Math.max(.5, Math.min(2, (width * height) / (1280 * 720)));
  rainState.streaks = rainLayers.map((layer, layerIndex) => Array.from({ length: Math.round(layer.count * areaScale) }, (_, i) => ({
    x: seeded(i * 13.37 + layerIndex * 71.1),
    y: seeded(i * 5.91 + layerIndex * 33.7 + 2),
    speed: layer.speed * (.85 + seeded(i * 3.3 + layerIndex) * .3),
    length: layer.length * (.8 + seeded(i * 8.8 + layerIndex * 2) * .4),
  })));
}

// Drops hit dry-ish sand as tiny dark craters with a splash, and hit puddles as expanding ripples.
function spawnRainImpacts(dt, intensity) {
  const impacts = rainState.impacts;
  const area = Math.max(.55, Math.min(1.8, (width * height) / (1280 * 720)));
  rainState.sandSpawn += dt * 105 * area * intensity;
  while (rainState.sandSpawn >= 1) {
    rainState.sandSpawn -= 1;
    const x = Math.random() * width;
    const y = Math.random() * height;
    if (isOverPuddle(x, y)) continue;
    impacts.push({ kind: 'sand', x, y, age: 0, life: .9 + Math.random() * .9, seed: Math.random() * 1000, size: 1 + Math.random() * 1.4 });
  }
  const points = rainState.puddlePoints;
  if (points.length) {
    rainState.rippleSpawn += dt * 24 * Math.min(area, 1.3) * intensity;
    while (rainState.rippleSpawn >= 1) {
      rainState.rippleSpawn -= 1;
      const pick = Math.floor(Math.random() * (points.length / 2)) * 2;
      const big = Math.random() < .16;
      impacts.push({
        kind: 'ripple',
        x: points[pick] * width + (Math.random() - .5) * 6,
        y: points[pick + 1] * height + (Math.random() - .5) * 6,
        age: 0,
        life: big ? 1.9 : 1.2 + Math.random() * .5,
        seed: Math.random() * 1000,
        maxR: big ? 30 + Math.random() * 14 : 11 + Math.random() * 14,
        big,
      });
    }
  }
  if (impacts.length > 340) impacts.splice(0, impacts.length - 340);
}

function drawRainImpacts(dt) {
  const impacts = rainState.impacts;
  for (let i = impacts.length - 1; i >= 0; i--) {
    const drop = impacts[i];
    drop.age += dt;
    if (drop.age >= drop.life) { impacts[i] = impacts[impacts.length - 1]; impacts.pop(); continue; }
    const t = drop.age / drop.life;

    if (drop.kind === 'sand') {
      const fade = Math.pow(1 - t, 1.4);
      ctx.fillStyle = `rgba(52,35,23,${.34 * fade})`;
      ctx.beginPath(); ctx.arc(drop.x, drop.y, drop.size * (1 + t * .5), 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(236,214,172,${.22 * fade})`;
      ctx.lineWidth = .6;
      ctx.beginPath(); ctx.arc(drop.x, drop.y, drop.size * 1.9, 0, TAU); ctx.stroke();
      if (drop.age < .3) {
        const s = drop.age / .3;
        ctx.strokeStyle = `rgba(235,243,238,${(1 - s) * .35})`;
        ctx.lineWidth = .7;
        ctx.beginPath(); ctx.ellipse(drop.x, drop.y, 1.5 + s * 8, (1.5 + s * 8) * .7, 0, 0, TAU); ctx.stroke();
        ctx.fillStyle = `rgba(238,244,238,${(1 - s) * .7})`;
        for (let k = 0; k < 4; k++) {
          const angle = seeded(drop.seed + k * 1.7) * TAU;
          const distance = (3 + seeded(drop.seed + k + 9) * 9) * Math.sqrt(s);
          const lift = Math.sin(s * Math.PI) * (3 + seeded(drop.seed + k + 4) * 4);
          ctx.beginPath(); ctx.arc(drop.x + Math.cos(angle) * distance, drop.y + Math.sin(angle) * distance * .7 - lift, .7, 0, TAU); ctx.fill();
        }
      }
      continue;
    }

    // Puddle ripple: a soft shadow ring plus a bright ring gives the water surface some depth.
    const squash = .62;
    const spread = 1 - Math.pow(1 - t, 2);
    const alpha = Math.pow(1 - t, 1.6);
    const rings = [[1.5 + spread * drop.maxR, alpha]];
    const t2 = t - .16;
    if (t2 > 0) rings.push([1 + (1 - Math.pow(1 - t2 / .84, 2)) * drop.maxR * .72, Math.pow(1 - t2 / .84, 1.8) * .75]);
    const t3 = t - .34;
    if (drop.big && t3 > 0) rings.push([1 + (1 - Math.pow(1 - t3 / .66, 2)) * drop.maxR * .46, Math.pow(1 - t3 / .66, 1.8) * .55]);
    ctx.lineWidth = Math.max(.5, 1.2 - t * .7);
    rings.forEach(([radius, ringAlpha]) => {
      ctx.strokeStyle = `rgba(22,32,36,${.38 * ringAlpha})`;
      ctx.beginPath(); ctx.ellipse(drop.x, drop.y + .9, radius, radius * squash, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = `rgba(226,238,236,${.55 * ringAlpha})`;
      ctx.beginPath(); ctx.ellipse(drop.x, drop.y, radius, radius * squash, 0, 0, TAU); ctx.stroke();
    });
    if (drop.age < .22) {
      const s = drop.age / .22;
      ctx.fillStyle = `rgba(240,246,244,${(1 - s) * .8})`;
      ctx.beginPath(); ctx.arc(drop.x, drop.y, 1.4 * (1 - s * .4), 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(240,246,244,${(1 - s) * .65})`;
      for (let k = 0; k < 3; k++) {
        const angle = seeded(drop.seed + k * 2.3) * TAU;
        ctx.beginPath(); ctx.arc(drop.x + Math.cos(angle) * s * 6, drop.y + Math.sin(angle) * s * 3 - Math.sin(s * Math.PI) * 5, .8, 0, TAU); ctx.fill();
      }
    }
  }
}

// Wind drift slants the streaks; each layer batches its strokes into two paths (faded tail + bright head).
function drawRainStreaks(time, intensity) {
  const slant = .1 + windAmount * .0075;
  const spanX = width + 80;
  ctx.lineCap = 'round';
  rainLayers.forEach((layer, layerIndex) => {
    const tails = new Path2D();
    const heads = new Path2D();
    const travel = height + layer.length * 2 + 40;
    rainState.streaks[layerIndex].forEach((streak) => {
      const y = wrap(streak.y * travel + time * streak.speed, travel) - layer.length - 20;
      const x = wrap(streak.x * spanX + y * slant, spanX) - 40;
      const dx = slant * streak.length;
      const dy = streak.length;
      tails.moveTo(x - dx, y - dy); tails.lineTo(x - dx * .45, y - dy * .45);
      heads.moveTo(x - dx * .45, y - dy * .45); heads.lineTo(x, y);
    });
    const alpha = layer.alpha * intensity;
    if (layer.glow) {
      ctx.lineWidth = layer.width * 3;
      ctx.strokeStyle = `rgba(214,228,230,${alpha * .18})`;
      ctx.stroke(tails); ctx.stroke(heads);
    }
    ctx.lineWidth = layer.width;
    ctx.strokeStyle = `rgba(222,234,236,${alpha * .35})`;
    ctx.stroke(tails);
    ctx.strokeStyle = `rgba(228,238,238,${alpha})`;
    ctx.stroke(heads);
  });
}

function drawRainWeather(now) {
  if (selectedMood !== 'rainy') return;
  const state = rainState;
  if (now - state.lastFrame > 600) {
    // Rainy was just selected (or the tab was hidden): let the storm build up again.
    state.startedAt = now;
    state.impacts.length = 0;
    state.sandSpawn = 0;
    state.rippleSpawn = 0;
  }
  const dt = Math.min(Math.max((now - state.lastFrame) / 1000, 0), .08);
  state.lastFrame = now;
  if (state.mapKey !== `${width}x${height}` && (!state.mask || now - state.mapBuiltAt > 350)) buildRainMaps(now);
  ensureRainStreaks();

  const elapsed = (now - state.startedAt) / 1000;
  const intensity = .3 + .7 * smooth01(elapsed / 6);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.globalAlpha = .3 + .7 * smooth01(elapsed / 8);
  ctx.drawImage(state.wetCanvas, 0, 0, width, height);
  ctx.globalAlpha = .12 + .88 * smooth01(elapsed / 26);
  ctx.drawImage(state.puddleCanvas, 0, 0, width, height);
  ctx.globalAlpha = 1;

  const mist = ctx.createLinearGradient(0, 0, 0, height * .6);
  mist.addColorStop(0, 'rgba(196,208,210,.10)');
  mist.addColorStop(1, 'rgba(196,208,210,0)');
  ctx.fillStyle = mist;
  ctx.fillRect(0, 0, width, height * .6);

  spawnRainImpacts(dt, intensity);
  drawRainImpacts(dt);
  drawRainStreaks(now * .001, intensity);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Extra sand moods: Sunset, Dust storm and Misty dawn. Each only draws while selected.
// ---------------------------------------------------------------------------
function drawSunsetWeather(now) {
  if (selectedMood !== 'sunset') return;
  const time = now * .001;
  ctx.save();
  // Long raking shadows from a low sun: a few wide, very soft slanted bands.
  const reach = height * .55;
  for (let i = 0; i < 6; i++) {
    const x = (i * .19 + .02) * width + Math.sin(time * .06 + i * 1.3) * 18;
    for (let layer = 0; layer < 3; layer++) {
      const bandWidth = 34 + layer * 34;
      ctx.fillStyle = `rgba(92,40,38,${.028 - layer * .006})`;
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x + bandWidth, 0);
      ctx.lineTo(x + bandWidth - reach, height); ctx.lineTo(x - reach, height);
      ctx.closePath(); ctx.fill();
    }
  }
  // Warm sun glow low in the corner.
  const glow = ctx.createRadialGradient(width * .08, height * .94, 0, width * .08, height * .94, Math.max(width, height) * .62);
  glow.addColorStop(0, 'rgba(255,176,92,.26)');
  glow.addColorStop(.45, 'rgba(255,150,80,.09)');
  glow.addColorStop(1, 'rgba(255,150,80,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  // Grains catching the low light: slow twinkling glints.
  const count = Math.round(70 * Math.max(.6, Math.min(1.8, (width * height) / (1280 * 720))));
  for (let i = 0; i < count; i++) {
    const twinkle = Math.pow(Math.max(0, Math.sin(time * (.7 + seeded(i * 2.3) * 1.3) + i * 2.1)), 6);
    if (twinkle < .05) continue;
    const x = seeded(i * 7.1 + 1) * width;
    const y = seeded(i * 3.9 + 5) * height;
    ctx.fillStyle = `rgba(255,236,190,${.75 * twinkle})`;
    ctx.beginPath(); ctx.arc(x, y, .7 + twinkle * 1.1, 0, TAU); ctx.fill();
    if (twinkle > .5) {
      const arm = 2 + twinkle * 5;
      ctx.strokeStyle = `rgba(255,236,190,${.4 * twinkle})`;
      ctx.lineWidth = .6;
      ctx.beginPath(); ctx.moveTo(x - arm, y); ctx.lineTo(x + arm, y); ctx.moveTo(x, y - arm); ctx.lineTo(x, y + arm); ctx.stroke();
    }
  }
  ctx.restore();
}

const dustParticles = Array.from({ length: 150 }, (_, i) => ({
  x: seeded(i * 4.1),
  y: seeded(i * 9.7 + 3),
  speed: 160 + seeded(i * 2.3) * 380,
  size: .6 + seeded(i * 5.9) * 1.9,
  alpha: .12 + seeded(i * 8.1) * .28,
  phase: seeded(i * 1.9) * TAU,
}));

function drawDustWeather(now) {
  if (selectedMood !== 'dust') return;
  const time = now * .001;
  const gust = .6 + (windAmount / 12) * .7 + Math.sin(time * .4) * .25;
  const span = width + 120;
  ctx.save();
  // Soft, wide plumes of airborne dust sliding across the surface.
  for (let i = 0; i < 5; i++) {
    const cx = wrap(seeded(i * 6.1) * span + time * (28 + i * 11) * gust, span) - 60;
    const cy = height * (.14 + i * .2) + Math.sin(time * .3 + i * 2) * 18;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(3.4, .42);
    const plume = ctx.createRadialGradient(0, 0, 0, 0, 0, height * .36);
    plume.addColorStop(0, `rgba(228,190,134,${.17 - i * .012})`);
    plume.addColorStop(1, 'rgba(228,190,134,0)');
    ctx.fillStyle = plume;
    ctx.beginPath(); ctx.arc(0, 0, height * .36, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // Blown grains: short horizontal streaks in three brightness tiers.
  ctx.lineCap = 'round';
  const tiers = [new Path2D(), new Path2D(), new Path2D()];
  dustParticles.forEach((p, i) => {
    const x = wrap(p.x * span + time * p.speed * gust, span) - 60;
    const y = p.y * height + Math.sin(time * .9 + p.phase) * 14 + x * .03;
    const length = p.size * (6 + gust * 8);
    const tier = tiers[i % 3];
    tier.moveTo(x - length, y - length * .08); tier.lineTo(x, y);
  });
  [.55, .8, 1].forEach((scale, i) => {
    ctx.lineWidth = 1 + i * .5;
    ctx.strokeStyle = `rgba(236,204,150,${.32 * scale})`;
    ctx.stroke(tiers[i]);
  });
  ctx.restore();
}

function drawMistWeather(now) {
  if (selectedMood !== 'mist') return;
  const time = now * .001;
  const reach = Math.max(width, height);
  ctx.save();
  // Low fog banks drifting slowly; marks drawn afterward still cut through them.
  for (let i = 0; i < 7; i++) {
    const cx = width * (.1 + .14 * i) + Math.sin(time * .06 + i * 1.7) * width * .08;
    const cy = height * (.2 + .12 * (i % 4)) + Math.cos(time * .05 + i) * 30;
    const radius = reach * (.22 + .05 * (i % 3));
    const bank = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    bank.addColorStop(0, 'rgba(238,232,238,.20)');
    bank.addColorStop(1, 'rgba(238,232,238,0)');
    ctx.fillStyle = bank;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  }
  const ground = ctx.createLinearGradient(0, height, 0, height * .45);
  ground.addColorStop(0, 'rgba(240,236,242,.18)');
  ground.addColorStop(1, 'rgba(240,236,242,0)');
  ctx.fillStyle = ground;
  ctx.fillRect(0, height * .45, width, height * .55);
  // Dew on the grains: faint cool glints.
  for (let i = 0; i < 40; i++) {
    const twinkle = Math.pow(Math.max(0, Math.sin(time * (.35 + seeded(i * 1.7) * .6) + i * 1.9)), 4);
    if (twinkle < .08) continue;
    ctx.fillStyle = `rgba(246,244,252,${.5 * twinkle})`;
    ctx.beginPath(); ctx.arc(seeded(i * 5.3 + 2) * width, seeded(i * 8.7 + 4) * height, .6 + twinkle * .9, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

function updateVisualizer(now) {
  const visualizer = document.querySelector('#audio-visualizer');
  if (!visualizer) return;
  visualizer.classList.toggle('is-active', visualizerEnabled && isPlaying);
  visualizer.querySelectorAll('i').forEach((bar, index) => {
    const pulse = visualizerEnabled && isPlaying ? Math.abs(Math.sin(now * .006 + index * 1.37 + trackIndex * .42)) : .12;
    bar.style.setProperty('--bar-height', `${8 + pulse * 34}px`);
  });
}

// ---------------------------------------------------------------------------
// Sand surface: a height field that is carved by touch, piles up into rims,
// slumps like real sand, drifts with the wind, and throws loose grains.
// ---------------------------------------------------------------------------
const sandSurface = {
  cell: 3,
  w: 0,
  h: 0,
  height: null,
  scratch: null,
  canvas: document.createElement('canvas'),
  image: null,
  box: null,
  shaded: null,
  grains: [],
};
// Each mood changes how the sand behaves (cohesion, erosion, wind) and how its relief is lit.
const sandMoods = {
  focus: { relax: 1, decay: .045, wind: 1, light: [255, 226, 170], dark: [72, 40, 20], grain: [226, 190, 138], gain: 1.1, dir: [.887, -.462] },
  rainy: { relax: .3, decay: .05, wind: .35, light: [208, 222, 214], dark: [36, 25, 18], grain: [150, 124, 92], gain: 1, dir: [.887, -.462] },
  night: { relax: 1, decay: .045, wind: 1, light: [158, 176, 214], dark: [8, 14, 26], grain: [150, 158, 182], gain: .95, dir: [.887, -.462] },
  sunset: { relax: 1, decay: .05, wind: 1, light: [255, 192, 112], dark: [88, 34, 34], grain: [240, 176, 116], gain: 1.6, dir: [.97, -.2] },
  dust: { relax: 1.6, decay: .09, wind: 2.4, light: [246, 216, 160], dark: [88, 56, 28], grain: [226, 190, 138], gain: .85, dir: [.887, -.462] },
  mist: { relax: .6, decay: .04, wind: .6, light: [244, 238, 246], dark: [90, 80, 104], grain: [218, 200, 200], gain: .7, dir: [.887, -.462] },
};
const SAND_EPS = .004;

function buildSandSurface() {
  const s = sandSurface;
  s.cell = Math.max(2, Math.ceil(Math.max(width, height) / 720));
  s.w = Math.max(8, Math.ceil(width / s.cell));
  s.h = Math.max(8, Math.ceil(height / s.cell));
  s.height = new Float32Array(s.w * s.h);
  s.scratch = new Float32Array(s.w * s.h);
  s.canvas.width = s.w;
  s.canvas.height = s.h;
  s.image = s.canvas.getContext('2d').createImageData(s.w, s.h);
  s.box = null;
  s.shaded = null;
  s.grains.length = 0;
}

function growSandBox(x0, y0, x1, y1) {
  const s = sandSurface;
  x0 = Math.max(1, x0); y0 = Math.max(1, y0); x1 = Math.min(s.w - 2, x1); y1 = Math.min(s.h - 2, y1);
  if (x1 < x0 || y1 < y0) return;
  if (!s.box) { s.box = { x0, y0, x1, y1 }; return; }
  const box = s.box;
  if (x0 < box.x0) box.x0 = x0;
  if (y0 < box.y0) box.y0 = y0;
  if (x1 > box.x1) box.x1 = x1;
  if (y1 > box.y1) box.y1 = y1;
}

// Carves sand out of the surface and piles the displaced material into a rim around it.
// 'press' is a footprint-style hollow; 'trail' is a groove with a berm on each side.
function stampSand(x, y, depth, radius, angle, type) {
  const s = sandSurface;
  if (!s.height) return;
  const H = s.height;
  const cx = x / s.cell;
  const cy = y / s.cell;
  let reachX, reachY;
  let sx, sy, sl, sa, cosA, sinA;
  if (type === 'press') {
    sx = Math.max(1.6, radius * 1.0 / s.cell);
    sy = Math.max(1.2, radius * .7 / s.cell);
    reachX = Math.ceil(sx * 3.8);
    reachY = Math.ceil(sy * 3.8);
  } else {
    sl = Math.max(1.5, radius * .55 / s.cell);
    sa = Math.max(1.5, radius * .9 / s.cell);
    cosA = Math.cos(angle);
    sinA = Math.sin(angle);
    reachX = reachY = Math.ceil(Math.max(sa * 2.6, sl * 4));
  }
  const x0 = Math.floor(cx - reachX), x1 = Math.ceil(cx + reachX);
  const y0 = Math.floor(cy - reachY), y1 = Math.ceil(cy + reachY);
  for (let gy = Math.max(1, y0); gy <= Math.min(s.h - 2, y1); gy++) {
    for (let gx = Math.max(1, x0); gx <= Math.min(s.w - 2, x1); gx++) {
      const dx = gx - cx;
      const dy = gy - cy;
      let change;
      if (type === 'press') {
        const d = Math.hypot(dx / sx, dy / sy);
        change = -depth * 1.6 * Math.exp(-d * d / 2) + depth * .8 * Math.exp(-((d - 1.9) * (d - 1.9)) / (2 * .55 * .55));
      } else {
        const along = dx * cosA + dy * sinA;
        const side = Math.abs(-dx * sinA + dy * cosA);
        const lengthFalloff = Math.exp(-along * along / (2 * sa * sa));
        const carve = Math.exp(-side * side / (2 * sl * sl));
        const berm = Math.exp(-((side - 2.1 * sl) * (side - 2.1 * sl)) / (2 * .7 * sl * .7 * sl));
        change = depth * 1.05 * lengthFalloff * (-carve + .6 * berm);
      }
      const i = gy * s.w + gx;
      H[i] = Math.max(-2.2, Math.min(1.6, H[i] + change));
    }
  }
  growSandBox(x0, y0, x1, y1);
}

// Displaced grains fly out, then land and settle back onto the surface.
function spawnSandGrains(x, y, count, angle, spread) {
  const grains = sandSurface.grains;
  for (let i = 0; i < count && grains.length < 420; i++) {
    const heading = spread >= TAU ? Math.random() * TAU : angle + (Math.random() - .5) * spread;
    const speed = 20 + Math.random() * 55;
    grains.push({ x, y, z: 1, vx: Math.cos(heading) * speed, vy: Math.sin(heading) * speed * .7, vz: 40 + Math.random() * 70 });
  }
}

function addMark(x, y, depth = 0.35, radius = 14, strength = 1, angle = 0) {
  if (depth > .65) {
    stampSand(x, y, depth, radius, angle, 'press');
    spawnSandGrains(x, y, 14, 0, TAU);
  } else {
    stampSand(x, y, depth, radius, angle, 'trail');
    // Trail grains are thrown sideways, off the groove.
    spawnSandGrains(x, y, 1 + (Math.random() < .5 ? 1 : 0), angle + (Math.random() < .5 ? Math.PI / 2 : -Math.PI / 2), 1.1);
  }
}

function clearSandSurface() {
  const s = sandSurface;
  if (s.height) s.height.fill(0);
  s.grains.length = 0;
  // Keep the old box as the dirty region so the overlay is wiped on the next frame.
  s.shaded = s.box || s.shaded;
  s.box = null;
}

// One simulation step: slope-dependent slumping (steep edges collapse faster),
// upwind transport by the wind, and a slow settling toward flat.
function updateSandSurface(delta, now) {
  const s = sandSurface;
  const box = s.box;
  if (!box) return;
  const physics = sandMoods[selectedMood] ?? sandMoods.focus;
  const held = now < trailErosionStartsAt;
  const frames = Math.min(delta * 30, 2);
  const relax = (held ? .12 : 1) * physics.relax * frames;
  const decay = held ? 1 : Math.exp(-physics.decay * delta);
  const shift = Math.min(.45, (3 * (windAmount / 12) * physics.wind * delta) / s.cell);
  const W = s.w;
  const H = s.height;
  const S = s.scratch;
  const x0 = Math.max(1, box.x0 - 1), x1 = Math.min(W - 2, box.x1 + 2);
  const y0 = Math.max(1, box.y0 - 1), y1 = Math.min(s.h - 2, box.y1 + 1);
  let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = y * W + x;
      const c = H[i], l = H[i - 1], r = H[i + 1], u = H[i - W], d = H[i + W];
      const gx = (r - l) * .5, gy = (d - u) * .5;
      const k = Math.min(.22, (.012 + .5 * (gx * gx + gy * gy)) * relax);
      let v = (c + k * (l + r + u + d - 4 * c) - shift * (c - l)) * decay;
      const mag = v < 0 ? -v : v;
      if (mag < SAND_EPS * .5) v = 0;
      else if (mag > SAND_EPS) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      S[i] = v;
    }
  }
  for (let y = y0; y <= y1; y++) {
    const row = y * W;
    for (let x = x0; x <= x1; x++) H[row + x] = S[row + x];
  }
  s.box = maxX < 0 ? null : { x0: minX, y0: minY, x1: maxX, y1: maxY };
}

function updateSandGrains(delta) {
  const s = sandSurface;
  const grains = s.grains;
  for (let i = grains.length - 1; i >= 0; i--) {
    const g = grains[i];
    g.vz -= 420 * delta;
    g.x += g.vx * delta;
    g.y += g.vy * delta;
    g.z += g.vz * delta;
    if (g.z <= 0) {
      const gx = Math.floor(g.x / s.cell), gy = Math.floor(g.y / s.cell);
      if (s.height && gx > 1 && gy > 1 && gx < s.w - 2 && gy < s.h - 2) {
        s.height[gy * s.w + gx] += .06;
        growSandBox(gx - 1, gy - 1, gx + 1, gy + 1);
      }
      grains[i] = grains[grains.length - 1];
      grains.pop();
    }
  }
}

// Lights the relief: surfaces facing the light brighten, hollows and shaded walls darken.
function drawSandSurface() {
  const s = sandSurface;
  if (!s.height) return;
  const active = s.box;
  const prev = s.shaded;
  const physics = sandMoods[selectedMood] ?? sandMoods.focus;
  if (active || prev) {
    const W = s.w;
    const H = s.height;
    const data = s.image.data;
    const x0 = Math.max(1, Math.min(active ? active.x0 : 1e9, prev ? prev.x0 : 1e9) - 2);
    const y0 = Math.max(1, Math.min(active ? active.y0 : 1e9, prev ? prev.y0 : 1e9) - 2);
    const x1 = Math.min(W - 2, Math.max(active ? active.x1 : -1, prev ? prev.x1 : -1) + 2);
    const y1 = Math.min(s.h - 2, Math.max(active ? active.y1 : -1, prev ? prev.y1 : -1) + 2);
    const [lx, ly] = physics.dir;
    const [lr, lg, lb] = physics.light;
    const [dr, dg, db] = physics.dark;
    const darkGain = physics.gain * 1.4;
    const lightGain = physics.gain * 1.2;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * W + x;
        const o = i * 4;
        const hc = H[i];
        const gx = (H[i + 1] - H[i - 1]) * .5;
        const gy = (H[i + W] - H[i - W]) * .5;
        const facing = gx * lx + gy * ly;
        let ad = (facing < 0 ? -facing * darkGain : 0) + (hc < 0 ? -hc * .26 : 0);
        let al = (facing > 0 ? facing * lightGain : 0) + (hc > 0 ? hc * .1 : 0);
        if (ad > .8) ad = .8;
        if (al > .6) al = .6;
        if (al > ad && al > .012) {
          data[o] = lr; data[o + 1] = lg; data[o + 2] = lb; data[o + 3] = (al - ad * .5) * 255;
        } else if (ad > .012) {
          data[o] = dr; data[o + 1] = dg; data[o + 2] = db; data[o + 3] = (ad - al * .5) * 255;
        } else {
          data[o + 3] = 0;
        }
      }
    }
    s.canvas.getContext('2d').putImageData(s.image, 0, 0, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
    s.shaded = active ? { x0: active.x0, y0: active.y0, x1: active.x1, y1: active.y1 } : null;
    if (active) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(s.canvas, 0, 0, width, height);
      ctx.restore();
    }
  }
  if (s.grains.length) {
    const [gr, gg, gb] = physics.grain;
    ctx.fillStyle = `rgba(${gr},${gg},${gb},.9)`;
    s.grains.forEach((g) => ctx.fillRect(g.x - .8, g.y - g.z * .6 - .8, 1.6, 1.6));
  }
}

function drawSand(now) {
  if (!stageVisible || document.hidden) { rafId = null; return; }
  if (now - lastRenderedAt < 33) { rafId = requestAnimationFrame(drawSand); return; }
  lastRenderedAt = now;
  const delta = Math.min((now - lastTime) / 1000, .06);
  lastTime = now;
  const t = now * .00018;
  updateVisualizer(now);
  ctx.drawImage(textureCanvas, 0, 0, width, height);
  drawRainWeather(now);
  drawSunsetWeather(now);
  drawDustWeather(now);
  drawMistWeather(now);

  // Layered dune shadows and wind ripples create a more physical top-view surface.
  ctx.globalAlpha = .14;
  for (let i = 0; i < 9; i++) {
    const y = height * (.05 + i * .14) + Math.sin(t + i * 1.7) * 17;
    const gradient = ctx.createLinearGradient(0, y - 100, width, y + 70);
    gradient.addColorStop(0, 'rgba(255,232,180,0)'); gradient.addColorStop(.5, 'rgba(113,71,30,.18)'); gradient.addColorStop(1, 'rgba(255,232,180,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.moveTo(-100, y); ctx.bezierCurveTo(width * .28, y - 55, width * .62, y + 73, width + 100, y - 14); ctx.lineTo(width + 100, y + 88); ctx.lineTo(-100, y + 88); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 13; i++) {
    const y = height * (.1 + i * .071) + Math.sin(t * 1.4 + i * 1.9) * 13;
    ctx.beginPath();
    ctx.moveTo(-30, y);
    ctx.bezierCurveTo(width * .25, y - 18, width * .5, y + 24, width * .72, y - 7);
    ctx.bezierCurveTo(width * .87, y - 20, width * 1.02, y + 5, width + 30, y - 3);
    ctx.strokeStyle = 'rgba(246, 215, 166, .12)'; ctx.lineWidth = 1.1; ctx.stroke();
    ctx.translate(0, 3.5); ctx.strokeStyle = 'rgba(103, 61, 29, .075)'; ctx.stroke(); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  updateSandSurface(delta, now);
  updateSandGrains(delta);
  drawSandSurface();
  rafId = requestAnimationFrame(drawSand);
}

function pointerPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

canvas.addEventListener('pointerdown', (event) => {
  isPointerDown = true; canvas.setPointerCapture(event.pointerId);
  const point = pointerPosition(event); lastPoint = point; preserveSoftTrace(); addMark(point.x, point.y, .86, 18, 1, 0);
});
canvas.addEventListener('pointermove', (event) => {
  const point = pointerPosition(event);
  if (!lastPoint) {
    lastPoint = point;
    return;
  }
  const distance = Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y);
  if (distance < 3) return;
  const traceSpacing = 10;
  const steps = Math.max(1, Math.ceil(distance / traceSpacing));
  const angle = Math.atan2(point.y - lastPoint.y, point.x - lastPoint.x);
  preserveSoftTrace();
  for (let i = 1; i <= steps; i++) {
    const ratio = i / steps;
    addMark(lastPoint.x + (point.x - lastPoint.x) * ratio, lastPoint.y + (point.y - lastPoint.y) * ratio, .32, 11 + Math.random() * 8, 1, angle);
  }
  lastPoint = point;
});
['pointerup', 'pointercancel', 'pointerleave'].forEach((name) => canvas.addEventListener(name, () => { isPointerDown = false; lastPoint = null; }));

function formatTime(seconds) { if (!Number.isFinite(seconds)) return '0:00'; return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`; }

function renderQueue() {
  const queueList = document.querySelector('#queue-list');
  const visibleTracks = queueView === 'favorites'
    ? tracks.filter((track) => favoriteTracks.has(track.title))
    : queueView.startsWith('playlist:')
      ? tracks.filter((track) => playlists.find((playlist) => `playlist:${playlist.id}` === queueView)?.tracks.includes(track.title))
      : tracks;
  queueList.innerHTML = visibleTracks.length ? visibleTracks.map((track) => {
    const index = tracks.indexOf(track);
    return `
    <button class="queue-item${index === trackIndex ? ' active' : ''}" data-index="${index}" type="button" data-tooltip="Play ${track.title}">
      <span>${String(index + 1).padStart(2, '0')}</span>
      <span><strong>${track.title}</strong><small>${track.artist}</small></span>
      <b>${track.duration}</b>
    </button>`;
  }).join('') : `<div class="queue-empty">${t('emptyQueue')}</div>`;
  document.querySelector('#queue-count').textContent = String(tracks.length).padStart(2, '0');
  document.querySelector('#favorite-count').textContent = String(favoriteTracks.size);
  document.querySelector('#show-all-queue').classList.toggle('selected', queueView === 'all');
  document.querySelector('#show-favorites-queue').classList.toggle('selected', queueView === 'favorites');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character]));
}

function renderPlaylistControls() {
  const playlistSelect = document.querySelector('#playlist-select');
  const queuePlaylistFilter = document.querySelector('#queue-playlist-filter');
  playlistSelect.innerHTML = playlists.map((playlist) => `<option value="${escapeHtml(playlist.id)}">${escapeHtml(playlist.name)}</option>`).join('');
  queuePlaylistFilter.innerHTML = `<option value="">${t('myPlaylists')}</option>${playlists.map((playlist) => `<option value="${escapeHtml(playlist.id)}">${escapeHtml(playlist.name)}</option>`).join('')}`;
  const activePlaylistId = queueView.startsWith('playlist:') ? queueView.slice('playlist:'.length) : '';
  queuePlaylistFilter.value = activePlaylistId;
}

function updateFavoriteButton() {
  const button = document.querySelector('#favorite-button');
  const isFavorite = favoriteTracks.has(tracks[trackIndex].title);
  button.textContent = isFavorite ? '♥' : '♡';
  button.classList.toggle('is-favorite', isFavorite);
  button.setAttribute('aria-pressed', String(isFavorite));
  button.setAttribute('aria-label', isFavorite ? 'Remove from favorites' : 'Add to favorites');
  button.dataset.tooltip = isFavorite ? 'Remove from favorites' : 'Add to favorites';
}

function updateTrack(index) {
  trackIndex = (index + tracks.length) % tracks.length;
  const track = tracks[trackIndex];
  document.querySelector('#track-title').textContent = track.title;
  document.querySelector('#track-artist').textContent = track.artist;
  document.querySelector('#duration').textContent = track.duration;
  const trackArt = document.querySelector('#track-art');
  trackArt.style.setProperty('--cover-image', `url("${track.gif}")`);
  trackArt.classList.remove('cover-swap');
  void trackArt.offsetWidth;
  trackArt.classList.add('cover-swap');
  document.querySelectorAll('.queue-item').forEach((item, i) => item.classList.toggle('active', i === trackIndex));
  audio.src = track.src;
  updateFavoriteButton();
}

function nextTrackIndex() {
  if (!shuffleEnabled || tracks.length < 2) return trackIndex + 1;
  let nextIndex = trackIndex;
  while (nextIndex === trackIndex) nextIndex = Math.floor(Math.random() * tracks.length);
  return nextIndex;
}
function createAmbientFallback() {
  if (audioContext) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  ambientGain = audioContext.createGain(); ambientGain.gain.value = .0001; ambientGain.connect(audioContext.destination);
  const padGain = audioContext.createGain(); padGain.gain.value = .42; padGain.connect(ambientGain);
  const pad = audioContext.createOscillator(); pad.type = 'triangle'; pad.frequency.value = 110; pad.connect(padGain); pad.start();
  const harmony = audioContext.createOscillator(); harmony.type = 'sine'; harmony.frequency.value = 164.81; harmony.connect(padGain); harmony.start();
  const lfo = audioContext.createOscillator(); const lfoGain = audioContext.createGain(); lfo.frequency.value = .18; lfoGain.gain.value = .1; lfo.connect(lfoGain); lfoGain.connect(padGain.gain); lfo.start();
  ambientSource = pad;
  ambientBeatTimer = window.setInterval(() => {
    if (!isPlaying || !audioContext) return;
    const beat = audioContext.createOscillator(); const beatGain = audioContext.createGain();
    beat.type = 'sine'; beat.frequency.setValueAtTime(112, audioContext.currentTime); beat.frequency.exponentialRampToValueAtTime(48, audioContext.currentTime + .14);
    beatGain.gain.setValueAtTime(.18, audioContext.currentTime); beatGain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + .22);
    beat.connect(beatGain); beatGain.connect(ambientGain); beat.start(); beat.stop(audioContext.currentTime + .24);
  }, 960);
}

function activateFallback() {
  createAmbientFallback();
  audioContext.resume();
  ambientGain.gain.setTargetAtTime(.08, audioContext.currentTime, .3);
}
function setPlaying(value) {
  isPlaying = value;
  const button = document.querySelector('#play-button'); button.textContent = isPlaying ? 'Ⅱ' : '▶'; button.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play'); button.dataset.tooltip = isPlaying ? 'Pause this song' : 'Play this song';
  document.querySelector('.playing-bars').classList.toggle('paused', !isPlaying);
  if (isPlaying) {
    audio.play().catch(activateFallback);
  } else {
    audio.pause(); if (ambientGain) ambientGain.gain.setTargetAtTime(.0001, audioContext.currentTime, .4);
  }
}
document.querySelector('#play-button').addEventListener('click', () => setPlaying(!isPlaying));
document.querySelector('#next-button').addEventListener('click', () => { updateTrack(nextTrackIndex()); setPlaying(true); });
document.querySelector('#back-button').addEventListener('click', () => { updateTrack(trackIndex - 1); setPlaying(true); });
document.querySelector('#volume').addEventListener('input', (event) => { audio.volume = Number(event.target.value) / 100; if (ambientGain) ambientGain.gain.value = (Number(event.target.value) / 100) * (isPlaying ? .028 : .0001); });
document.querySelector('#progress').addEventListener('input', (event) => { if (audio.duration) audio.currentTime = (Number(event.target.value) / 100) * audio.duration; });
audio.addEventListener('timeupdate', () => { const value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0; document.querySelector('#progress').value = value; document.querySelector('#current-time').textContent = formatTime(audio.currentTime); if (audio.duration) document.querySelector('#duration').textContent = formatTime(audio.duration); });
audio.addEventListener('error', activateFallback);
audio.addEventListener('ended', () => { updateTrack(nextTrackIndex()); setPlaying(true); });
document.querySelector('#queue-list').addEventListener('click', (event) => {
  const item = event.target.closest('.queue-item');
  if (!item) return;
  updateTrack(Number(item.dataset.index));
  setPlaying(true);
});

const queue = document.querySelector('#queue-popover');
document.querySelector('#playlist-button').addEventListener('click', () => { queue.classList.toggle('open'); queue.setAttribute('aria-hidden', String(!queue.classList.contains('open'))); });
document.querySelector('#close-queue').addEventListener('click', () => { queue.classList.remove('open'); queue.setAttribute('aria-hidden', 'true'); });
document.querySelector('#show-all-queue').addEventListener('click', () => { queueView = 'all'; document.querySelector('#queue-playlist-filter').value = ''; renderQueue(); });
document.querySelector('#show-favorites-queue').addEventListener('click', () => { queueView = 'favorites'; document.querySelector('#queue-playlist-filter').value = ''; renderQueue(); });
document.querySelector('#queue-playlist-filter').addEventListener('change', (event) => { queueView = event.target.value ? `playlist:${event.target.value}` : 'all'; renderQueue(); });
document.querySelector('#favorite-button').addEventListener('click', () => {
  const title = tracks[trackIndex].title;
  if (favoriteTracks.has(title)) favoriteTracks.delete(title); else favoriteTracks.add(title);
  writeStorage(storageKeys.favorites, Array.from(favoriteTracks));
  updateFavoriteButton();
  renderQueue();
});
document.querySelector('#theme-toggle').addEventListener('click', () => { const card = document.querySelector('.now-playing'); card.classList.toggle('dark-card'); const dark = card.classList.contains('dark-card'); document.querySelector('#theme-label').textContent = dark ? t('dark') : t('light'); document.querySelector('#theme-toggle').setAttribute('aria-label', `Switch song card to ${dark ? t('light') : t('dark')} mode`); });
document.querySelector('#shuffle-button').addEventListener('click', (event) => { shuffleEnabled = !shuffleEnabled; event.currentTarget.classList.toggle('selected', shuffleEnabled); event.currentTarget.style.color = shuffleEnabled ? 'var(--accent)' : ''; event.currentTarget.dataset.tooltip = shuffleEnabled ? 'Shuffle is on' : 'Play a random song'; });
document.querySelector('#loop-button').addEventListener('click', (event) => { audio.loop = !audio.loop; event.currentTarget.style.color = audio.loop ? 'var(--accent)' : ''; });

const ambiencePanel = document.querySelector('#ambience-panel');
function setAmbiencePanel(open) {
  ambiencePanel.classList.toggle('open', open);
  ambiencePanel.setAttribute('aria-hidden', String(!open));
}
document.querySelector('#settings-button').addEventListener('click', () => setAmbiencePanel(!ambiencePanel.classList.contains('open')));
document.querySelector('#close-settings').addEventListener('click', () => setAmbiencePanel(false));
document.querySelector('#wind-control').addEventListener('input', (event) => {
  windAmount = Number(event.target.value);
  document.querySelector('#wind-output').textContent = `${windAmount}%`;
  document.querySelector('#wind-strength').textContent = `${windAmount}%`;
});
document.querySelector('#trail-control').addEventListener('input', (event) => {
  trailHoldMs = Number(event.target.value) * 1000;
  document.querySelector('#trail-output').textContent = `${(trailHoldMs / 1000).toFixed(1)}s`;
});
const sandControl = document.querySelector('#sand-control');
sandControl.addEventListener('input', (event) => {
  sandContrast = Number(event.target.value) / 100;
  document.querySelector('#sand-output').textContent = `${event.target.value}%`;
});
sandControl.addEventListener('change', () => {
  buildSandTexture();
});
document.querySelector('#card-control').addEventListener('input', (event) => {
  document.querySelector('.now-playing').style.setProperty('--card-alpha', (Number(event.target.value) / 100 * .6).toFixed(3));
  document.querySelector('#card-output').textContent = `${event.target.value}%`;
});
document.querySelector('#clear-sand').addEventListener('click', clearSandSurface);

const moodIcons = { focus: '☀', rainy: '☂', night: '☾', sunset: '◐', dust: '≋', mist: '∿' };
function applyMood(mood) {
  selectedMood = Object.hasOwn(moodIcons, mood) ? mood : 'focus';
  const moodCopy = translations[language].moods[selectedMood];
  sandStage.classList.remove(...Object.keys(moodIcons).map((name) => `mood-${name}`));
  sandStage.classList.add(`mood-${selectedMood}`);
  document.querySelector('#mood-output').textContent = moodCopy.label;
  document.querySelector('#mood-label').textContent = moodCopy.label;
  document.querySelector('#mood-description').textContent = moodCopy.description;
  document.querySelector('#mood-icon').textContent = moodIcons[selectedMood];
  document.querySelectorAll('.mood-option').forEach((option) => {
    const selected = option.dataset.mood === selectedMood;
    option.classList.toggle('selected', selected);
    option.setAttribute('aria-selected', String(selected));
  });
  document.querySelectorAll('.mood-card').forEach((card) => card.classList.toggle('selected', card.dataset.mood === selectedMood));
  writeStorage(storageKeys.mood, selectedMood);
}
document.querySelector('#mood-trigger').addEventListener('click', () => {
  const picker = document.querySelector('#mood-picker');
  const open = picker.classList.toggle('open');
  document.querySelector('#mood-trigger').setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('.mood-option').forEach((option) => option.addEventListener('click', () => {
  applyMood(option.dataset.mood);
  document.querySelector('#mood-picker').classList.remove('open');
  document.querySelector('#mood-trigger').setAttribute('aria-expanded', 'false');
}));
document.querySelectorAll('.mood-card').forEach((card) => card.addEventListener('click', () => {
  applyMood(card.dataset.mood);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}));
document.addEventListener('click', (event) => {
  if (!event.target.closest('#mood-picker')) {
    document.querySelector('#mood-picker').classList.remove('open');
    document.querySelector('#mood-trigger').setAttribute('aria-expanded', 'false');
  }
});

function applyLanguage() {
  document.documentElement.lang = language;
  document.querySelectorAll('[data-i18n]').forEach((element) => { element.textContent = t(element.dataset.i18n); });
  document.querySelectorAll('[data-mood-text]').forEach((element) => { element.textContent = translations[language].moods[element.dataset.moodText].label; });
  document.querySelectorAll('[data-mood-description]').forEach((element) => { element.textContent = translations[language].moods[element.dataset.moodDescription].description; });
  document.querySelector('#language-label').textContent = language === 'en' ? 'ID' : 'EN';
  document.querySelector('#new-playlist-name').placeholder = t('newPlaylist');
  document.querySelector('#new-playlist-name').setAttribute('aria-label', t('newPlaylist'));
  document.querySelector('#playlist-select').setAttribute('aria-label', t('choosePlaylist'));
  document.querySelector('#queue-playlist-filter').setAttribute('aria-label', t('myPlaylists'));
  document.querySelector('#queue-playlist-filter').options[0].textContent = t('myPlaylists');
  document.querySelector('#theme-label').textContent = document.querySelector('.now-playing').classList.contains('dark-card') ? t('dark') : t('light');
  applyMood(selectedMood);
  setVisualizerEnabled(visualizerEnabled, false);
  renderPlaylistControls();
  renderQueue();
}
document.querySelector('#language-toggle').addEventListener('click', () => {
  language = language === 'en' ? 'id' : 'en';
  writeStorage('sandfi:language', language);
  applyLanguage();
});

function setVisualizerEnabled(value) {
  visualizerEnabled = value;
  document.querySelector('#visualizer-toggle').textContent = t(visualizerEnabled ? 'visualizerOn' : 'visualizerOff');
  document.querySelector('#visualizer-toggle').classList.toggle('selected', visualizerEnabled);
  if (arguments.length < 2 || arguments[1] !== false) writeStorage(storageKeys.visualizer, visualizerEnabled);
  updateVisualizer(performance.now());
}
document.querySelector('#visualizer-toggle').addEventListener('click', () => setVisualizerEnabled(!visualizerEnabled));

function showPlaylistStatus(message) {
  const status = document.querySelector('#playlist-status');
  status.textContent = message;
  window.clearTimeout(showPlaylistStatus.timer);
  showPlaylistStatus.timer = window.setTimeout(() => { status.textContent = ''; }, 2600);
}
document.querySelector('#create-playlist').addEventListener('click', () => {
  const input = document.querySelector('#new-playlist-name');
  const name = input.value.trim();
  if (!name) { showPlaylistStatus(t('writePlaylistName')); return; }
  if (playlists.some((playlist) => playlist.name.toLowerCase() === name.toLowerCase())) { showPlaylistStatus(t('playlistExists')); return; }
  const playlist = { id: `playlist-${Date.now()}`, name, tracks: [] };
  playlists.push(playlist);
  writeStorage(storageKeys.playlists, playlists);
  renderPlaylistControls();
  document.querySelector('#playlist-select').value = playlist.id;
  input.value = '';
  showPlaylistStatus(`${t('playlistCreated')} “${name}”`);
});
document.querySelector('#add-to-playlist').addEventListener('click', () => {
  const playlist = playlists.find((item) => item.id === document.querySelector('#playlist-select').value);
  const title = tracks[trackIndex].title;
  if (!playlist) { showPlaylistStatus(t('createPlaylistFirst')); return; }
  if (!playlist.tracks.includes(title)) {
    playlist.tracks.push(title);
    writeStorage(storageKeys.playlists, playlists);
    renderQueue();
    showPlaylistStatus(`“${tracks[trackIndex].title}” — ${t('trackAdded')}`);
  } else showPlaylistStatus(t('trackExists'));
});

const trackMenu = document.querySelector('#track-menu');
function setTrackMenu(open) {
  trackMenu.classList.toggle('open', open);
  trackMenu.setAttribute('aria-hidden', String(!open));
}
document.querySelector('.more-button').addEventListener('click', () => setTrackMenu(!trackMenu.classList.contains('open')));
document.querySelector('#restart-track').addEventListener('click', () => { audio.currentTime = 0; document.querySelector('#progress').value = 0; document.querySelector('#current-time').textContent = '0:00'; setTrackMenu(false); });
document.querySelector('#close-track-menu').addEventListener('click', () => setTrackMenu(false));
window.addEventListener('keydown', (event) => {
  const typing = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName);
  if (typing) return;
  if (event.key === ' ') { event.preventDefault(); setPlaying(!isPlaying); }
  else if (event.key === 'ArrowRight') { event.preventDefault(); updateTrack(nextTrackIndex()); setPlaying(true); }
  else if (event.key === 'ArrowLeft') { event.preventDefault(); updateTrack(trackIndex - 1); setPlaying(true); }
  else if (event.key.toLowerCase() === 'f') document.querySelector('#favorite-button').click();
  else if (event.key.toLowerCase() === 'v') setVisualizerEnabled(!visualizerEnabled);
  else if (event.key.toLowerCase() === 'q') { queue.classList.toggle('open'); queue.setAttribute('aria-hidden', String(!queue.classList.contains('open'))); }
});
window.addEventListener('resize', resize);
document.querySelectorAll('button').forEach((button) => {
  if (!button.dataset.tooltip) button.dataset.tooltip = button.getAttribute('aria-label') || button.textContent.trim();
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('is-visible');
  });
}, { threshold: .16 });
document.querySelectorAll('.reveal-on-scroll').forEach((element) => revealObserver.observe(element));

function applyScrollMotion() {
  const progress = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);
  document.documentElement.style.setProperty('--scroll-progress', progress.toFixed(3));
}
window.addEventListener('scroll', applyScrollMotion, { passive: true });
applyScrollMotion();
const stageObserver = new IntersectionObserver(([entry]) => {
  stageVisible = entry.isIntersecting;
  if (stageVisible && !rafId && !document.hidden) {
    lastTime = performance.now();
    rafId = requestAnimationFrame(drawSand);
  }
}, { threshold: .01 });
stageObserver.observe(sandStage);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && stageVisible && !rafId) {
    lastTime = performance.now();
    rafId = requestAnimationFrame(drawSand);
  }
});
renderPlaylistControls();
applyLanguage();
updateTrack(0); audio.volume = .62; resize();